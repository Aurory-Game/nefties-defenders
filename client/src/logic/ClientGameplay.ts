import { Room } from 'colyseus.js';
import { MessageKind, sendMessage } from 'shared/messages';
import Game from 'src/scenes/Game';
import CardHand from './CardHand';

export default class ClientGameplay {

    hand:CardHand;

    constructor(private room:Room, private game:Game) {
        this.game.input.enabled = false;
        this.hand = new CardHand(game.handRender);
        this.game.handRender.onCardPlay = (index, x, y) => {
            // TODO transform to game field coordinates.
            sendMessage(this.room, MessageKind.PlayCard, this.hand.playCard(index));
        };
    }

    start() {
        this.game.input.enabled = true;
    }

    end() {
        this.game.input.off(Phaser.Input.Events.POINTER_DOWN);
    }

}
