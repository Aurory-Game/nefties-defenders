export default class InitTimeSync {

    private estimations:Array<number> = [];

    constructor(public readonly timestep:number) { }

    /**
     * @param ticksLeft How many ticks are left until start.
     */
    addTimePoint(ticksLeft:number) {
        this.estimations.push(performance.now() + ticksLeft * this.timestep);
    }

    /**
     * @returns An estimation of start time based on previously added time points.
     */
    estimate():number {
        this.estimations.sort();
        // Calculate avg of the middle half.
        const start = Math.floor(this.estimations.length * 0.25);
        const end = Math.ceil(this.estimations.length * 0.75);
        const len = end - start;
        let startTime:number;
        if (len > 3) { // If enough values in the middle.
            const avg = this.estimations.slice(start, end).reduce((sum, val) => sum + val, 0) / (end - start);
            // Remove extremes – values over timestep away from average. Accounting for packet drops and such.
            const filtered = this.estimations.filter(val => Math.abs(val - avg) <= this.timestep);
            if (filtered.length > 3) { // If we have enough valid points, predict start based on avg.
                startTime = filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
            } else { // Fallback to full avg if not enough data samples.
                startTime = avg;
            }
        } else { // Fallback to average of all values.
            startTime = this.estimations.reduce((sum, val) => sum + val, 0) / (end - start);
        }
        return startTime;
    }
}
