export default class FixedTimestep {

    public timestep:number;
    public onTick:() => void;
    public ticks:number = 0;
    public startTime:number = 0;

    private enabled:boolean = false;
    private nextTick:number = 0;
    private timeout!:number;

    constructor(timestep:number, onTick:() => void) {
        this.timestep = timestep;
        this.onTick = onTick;
    }

    isEnabled() {
        return this.enabled;
    }

    hasStarted():boolean {
        return this.enabled && performance.now() >= this.startTime;
    }

    start(startTime = performance.now(), nextTick = startTime, initTick = -1):void { // Default starts at 0 ticks.
        this.enabled = true;
        this.ticks = initTick;
        this.startTime = startTime;
        this.nextTick = nextTick;
        this.tick();
    }

    /** Start the loop immediately, with the supplied tick being considered as `now`. */
    startNowAtTick(tick:number) {
        const timeNow = performance.now();
        this.start(timeNow - tick * this.timestep, timeNow, tick - 1);
    }

    stop():void {
        this.enabled = false;
        clearTimeout(this.timeout);
    }

    tick() {
        if (!this.enabled) return;
        // Step if within 3ms of the target.
        // This value should be configured based on expected event loop lag.
        if (performance.now() - this.nextTick > -3) {
            this.ticks++;
            this.nextTick += this.timestep;
            this.onTick();
        }
        this.timeout = setTimeout(() => this.tick(), this.nextTick - performance.now()) as unknown as number;
    }

    /**
     * @returns Current discrete game time in ms.
     */
    getSteppedTime():number {
        return this.ticks * this.timestep;
    }

    getCurrentTime():CurrentTime {
        const time = performance.now();
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
    time:number;
    /** Progress towards the next tick. */
    alpha:number;
}
