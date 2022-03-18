import { Client } from 'colyseus';
import Vector2 from 'navmesh/dist/math/vector-2';
import { CARDS, CardData, CardId } from '../../../shared/cards';
import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, MANA_MAX, MANA_REGEN_TICKS, TICKS_1S,
    TICKS_3S, TOWERS, isWater} from '../../../shared/constants';
import { ENTITIES, EntityData, EntityType } from '../../../shared/entities';
import { GameState } from '../../../shared/GameState';
import { MessageKind, MessageType, sendMessage } from '../../../shared/messages';
import CrRoom from '../rooms/CrRoom';
import { CrRoomSync, EntitySync, PlayerSync } from '../schema/CrRoomSync';
import EntityManager from './EntityManager';
import Field from './Field';
import PlayerDeck from './PlayerDeck';
import * as SAT from 'sat';

export default class ServerLogicEngine {

    private room:CrRoom;
    private sync:CrRoomSync;
    private players:Map<string, PlayerData> = new Map();
    private entities:Map<string, EntityLogicData> = new Map();
    private field:Field = new Field();
    private entityManager:EntityManager = new EntityManager(this.field);
    private ids:number = 1;

    constructor(room:CrRoom) {
        this.room = room;
        this.sync = room.state;
    }

    addPlayer(client:Client) {
        const playerSync = new PlayerSync(client.sessionId); // Using sessionId as player name for the prototype.
        if (this.sync.players.size > 0) {
            playerSync.secret.isFlipped = true;
        }
        this.sync.players.set(client.sessionId, playerSync);

        const data:PlayerData = {
            key: client.sessionId,
            client,
            sync: playerSync,
            deck: new PlayerDeck()
        };
        this.players.set(client.sessionId, data);
    }

    removePlayer(client:Client) {
        this.players.delete(client.sessionId);
        this.sync.players.delete(client.sessionId);
    }

    start() {
        if (this.sync.state == GameState.WAITING) {
            this.sync.state = GameState.STARTING;
            this.sync.nextStateAt = this.sync.tick + TICKS_3S; // Start in three seconds.
            for (const player of this.players.values()) {
                player.sync.secret.manaRegenLastTick = this.sync.nextStateAt;
                sendMessage(player.client, MessageKind.CARD_HAND, player.deck.getHand());
                for (const tower of TOWERS) {
                    let { x, y } = tower;
                    if (player.sync.secret.isFlipped) {
                        x = FIELD_TILES_WIDTH - x;
                        y = FIELD_TILES_HEIGHT - y;
                    }
                    this.spawnEntity(x, y, tower.type, player);
                }
            }
            const buildings = [];
            for (const e of this.entities.values()) if (e.geom instanceof SAT.Polygon) buildings.push(e.geom);
            this.field.initialize(buildings);
        }
    }

    update() {
        switch (this.sync.state) {
        case GameState.STARTING:
            if (this.sync.tick >= this.sync.nextStateAt) {
                this.sync.state = GameState.PLAYING;
            }
            break;
        case GameState.PLAYING:{
            this.gameLogic();
            break;
        }
        case GameState.DONE:
            if (this.sync.tick >= this.sync.nextStateAt) {
                this.room.disconnect();
            }
            break;
        }
    }

    gameLogic() {
        // Mana regen.
        for (const player of this.players.values()) {
            const secret = player.sync.secret;
            if (secret.mana < MANA_MAX && this.sync.tick >= secret.manaRegenLastTick + MANA_REGEN_TICKS) {
                secret.mana++;
                secret.manaRegenLastTick = this.sync.tick;
            }
        }
        this.entityManager.update(this.sync.tick);
        for (const [key, entity] of this.entities) {
            if (entity.sync.hp <= 0) {
                this.entities.delete(key);
                if (entity.geom instanceof SAT.Polygon) this.field.removeBuilding(entity.geom);
                const i = this.entityManager.entities.indexOf(entity);
                if (i >= 0) this.entityManager.entities.splice(i, 1);
                this.sync.entities.delete(key);
            }
        }
    }

    onPlayCard(client:Client, msg:MessageType[MessageKind.PLAY_CARD] | undefined) {
        const player = this.players.get(client.sessionId);
        if (!player || !msg) return; // Player doesn't exist or invalid request.
        // Sanitize input.
        const {id, card, tileX, tileY} = msg;
        if (!Number.isInteger(id) || !Number.isInteger(card) || !Number.isInteger(tileX) || !Number.isInteger(tileY))
            return; // Invalid data, exit without response.
        // Validate input.
        function fail() {
            sendMessage(client, MessageKind.PLAY_CARD_RESULT, { id: id, nextCard: null });
        }
        if (!player.deck.hasCard(card)) {
            fail();
        } else {
            const cardData = CARDS[card as CardId];
            if (!this.canSpawn(cardData, player, tileX, tileY)) {
                fail();
            } else if (player.sync.secret.mana < cardData.manaCost) {
                // TODO implement pre-placement (if not enough mana, but close, delay the card play a bit).
                fail(); // Not enough mana.
            } else {
                player.deck.useCard(card);
                this.useMana(player, cardData.manaCost);
                this.spawnEntity(tileX + 0.5, tileY + 0.5, cardData.entityType, player);
                sendMessage(client, MessageKind.PLAY_CARD_RESULT, {
                    id: id,
                    nextCard: player.deck.getNextCard(),
                });
            }
        }
    }

    canSpawn(cardData:CardData, player:PlayerData, tileX:number, tileY:number):boolean {
        // TODO tower influence.
        return tileX >= 0 && tileX < FIELD_TILES_WIDTH
            && tileY >= 0 && tileY < FIELD_TILES_HEIGHT
            && !isWater(tileX, tileY);
    }

    useMana(player:PlayerData, mana:number):void {
        const { secret } = player.sync;
        if (secret.mana == MANA_MAX) { // If mana was maxed out, reset regen.
            secret.manaRegenLastTick = this.sync.tick;
        }
        secret.mana -= mana;
    }

    spawnEntity(x:number, y:number, type:EntityType, owner:PlayerData) {
        const id = 'e'+this.ids++;
        const data = ENTITIES[type];
        const entitySync = new EntitySync(x, y, type, data.hitpoints, owner.key);
        const pos = new SAT.Vector(x, y);
        const { size } = data.size;
        const halfSize = size / 2;
        let geom;
        switch (data.size.t) {
        case 'circle':
            geom = new SAT.Circle(pos, size / 2);
            break;
        case 'square':
            geom = new SAT.Polygon(pos, [
                new SAT.Vector(-halfSize, -halfSize),
                new SAT.Vector(halfSize, -halfSize),
                new SAT.Vector(halfSize, halfSize),
                new SAT.Vector(-halfSize, halfSize),
            ]);
            break;
        }
        const logicData:EntityLogicData = {
            owner,
            geom,
            data,
            sync: entitySync,
            nextStateAt: this.sync.tick + TICKS_1S,
            target: null,
            path: null,
            pathIndex: 0
        };
        this.sync.entities.set(id, entitySync);
        this.entities.set(id, logicData);
        this.entityManager.entities.push(logicData);
    }

}

type PlayerData = {
    key:string,
    client:Client,
    sync:PlayerSync,
    deck:PlayerDeck,
}

export type EntityLogicData = {
    sync:EntitySync,
    owner:PlayerData,
    geom:SAT.Circle|SAT.Polygon,
    data:EntityData,
    nextStateAt:number,
    target:EntityLogicData | null,
    path:Vector2[] | null,
    pathIndex:number
}
