import { FIELD_TILES_HEIGHT, FIELD_TILES_WIDTH } from './constants';

export enum EntityType {
    BigTower = 1,
    SmallTower,
    Beeblock,
    Bitebit,
    BlockChoy,
    BloomTail,
    ChocoMint,
    Dinobit,
    Dipking,
    ShibaIgnite,
    Unika,
    Zzoo
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
    skin:string|null;
}

type EntitySize = { t:'circle', size:number } | { t:'square', size:number };

export const ENTITIES:Record<EntityType, EntityData> = {
    [EntityType.BigTower]: {
        hitpoints: 5000,
        damage: 500,
        range: 8,
        hitSpeed: 4,
        walkSpeed: 0,
        isFlying: false,
        size: { t: 'square', size: 4 },
        skin: null,
    },
    [EntityType.SmallTower]: {
        hitpoints: 3000,
        damage: 300,
        range: 6,
        hitSpeed: 2,
        walkSpeed: 0,
        isFlying: false,
        size: { t: 'square', size: 3 },
        skin: null,
    },
    [EntityType.Beeblock]: {
        skin: 'Beeblock',
        isFlying: true,
        size: { t: 'circle', size: 0.4 },
        hitpoints: 600,
        damage: 70,
        range: 2,
        hitSpeed: 1,
        walkSpeed: 2.5
    },
    [EntityType.Bitebit]: {
        skin: 'Bitebit',
        isFlying: false,
        size: { t: 'circle', size: 0.7 },
        hitpoints: 1000,
        damage: 200,
        range: 1.5,
        hitSpeed: 1,
        walkSpeed: 2
    },
    [EntityType.BlockChoy]: {
        skin: 'BlockChoy',
        isFlying: false,
        size: { t: 'circle', size: 0.5 },
        hitpoints: 600,
        damage: 60,
        range: 6,
        hitSpeed: 1,
        walkSpeed: 2.7
    },
    [EntityType.BloomTail]: {
        skin: 'BloomTail',
        isFlying: false,
        size: { t: 'circle', size: 0.5 },
        hitpoints: 600,
        damage: 80,
        range: 1.5,
        hitSpeed: 1,
        walkSpeed: 2.5
    },
    [EntityType.ChocoMint]: {
        skin: 'ChocoMint',
        isFlying: false,
        size: { t: 'circle', size: 0.4 },
        hitpoints: 500,
        damage: 80,
        range: 6,
        hitSpeed: 1,
        walkSpeed: 2.5
    },
    [EntityType.Dinobit]: {
        skin: 'Dinobit',
        isFlying: false,
        size: { t: 'circle', size: 0.7 },
        hitpoints: 1300,
        damage: 170,
        range: 1.5,
        hitSpeed: 1,
        walkSpeed: 2
    },
    [EntityType.Dipking]: {
        skin: 'Dipking',
        isFlying: false,
        size: { t: 'circle', size: 0.5 },
        hitpoints: 800,
        damage: 100,
        range: 2,
        hitSpeed: 1,
        walkSpeed: 2.2
    },
    [EntityType.ShibaIgnite]: {
        skin: 'ShibaIgnite',
        isFlying: false,
        size: { t: 'circle', size: 0.8 },
        hitpoints: 2000,
        damage: 170,
        range: 1.5,
        hitSpeed: 1,
        walkSpeed: 1.5
    },
    [EntityType.Unika]: {
        skin: 'Unika',
        isFlying: false,
        size: { t: 'circle', size: 0.6 },
        hitpoints: 1100,
        damage: 130,
        range: 1.5,
        hitSpeed: 1,
        walkSpeed: 2.5
    },
    [EntityType.Zzoo]: {
        skin: 'Zzoo',
        isFlying: true,
        size: { t: 'circle', size: 0.3 },
        hitpoints: 400,
        damage: 100,
        range: 2,
        hitSpeed: 1,
        walkSpeed: 3.5
    },

};

const INFLUENCE:Partial<Record<EntityType, {w:number, h:number}>> = {
    [EntityType.BigTower]: { w: 9, h: 8 },
    [EntityType.SmallTower]: { w: 5, h: 11 },
};

export function getInfluence(type:EntityType, x:number, y:number):InfluenceRange {
    const inf = INFLUENCE[type];
    if (inf) {
        return {
            x1: Math.max(0, Math.floor(x) - inf.w),
            x2: Math.min(FIELD_TILES_WIDTH, Math.ceil(x) + inf.w),
            y1: Math.max(0, Math.floor(y) - inf.h),
            y2: Math.min(FIELD_TILES_HEIGHT, Math.ceil(y) + inf.h)
        };
    } else return null;
}

export function withinInfluence(inf:InfluenceRange, tileX:number, tileY:number):boolean {
    // Put it in the middle of the tile, as the influence range is inclusive.
    tileX += 0.5;
    tileY += 0.5;
    return inf != null && tileX > inf.x1 && tileX < inf.x2 && tileY > inf.y1 && tileY < inf.y2;
}

export type InfluenceRange = {x1:number, y1:number, x2:number, y2:number} | null;

/** The minimum range needed to consider a unit Ranged. */
const RANGED_RANGE = 4;
/** The scan view range. How far an entity will pick a target from. */
export const VIEW_RANGE = 5;

export function canTarget(attacker:EntityType, victim:EntityType):boolean {
    const atk = ENTITIES[attacker];
    const vic = ENTITIES[victim];
    return !vic.isFlying || atk.isFlying || atk.range > RANGED_RANGE;
}

export enum EntityState {
    SPAWNING = 1,
    MOVING,
    /** For buildings without target. */
    STANDING,
    ATTACKING,
    IDLE,
}
