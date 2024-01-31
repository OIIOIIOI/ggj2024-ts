import { CharType } from "../struct/CharStruct";
import { DiceStruct } from "../struct/DiceStruct";
import { Dice } from "./Dice";

export class GlitchedDice extends Dice {
    constructor(scene: Phaser.Scene) {
        super(scene, new DiceStruct(CharType.ANY));
    }
}