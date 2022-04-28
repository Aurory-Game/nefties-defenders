import { EntityType } from './entities';

export enum CardId {
    Beeblock = 1,
    Bitebit,
    BlockChoy,
    BloomTail,
    ChocoMint,
    Dinobit,
    Dipking,
    ShibaIgnite,
    Unika,
    Zzoo,
}

export const CARDS:Record<CardId, CardData> = {
    [CardId.Beeblock]: {
        manaCost: 5,
        entityType: EntityType.Beeblock
    },
    [CardId.Bitebit]: {
        manaCost: 5,
        entityType: EntityType.Bitebit
    },
    [CardId.BlockChoy]: {
        manaCost: 4,
        entityType: EntityType.BlockChoy
    },
    [CardId.BloomTail]: {
        manaCost: 3,
        entityType: EntityType.BloomTail
    },
    [CardId.ChocoMint]: {
        manaCost: 4,
        entityType: EntityType.ChocoMint
    },
    [CardId.Dinobit]: {
        manaCost: 7,
        entityType: EntityType.Dinobit
    },
    [CardId.Dipking]: {
        manaCost: 4,
        entityType: EntityType.Dipking
    },
    [CardId.ShibaIgnite]: {
        manaCost: 10,
        entityType: EntityType.ShibaIgnite
    },
    [CardId.Unika]: {
        manaCost: 6,
        entityType: EntityType.Unika
    },
    [CardId.Zzoo]: {
        manaCost: 4,
        entityType: EntityType.Zzoo
    },
};

export type CardData = {
    manaCost:number;
    entityType:EntityType;
}
