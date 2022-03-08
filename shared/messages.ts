import { CardId } from './cards';

export enum MessageKind {
    CardHand,
    PlayCard,
    PlayCardResult,
}

export type MessageType = {
    [MessageKind.CardHand]:{
        cards:CardId[],
        nextCard:CardId
    },
    [MessageKind.PlayCard]:{
        /** Id of the request. */
        id:number,
        /** Card the player wants to play. */
        card:CardId,
        tileX:number,
        tileY:number
    },
    [MessageKind.PlayCardResult]:{
        /** Id of the request this result is for. */
        id:number,
        /** If card was played, id of the next card, `null` otherwise. */
        nextCard:CardId | null,
    },
}

type Sendable = {
    send:(type:number, msg:unknown) => void;
}

export function sendMessage<T extends MessageKind>(where:Sendable, kind:T, msg:MessageType[T]):void {
    where.send(kind, msg);
}
