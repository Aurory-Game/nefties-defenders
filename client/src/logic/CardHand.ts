import { CardId } from 'shared/cards';
import { MessageKind, MessageType } from 'shared/messages';
import CardHandRender from 'src/render/CardHandRender';

export default class CardHand {

    cards:CardId[];
    nextCard:CardId;
    cardPlayId:number = 1;
    requests:PlayCardRequest[] = [];
    results:MessageType[MessageKind.PlayCardResult][] = [];

    constructor(private render:CardHandRender) { }

    onCardHand(msg:MessageType[MessageKind.CardHand]):void {
        this.cards = msg.cards;
        this.nextCard = msg.nextCard;
        this.render.setCard(-1, this.nextCard);
        for (let i = 0; i < this.cards.length; i++) this.render.setCard(i, this.cards[i]);
    }

    playCard(index:number):MessageType[MessageKind.PlayCard] {
        this.requests.push({
            id: this.cardPlayId++,
            handIndex: index
        });
        return {
            id: this.cardPlayId,
            card: this.cards[index]
        };
    }

    onPlayCardResult(msg:MessageType[MessageKind.PlayCardResult]):void {
        // Cache, and only process on after schema sync. Colyseus sends messages and schema sync separately,
        // but we consider messages part of state, and it's therefore consistent only after schema sync.
        // We want to avoid our local update working with partially applied state.
        this.results.push(msg);
    }

    onAfterSchemaSync() {
        for (const res of this.results) {
            const reqId = this.requests.findIndex(r => r.id == res.id);
            const req = this.requests.splice(reqId, 1)[0];
            if (res.nextCard) { // Play was successful.
                // TODO properly manage hand state while in-flight.
                this.cards[req.handIndex] = this.nextCard;
                this.nextCard = res.nextCard;
                this.render.setCard(-1, res.nextCard);
            }
            this.render.setCard(req.handIndex, this.cards[req.handIndex]);
        }
        this.results.length = 0;
    }
}

type PlayCardRequest = {
    id:number,
    handIndex:number,
}
