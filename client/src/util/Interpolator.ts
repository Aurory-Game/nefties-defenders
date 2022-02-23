const temp:InterpolatedValue = { time: 0, x: 0, y: 0 };

function setFrom(other:InterpolatedValue) {
    temp.time = other.time;
    temp.x = other.x;
    temp.y = other.y;
    return temp;
}

function interpolate(a:InterpolatedValue, b:InterpolatedValue, alpha:number) {
    temp.time = a.time + (b.time - a.time) * alpha;
    temp.x = a.x + (b.x - a.x) * alpha;
    temp.y = a.y + (b.y - a.y) * alpha;

    return temp;
}

export default class Interpolator {

    private size:number;
    private buffer:Array<InterpolatedValue> = [];
    private startIndex = 0;
    private count = 0;
    private alpha = 0;

    /**
     * @param interpolationWindow Interpolate this far into past.
     * @param [minStepTime=interpolationWindow] Minimum time between entries.
     * @param [sizeCoef=1] Increases size. Useful when there is a possibility of accessing values older
     * than would normally be the oldest value. E.g. when new data came sooner because of jitter.
     */
    constructor(private interpolationWindow:number, minStepTime:number = interpolationWindow, sizeCoef:number = 1) {
        this.size = Math.ceil((interpolationWindow * sizeCoef) / minStepTime) + 1;
        for (let i = 0; i < this.size; i++) {
            this.buffer.push({ time: 0, x: 0, y: 0 });
        }
    }

    /**
     * Add new value to the interpolator.
     */
    add(time:number, x:number, y:number = 0) {
        const nextIndex = (this.startIndex + this.count) % this.size;
        if (this.count == this.size) {
            this.startIndex = this.increment(this.startIndex);
        } else {
            this.count++;
        }
        const obj = this.buffer[nextIndex];
        obj.time = time;
        obj.x = x;
        obj.y = y;
    }

    /** @returns Can be null. */
    getAtTime(time:number):InterpolatedValue {
        if (this.count < 1) return null; // Not enough data, wait.
        time -= this.interpolationWindow;
        this.clearOlderThan(time);
        const secondIndex = this.increment(this.startIndex);
        const firstPoint = this.buffer[this.startIndex];
        if (firstPoint.time >= time || this.count == 1) {
            return setFrom(firstPoint);
        } else {
            const secondPoint = this.buffer[secondIndex];
            this.alpha = (time - firstPoint.time) / (secondPoint.time - firstPoint.time);
            return interpolate(firstPoint, secondPoint, this.alpha);
        }
    }

    /** @returns True if there's enough data to start interpolation from the given time. */
    canStart(time:number):boolean {
        return this.count > 1 && this.buffer[this.startIndex].time <= time - this.interpolationWindow;
    }

    hasDataFor(time:number) {
        time -= this.interpolationWindow;
        return this.count > 0 && this.buffer[(this.startIndex + this.count - 1) % this.size].time >= time;
    }

    clearOlderThan(time:number) {
        if (this.count == 0) return;
        let secondIndex = this.increment(this.startIndex);
        while (this.buffer[secondIndex].time < time && this.count > 2) {
            // Second is smaller => first is useless, we can move the reader ahead, until we reach end.
            this.startIndex = secondIndex;
            secondIndex = this.increment(secondIndex);
            this.count--;
        }
    }

    clearAll() {
        this.count = 0;
    }

    increment(i:number):number {
        return (i + 1) % this.size;
    }
}

 type InterpolatedValue = {
    time:number;
    x:number;
    y:number;
 }
