import { Room } from 'colyseus.js';
import { MessageKind, sendMessage } from 'shared/messages';
import Game from 'src/scenes/Game';
import CardHand from './CardHand';

export default class ClientGameplay {

    hand:CardHand = new CardHand();

    constructor(private room:Room, private game:Game) { }

    start() {
        this.game.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.playCard());
        // TODO Card Hand UI + events for card state changes.
    }

    end() {
        this.game.input.off(Phaser.Input.Events.POINTER_DOWN);
    }

    playCard() {
        sendMessage(this.room, MessageKind.PlayCard, this.hand.playCard(0));
    }

}
