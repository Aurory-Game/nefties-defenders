import { Client } from 'colyseus';
import { CARDS, CardData, CardId } from '../../../shared/cards';
import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, MANA_MAX, MANA_REGEN_TICKS, TICKS_1S,
    TICKS_3S, isWater} from '../../../shared/constants';
import { GameState } from '../../../shared/GameState';
import { MessageKind, MessageType, sendMessage } from '../../../shared/messages';
import CrRoom from '../rooms/CrRoom';
import { CrRoomSync, EntitySync, PlayerSync } from '../schema/CrRoomSync';
import PlayerDeck from './PlayerDeck';

export default class ServerLogicEngine {

    private room:CrRoom;
    private sync:CrRoomSync;
    private players:Map<string, PlayerData> = new Map();
    private entities:Map<string, EntityData> = new Map();
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
                this.spawnEntity(tileX + 0.5, tileY + 0.5, card, player);
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

    spawnEntity(x:number, y:number, cardId:CardId, owner:PlayerData) {
        const id = 'e'+this.ids++;
        const entitySync = new EntitySync(x, y, cardId, owner.key);
        const data:EntityData = {
            owner,
            sync: entitySync,
            nextStateAt: this.sync.tick + TICKS_1S,
            target: null
        };
        this.sync.entities.set(id, entitySync);
        this.entities.set(id, data);
    }

}

type PlayerData = {
    key:string,
    sync:PlayerSync,
    deck:PlayerDeck,
}

type EntityData = {
    sync:EntitySync,
    owner:PlayerData,
    nextStateAt:number,
    target:EntityData | null,
}
