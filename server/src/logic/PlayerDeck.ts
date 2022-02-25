import { CardId } from '../../../shared/cards';
import { HAND_SIZE } from '../../../shared/constants';
import { PlayerSecretSync } from '../schema/CrRoomSync';

export default class PlayerDeck {

    private deck:CardId[];
    private deckIndex:number;
    private hand:CardId[];

    constructor(private secret:PlayerSecretSync) {
        this.deck = dummyDeck.slice();
        this.shuffle();
        this.hand = this.deck.splice(0, HAND_SIZE);
        for (let i = 0; i < HAND_SIZE; i++) {
            this.secret.cardsHand.push(this.hand[i]);
        }
        this.deckIndex = 0;
        this.secret.cardsNext = this.deck[0];
    }

    useCard(index:number):void {
        const newCard = this.deck[this.deckIndex]; // Take next card.
        this.deck[this.deckIndex] = this.hand[index]; // Put the used one back in the deck.
        this.deckIndex = (this.deckIndex + 1) % this.deck.length; // Move it to the end.
        this.hand[index] = newCard;
        this.secret.cardsHand[index] = newCard;
        this.secret.cardsNext = this.deck[this.deckIndex];
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

/** Dummy deck for the prototype. Every player has the same deck. */
const dummyDeck:CardId[] = [
    CardId.MeleeFighter,
    CardId.MeleeFighter,
    CardId.MeleeFighter,
    CardId.MeleeFighter,
    CardId.MeleeFighter,
    CardId.RangedFighter,
    CardId.RangedFighter,
    CardId.RangedFighter,
    CardId.RangedFighter,
    CardId.RangedFighter,
    CardId.Flying,
    CardId.Flying,
    CardId.Flying,
    CardId.Flying,
];
