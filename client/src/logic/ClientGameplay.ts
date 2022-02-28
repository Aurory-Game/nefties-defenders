import { Room } from 'colyseus.js';
import { FIELD_HEIGHT, FIELD_WIDTH } from 'shared/constants';
import { MessageKind, sendMessage } from 'shared/messages';
import Game from 'scenes/Game';
import CardHand from './CardHand';

export default class ClientGameplay {

    hand:CardHand;
    public isFlipped:boolean = false;

    constructor(private room:Room, private game:Game) {
        this.game.input.enabled = false;
        this.hand = new CardHand(game.handRender);
        this.game.handRender.onCardPlay = (index, x, y) => {
            const p = this.game.field.background.getLocalPoint(x, y);
            if (this.isFlipped) {
                p.x = FIELD_WIDTH - p.x;
                p.y = FIELD_HEIGHT - p.y;
            }
            const cardReq = this.hand.playCard(index);
            sendMessage(this.room, MessageKind.PlayCard, {
                card: cardReq.card,
                id: cardReq.id,
                x: p.x,
                y: p.y
            });
        };
    }

    start() {
        this.game.input.enabled = true;
    }

    end() {
        this.game.input.off(Phaser.Input.Events.POINTER_DOWN);
    }

}
