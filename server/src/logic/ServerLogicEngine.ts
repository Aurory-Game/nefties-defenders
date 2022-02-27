import { Client } from 'colyseus';
import { CARDS, CardData, CardId } from '../../../shared/cards';
import { MANA_MAX, MANA_REGEN_TICKS, TICKS_3S } from '../../../shared/constants';
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
        if (!player) return; // Player doesn't exist.
        const id = msg?.id;
        if (!isFinite(id as number)) return; // Invalid request, exit without response.
        const cardId = msg?.card;
        function fail() {
            sendMessage(client, MessageKind.PlayCardResult, { id: id as number, nextCard: null, entityId: null});
        }
        if (!isFinite(cardId as number) || !player.deck.hasCard(cardId as CardId)) {
            fail(); // Invalid card, or player does not have it.
        } else {
            // TODO validate position.
            const cardData = CARDS[cardId as CardId];
            if (player.sync.secret.mana < cardData.manaCost) {
                // TODO implement pre-placement (if not enough mana, but close, delay the card play a bit).
                fail(); // Not enough mana.
            } else {
                player.deck.useCard(cardId as CardId);
                this.useMana(player, cardData.manaCost);
                this.spawnEntity(msg?.x as number, msg?.y as number, cardId as CardId);
                sendMessage(client, MessageKind.PlayCardResult, {
                    id: id as number,
                    nextCard: player.deck.getNextCard(),
                    entityId: null, // TODO implement card behavior.
                });
            }
        }
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
