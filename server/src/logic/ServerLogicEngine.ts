import { Client } from 'colyseus';
import Vector2 from 'navmesh/dist/math/vector-2';
import { CARDS, CardData, CardId } from '../../../shared/cards';
import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, MANA_MAX, MANA_REGEN_TICKS, TICKS_1S,
    TICKS_3S, isWater} from '../../../shared/constants';
import { ENTITIES, EntityData, EntityState, EntityType } from '../../../shared/entities';
import { GameState } from '../../../shared/GameState';
import { MessageKind, MessageType, sendMessage } from '../../../shared/messages';
import CrRoom from '../rooms/CrRoom';
import { CrRoomSync, EntitySync, PlayerSync } from '../schema/CrRoomSync';
import { collideEntities, moveEntity } from './entityLogic';
import Field from './Field';
import PlayerDeck from './PlayerDeck';
import * as SAT from 'sat';

export default class ServerLogicEngine {

    private room:CrRoom;
    private sync:CrRoomSync;
    private players:Map<string, PlayerData> = new Map();
    private entities:Map<string, EntityLogicData> = new Map();
    private field:Field = new Field();
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
            sync: playerSync,
            deck: new PlayerDeck()
        };
        sendMessage(client, MessageKind.CARD_HAND, data.deck.getHand());
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
            this.players.forEach(player => player.sync.secret.manaRegenLastTick = this.sync.nextStateAt);
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
        // Entity update.
        const entities = [...this.entities.values()];
        for (const entity of entities) {
            // TODO validate target.
            if (this.sync.tick >= entity.nextStateAt) { // Switch state if needed.
                switch (entity.sync.state) {
                case EntityState.ATTACKING:
                    // TODO handle attacking.
                    break;
                case EntityState.SPAWNING:
                    // TODO proper AI, pick target, check distances, etc.
                    if (entity.data.walkSpeed == 0) {
                        entity.sync.state = EntityState.STANDING;
                    } else {
                        entity.sync.state = EntityState.MOVING;
                        // Let's just go to the center of opposite side for now.
                        const targetPos = { x: 9, y: entity.owner.sync.secret.isFlipped ? 32 - 6 : 6 };
                        entity.path = this.field.getPath(entity.geom.pos, targetPos, entity.data.isFlying);
                        entity.pathIndex = 1; // We are already at point 0.
                    }
                    break;
                }
            }
            if (entity.sync.state == EntityState.MOVING) {
                if (moveEntity(entity, entity.data.walkSpeed)) {
                    entity.sync.state = EntityState.ATTACKING;
                    // TODO targeting system.
                }
            }

            if (entity.geom instanceof SAT.Circle) {
                this.field.collideWalls(entity.geom, entity.data.isFlying);
            }

        }
        collideEntities(entities);
        for (const entity of entities) { // Sync positions.
            entity.sync.tileX = entity.geom.pos.x;
            entity.sync.tileY = entity.geom.pos.y;
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
        const entitySync = new EntitySync(x, y, type, owner.key);
        const data = ENTITIES[type];
        const pos = new SAT.Vector(x, y);
        let geom;
        switch (data.size.t) {
        case 'circle':
            geom = new SAT.Circle(pos, data.size.size / 2);
            break;
        case 'square':
            geom = new SAT.Box(pos, data.size.size, data.size.size).toPolygon();
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
    }

}

type PlayerData = {
    key:string,
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
