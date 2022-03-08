import { CardId } from 'shared/cards';
import { MessageKind, MessageType } from 'shared/messages';
import CardHandRender from 'render/CardHandRender';

export default class CardHand {

    cards:CardId[];
    onRequestConfirmed:(id:number) => void;
    private nextCard:CardId;
    private cardPlayId:number = 1;
    private requests:PlayCardRequest[] = [];
    private results:MessageType[MessageKind.PlayCardResult][] = [];

    constructor(private render:CardHandRender) { }

    onCardHand(msg:MessageType[MessageKind.CardHand]):void {
        this.cards = msg.cards;
        this.nextCard = msg.nextCard;
        this.render.setCard(-1, this.nextCard);
        for (let i = 0; i < this.cards.length; i++) this.render.setCard(i, this.cards[i]);
    }

    playCard(index:number):{id:number, card:CardId} {
        const id = this.cardPlayId++;
        this.requests.push({ id, handIndex: index });
        return { id, card: this.cards[index] };
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
            if (reqId == -1) console.error(`Unknown confirmation id ${res.id}.`);
            const req = this.requests.splice(reqId, 1)[0];
            if (res.nextCard) { // Play was successful.
                this.cards[req.handIndex] = this.nextCard;
                this.nextCard = res.nextCard;
                this.render.setCard(-1, res.nextCard);
            }
            this.render.setCard(req.handIndex, this.cards[req.handIndex]);
            this.onRequestConfirmed?.(res.id);
        }
        this.results.length = 0;
    }

    getNextId():number {
        return this.cardPlayId;
    }
}

type PlayCardRequest = {
    id:number,
    handIndex:number,
}
