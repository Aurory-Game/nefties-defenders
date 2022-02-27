export enum CardId {
    MeleeFighter = 1,
    RangedFighter,
    Flying,
}

export const CARDS:Record<CardId, CardData> = {
    [CardId.MeleeFighter]: {
        manaCost: 3,
        hitpoints: 1000,
        damage: 100,
        range: 100,
        hitSpeed: 1,
        walkSpeed: 50,
        isFlying: false,
    },
    [CardId.RangedFighter]: {
        manaCost: 4,
        hitpoints: 750,
        damage: 75,
        range: 250,
        hitSpeed: 1.2,
        walkSpeed: 65,
        isFlying: false,
    },
    [CardId.Flying]: {
        manaCost: 5,
        hitpoints: 600,
        damage: 50,
        range: 100,
        hitSpeed: 0.7,
        walkSpeed: 70,
        isFlying: true,
    },
};

export type CardData = {
    manaCost:number;
    hitpoints:number;
    /** How much damage is caused per attack. */
    damage:number;
    /** Distance this unit can attack at, in logical pixels. */
    range:number;
    /** How often the unit attacks, in seconds. */
    hitSpeed:number;
    /** How fast the unit moves, in logical pixels per second. */
    walkSpeed:number;
    isFlying:boolean;
}

/** The minimum range needed to consider a unit Ranged. */
const RANGED_RANGE = 250;

export function canTarget(attacker:CardId, victim:CardId):boolean {
    const atk = CARDS[attacker];
    const vic = CARDS[victim];
    return !vic.isFlying || atk.isFlying || atk.range > RANGED_RANGE;
}
