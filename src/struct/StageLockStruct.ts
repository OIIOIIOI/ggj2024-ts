import { Random } from "../managers/Random";

export class StageLockStruct {
    readonly uuid: string;
    private _questsNeeded: number;
    private _questsDone: number;
    public get isOpen() { return this._questsDone >= this._questsNeeded; };
    public get remaining() { return (this._questsNeeded - this._questsDone).toFixed(); };

    readonly cap: number;

    constructor(questsNeeded: number, cap: number) {
        this.uuid = Random.getInstance().uuid();
        this._questsNeeded = questsNeeded;
        this._questsDone = 0;
        this.cap = cap;
    }

    updateCount(count: number = 1) {
        this._questsDone += count;

        // if (this.isOpen)
        // console.log('lock @' + this.cap, 'is open');
    }
}