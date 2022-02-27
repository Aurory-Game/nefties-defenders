import { CardId } from 'shared/cards';
import { MessageKind, MessageType } from 'shared/messages';

export default class CardHand {

    cards:CardId[];
    nextCard:CardId;
    cardPlayId:number = 1;
    requests:PlayCardRequest[] = [];
    results:MessageType[MessageKind.PlayCardResult][] = [];

    onCardHand(msg:MessageType[MessageKind.CardHand]):void {
        this.cards = msg.cards;
        this.nextCard = msg.nextCard;
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
            }
        }
        this.results.length = 0;
    }
}

type PlayCardRequest = {
    id:number,
    handIndex:number,
}
