import { CardId } from './cards';

export enum MessageKind {
    CARD_HAND,
    PLAY_CARD,
    PLAY_CARD_RESULT,
    GAME_OVER,
    PROJECTILE,
}

export type MessageType = {
    [MessageKind.CARD_HAND]:{
        cards:CardId[],
        nextCard:CardId
    },
    [MessageKind.PLAY_CARD]:{
        /** Id of the request. */
        id:number,
        /** Card the player wants to play. */
        card:CardId,
        tileX:number,
        tileY:number
    },
    [MessageKind.PLAY_CARD_RESULT]:{
        /** Id of the request this result is for. */
        id:number,
        /** If card was played, id of the next card, `null` otherwise. */
        nextCard:CardId | null,
    },
    [MessageKind.GAME_OVER]:{
        winner?:string
    },
    [MessageKind.PROJECTILE]:{
        attacker:string,
        victim:string,
    },
}

type Sendable = {
    send:(type:number, msg:unknown) => void;
}

type Broadcastable = {
    broadcast(type:number, message:unknown):unknown;
}

export function sendMessage<T extends MessageKind>(where:Sendable, kind:T, msg:MessageType[T]):void {
    where.send(kind, msg);
}

export function broadcastMessage<T extends MessageKind>(where:Broadcastable, kind:T, msg:MessageType[T]):void {
    where.broadcast(kind, msg);
}
