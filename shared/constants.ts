import { EntityType } from './entities';

export const ROOM_NAME:string = 'cr';
/** Timestep in ms. */
export const TIMESTEP:number = 50;
/** Timestep in seconds. */
export const TIMESTEP_S:number = TIMESTEP / 1000;
/** 3 seconds worth of ticks. */
export const TICKS_3S:number = Math.round(3000 / TIMESTEP);
/** Half second worth of ticks. */
export const TICKS_HALF_S:number = Math.round(500 / TIMESTEP);
/** One second worth of ticks. */
export const TICKS_1S:number = Math.round(1000 / TIMESTEP);

export const MANA_START:number = 5;
export const MANA_MAX:number = 10;
/** Ticks that need to pass before mana point regenerates. */
export const MANA_REGEN_TICKS:number = Math.round(1000 / TIMESTEP);

/** How many cards are in a hand. */
export const HAND_SIZE:number = 4;

export const FIELD_TILES_WIDTH:number = 18;
export const FIELD_TILES_HEIGHT:number = 32;
export const FIELD_TILE_SIZE:number = 32;

export const TOWERS = [
    { x: 9, y: 29, type: EntityType.BigTower },
    { x: 3.5, y: 26.5, type: EntityType.SmallTower },
    { x: 14.5, y: 26.5, type: EntityType.SmallTower },
];

export const FIELD_MAP =
`
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
WWWBWWWWWWWWWWBWWW
WWWBWWWWWWWWWWBWWW
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGG
`;

export const enum TileType {
    GRASS,
    WATER,
    BRIDGE
}

export const FIELD_MAP_DATA = FIELD_MAP.split('\n').filter(l => l.length > 0).map(l => l.split('').map(char => {
    switch (char) {
    case 'G': return TileType.GRASS;
    case 'W': return TileType.WATER;
    case 'B': return TileType.BRIDGE;
    default: throw 'Unexpected tile value.';
    }
}));

export function isWater(x:number, y:number) {
    return FIELD_MAP_DATA[y][x] == TileType.WATER;
}
