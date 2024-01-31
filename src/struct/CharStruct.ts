import { Random } from "../managers/Random";
import { DiceStruct } from "./DiceStruct";

export class CharStruct {
    readonly uuid: string;
    readonly type: CharType;

    private _dicePool: Array<DiceStruct> = [];
    public get dicePool() { return this._dicePool; }

    constructor(type: CharType) {
        this.uuid = Random.getInstance().uuid();
        this.type = type;
    }

    addDice(n: number) {
        if (n < 1)
            return [];

        const newDice = [];
        for (let i = 0; i < n; i++) {
            const dice = new DiceStruct(this.type);
            this._dicePool.push(dice);
            newDice.push(dice);
        }

        return newDice;
    }

    removeDice(n: number) {
        if (n < 1)
            return [];

        const oldDice = [];
        for (let i = 0; i < n; i++)
            oldDice.push(this._dicePool.pop());

        return oldDice;
    }
}

export enum CharType {
    ANY = "CT_ANY",
    RANDOM = "CT_RANDOM",
    BARD = "CT_BARD",
    POET = "CT_POET",
    MIMO = "CT_MIMO",
    FIRST = "CT_FIRST",
    SECOND = "CT_SECOND",
    THIRD = "CT_THIRD",
}