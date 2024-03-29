import { CardId } from '../../../shared/cards';
import { HAND_SIZE } from '../../../shared/constants';
import { MessageKind, MessageType } from '../../../shared/messages';

export default class PlayerDeck {

    private deck:CardId[];
    private deckIndex:number;
    private hand:CardId[];

    constructor() {
        this.deck = uniqueCards.concat();
        this.shuffle();
        this.deck.length = 8;
        this.hand = this.deck.splice(0, HAND_SIZE);
        this.deckIndex = 0;
    }

    getHand():MessageType[MessageKind.CARD_HAND] {
        return {
            cards: this.hand,
            nextCard: this.getNextCard()
        };
    }

    hasCard(card:CardId):boolean {
        return this.hand.includes(card);
    }

    useCard(card:CardId):void {
        const index = this.hand.indexOf(card);
        if (index < 0) throw 'Cannot use card that the hand does not have.';
        this.hand[index] = this.deck[this.deckIndex]; // Take next card.
        this.deck[this.deckIndex] = card; // Put the used one back in the deck.
        this.deckIndex = (this.deckIndex + 1) % this.deck.length; // Move it to the end.
    }

    getNextCard() {
        return this.deck[this.deckIndex];
    }

    /** Fisher-Yates shuffle. */
    private shuffle():void {
        let i = this.deck.length;
        while (--i > 0) {
            const randIndex = Math.floor(Math.random() * (i+1));
            const temp = this.deck[randIndex];
            this.deck[randIndex] = this.deck[i];
            this.deck[i] = temp;
        }
    }
}

const uniqueCards:CardId[] = [
    CardId.Beeblock,
    CardId.Bitebit,
    CardId.BlockChoy,
    CardId.BloomTail,
    CardId.ChocoMint,
    CardId.Dinobit,
    CardId.Dipking,
    CardId.ShibaIgnite,
    CardId.Unika,
    CardId.Zzoo,
];
