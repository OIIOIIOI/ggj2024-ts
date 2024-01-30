import { Config } from "../config";
import { Random } from "../managers/Random";
import { clamp } from "../utils";
import { StageLockStruct } from "./StageLockStruct";

export class StageStruct {
    static levels = [1, 2, 3, 5, 10, 12, 14];
    static names = [
        "Hamlet Tavern",
        "Village Tavern",
        "Town Tavern",
        "City Tavern",
        "Capital Tavern",
    ];

    readonly uuid: string;

    private _level: number;
    private _name: string;
    public get name() { return this._name; }
    private _total: number;
    public get total() { return this._total; }
    private _current: number;
    public get score() { return this._current };
    public get progress() { return clamp(0, 1, this._current / this._total); };
    public get isComplete() { return !this.getCurrentLock() && this._current >= this._total; };

    private _locks: Array<StageLockStruct> = [];
    public get locks() { return this._locks; }

    constructor(level: number) {
        this.uuid = Random.getInstance().uuid();

        // Calculate mult
        this._level = Math.max(level, 0);
        const mult = this._level < StageStruct.levels.length ?
            // Use defined levels if in the expected range
            StageStruct.levels[this._level] :
            // Use a constant formula if over the expected range
            StageStruct.levels[StageStruct.levels.length - 1] + 4 * (this._level - StageStruct.levels.length + 1);

        // Get name
        this._name = StageStruct.names[Math.min(this._level, StageStruct.names.length - 1)];

        // Init values
        this._total = Config.stageBaseDifficulty * mult;
        this._current = 0;

        // Setup locks
        this._locks = [];
        this.setupLocks();
    }

    setupLocks() {
        const locksCount = Config.locksPerStage + this._level;
        const questsPerLock = Math.min(Config.questsPerLock + this._level, Config.maxQuestsPerLock);

        // Add the progress locks
        if (locksCount > 1) {
            const step = Math.floor(this._total / locksCount);
            for (let i = 1; i < locksCount; i++)
                this._locks.push(new StageLockStruct(questsPerLock, step * i));
        }

        // Add the last lock
        this._locks.push(new StageLockStruct(questsPerLock, this._total));
    }

    public isLockedAndMaxed() {
        const lock = this.getCurrentLock();
        return lock && this._current === lock.cap;
    }

    getCurrentLock() {
        for (const lock of this._locks) {
            if (!lock.isOpen)
                return lock;
        }
        return false;
    }

    add(value: number): number {
        const prevScore = this._current;

        const lock = this.getCurrentLock();
        if (lock)
            this._current = clamp(0, lock.cap, this._current + value);
        else
            this._current += value;

        return this._current - prevScore;
    }

    decrementLock() {
        const lock = this.getCurrentLock();
        if (lock)
            lock.updateCount();
        return lock;
    }
}