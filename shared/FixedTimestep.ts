import now from './now';

export default class FixedTimestep {

    public timestep:number;
    public onTick:()=>void;
    public ticks:number = 0;
    public startTime:number = 0;
    
    private enabled:boolean = false;
    private nextTick:number = 0;
    private timeout!:number;

    constructor(timestep:number, onTick:()=>void) {
        this.timestep = timestep;
        this.onTick = onTick;
    }

    hasStarted(): boolean {
        return this.enabled && now() >= this.startTime;
    }

    start(startTime = now(), nextTick = startTime, initTick = -1):void { // Default starts at 0 ticks.
        this.enabled = true;
        this.ticks = initTick;
        this.startTime = startTime;
        this.nextTick = nextTick;
        this.tick();
    }

    stop():void {
        this.enabled = false;
        clearTimeout(this.timeout);
    }

    tick() {
        if (!this.enabled) return;
        // Step if within 3ms of the target.
        // This value should be configured based on expected event loop lag.
        if (now() - this.nextTick > -3) {
            this.ticks++;
            this.nextTick += this.timestep;
            this.onTick();
        }
        this.timeout = setTimeout(() => this.tick(), this.nextTick - now()) as unknown as number;
    }

    /**
     * @returns Current discrete game time in ms.
     */
    getSteppedTime():number {
        return this.ticks * this.timestep;
    }

    getCurrentTime():CurrentTime {
        const time = now();
        return {
            time: time - this.startTime,
            alpha: 1 - (this.nextTick - time) / this.timestep
        };
    }

    secondsUntil(tick:number):number {
        return Math.ceil((tick - this.ticks) * (this.timestep / 1000));
    }

}

type CurrentTime = {
    /** Current continuous game time in ms. */
    time: number;
    /** Progress towards the next tick. */
    alpha: number;
}
