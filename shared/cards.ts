import { EntityType } from './entities';

export enum CardId {
    MeleeFighter = 1,
    RangedFighter,
    Flying,
}

export const CARDS:Record<CardId, CardData> = {
    [CardId.MeleeFighter]: {
        manaCost: 3,
        entityType: EntityType.MeleeFighter
    },
    [CardId.RangedFighter]: {
        manaCost: 4,
        entityType: EntityType.RangedFighter
    },
    [CardId.Flying]: {
        manaCost: 5,
        entityType: EntityType.Flying
    },
};

export type CardData = {
    manaCost:number;
    entityType:EntityType;
}
