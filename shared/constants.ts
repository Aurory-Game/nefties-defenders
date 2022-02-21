export const ROOM_NAME:string = 'cr';
/** Timestep in ms. */
export const TIMESTEP:number = 50;
/** Timestep in seconds. */
export const TIMESTEP_S:number = TIMESTEP / 1000;
/** 3 seconds worth of ticks. */
export const TICKS_3S:number = Math.round(3000 / TIMESTEP);
/** Half second worth of ticks. */
export const TICKS_HALF_S:number = Math.round(500 / TIMESTEP);

export const MANA_START:number = 5;
export const MANA_MAX:number = 10;
/** Ticks that need to pass before mana point regenerates. */
export const MANA_REGEN_TICKS:number = Math.round(1000 / TIMESTEP);
