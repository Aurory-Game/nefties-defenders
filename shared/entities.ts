export enum EntityType {
    BigTower = 1,
    SmallTower,
    MeleeFighter,
    RangedFighter,
    Flying,
}

export type EntityData = {
    hitpoints:number;
    /** How much damage is caused per attack. */
    damage:number;
    /** Distance this unit can attack at, in tiles. */
    range:number;
    /** How often the unit attacks, in seconds. */
    hitSpeed:number;
    /** How fast the unit moves, in tiles per second. */
    walkSpeed:number;
    isFlying:boolean;
    size:EntitySize;
}

type EntitySize = { t:'circle', size:number } | { t:'square', size:number };

export const ENTITIES:Record<EntityType, EntityData> = {
    [EntityType.BigTower]: {
        hitpoints: 15000,
        damage: 500,
        range: 8,
        hitSpeed: 4,
        walkSpeed: 0,
        isFlying: false,
        size: { t: 'square', size: 4 }
    },
    [EntityType.SmallTower]: {
        hitpoints: 10000,
        damage: 300,
        range: 6,
        hitSpeed: 2,
        walkSpeed: 0,
        isFlying: false,
        size: { t: 'square', size: 3 }
    },
    [EntityType.MeleeFighter]: {
        hitpoints: 1000,
        damage: 100,
        range: 1.5,
        hitSpeed: 1,
        walkSpeed: 2,
        isFlying: false,
        size: { t: 'circle', size: 0.6 }
    },
    [EntityType.RangedFighter]: {
        hitpoints: 750,
        damage: 75,
        range: 6,
        hitSpeed: 1.2,
        walkSpeed: 2.25,
        isFlying: false,
        size: { t: 'circle', size: 0.4 }
    },
    [EntityType.Flying]: {
        hitpoints: 600,
        damage: 50,
        range: 1.5,
        hitSpeed: 0.7,
        walkSpeed: 2.6,
        isFlying: true,
        size: { t: 'circle', size: 0.4 }
    },
};

/** The minimum range needed to consider a unit Ranged. */
const RANGED_RANGE = 4;

export function canTarget(attacker:EntityType, victim:EntityType):boolean {
    const atk = ENTITIES[attacker];
    const vic = ENTITIES[victim];
    return !vic.isFlying || atk.isFlying || atk.range > RANGED_RANGE;
}

export enum EntityState {
    SPAWNING = 1,
    MOVING,
    ATTACKING,
}
