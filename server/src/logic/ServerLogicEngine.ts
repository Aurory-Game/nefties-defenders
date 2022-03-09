import { Client } from 'colyseus';
import { CARDS, CardData, CardId } from '../../../shared/cards';
import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH, MANA_MAX, MANA_REGEN_TICKS, TICKS_3S,
    isWater } from '../../../shared/constants';
import { GAME_STATE } from '../../../shared/GAME_STATE';
import { MessageKind, MessageType, sendMessage } from '../../../shared/messages';
import CrRoom from '../rooms/CrRoom';
import { CrRoomSync, EntitySync, PlayerSync } from '../schema/CrRoomSync';
import PlayerDeck from './PlayerDeck';

export default class ServerLogicEngine {

    private room:CrRoom;
    private sync:CrRoomSync;
    private players:Map<string, PlayerData>;
    private ids:number = 1;

    constructor(room:CrRoom) {
        this.room = room;
        this.sync = room.state;
        this.players = new Map();
    }

    addPlayer(client:Client) {
        const playerSync = new PlayerSync(client.sessionId); // Using sessionId as player name for the prototype.
        if (this.sync.players.size > 0) {
            playerSync.secret.isFlipped = true;
        }
        this.sync.players.set(client.sessionId, playerSync);

        const data:PlayerData = {
            sync: playerSync,
            deck: new PlayerDeck()
        };
        sendMessage(client, MessageKind.CardHand, data.deck.getHand());
        this.players.set(client.sessionId, data);
    }

    removePlayer(client:Client) {
        this.players.delete(client.sessionId);
        this.sync.players.delete(client.sessionId);
    }

    start() {
        if (this.sync.state == GAME_STATE.WAITING) {
            this.sync.state = GAME_STATE.STARTING;
            this.sync.nextStateAt = this.sync.tick + TICKS_3S; // Start in three seconds.
            this.players.forEach(player => player.sync.secret.manaRegenLastTick = this.sync.nextStateAt);
        }
    }

    update() {
        switch (this.sync.state) {
        case GAME_STATE.STARTING:
            if (this.sync.tick >= this.sync.nextStateAt) {
                this.sync.state = GAME_STATE.PLAYING;
            }
            break;
        case GAME_STATE.PLAYING:{
            this.gameLogic();
            break;
        }
        case GAME_STATE.DONE:
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

    onPlayCard(client:Client, msg:MessageType[MessageKind.PlayCard] | undefined) {
        const player = this.players.get(client.sessionId);
        if (!player || !msg) return; // Player doesn't exist or invalid request.
        // Sanitize input.
        const {id, card, tileX, tileY} = msg;
        if (!Number.isInteger(id) || !Number.isInteger(card) || !Number.isInteger(tileX) || !Number.isInteger(tileY))
            return; // Invalid data, exit without response.
        // Validate input.
        function fail() {
            sendMessage(client, MessageKind.PlayCardResult, { id: id, nextCard: null });
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
                this.spawnEntity(tileX + 0.5, tileY + 0.5, card);
                sendMessage(client, MessageKind.PlayCardResult, {
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

    spawnEntity(x:number, y:number, cardId:CardId) {
        const id = 'e'+this.ids++;
        const entitySync = new EntitySync(x, y, cardId);
        this.sync.entities.set(id, entitySync);
    }

}

type PlayerData = {
    sync:PlayerSync,
    deck:PlayerDeck,
}
