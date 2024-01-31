import { Dice } from "./Dice";
import { Random } from "../managers/Random";
import { DiceStruct } from "../struct/DiceStruct";
import { lerp } from "../utils";

export class GlitchedDice extends Dice {
    public get glitched(): boolean { return true; };

    constructor(scene: Phaser.Scene, dice: DiceStruct) {
        super(scene, dice);
    }

    createGraphics(): void {
        super.createGraphics();

        const frameRate = 10;
        let frames = [
            { key: 'ui', frame: 'Dice_Barde_UI_1.png', duration: 0 },
            { key: 'ui', frame: 'Dice_Poet_UI_1.png', duration: 0 },
            { key: 'ui', frame: 'Dice_Mimo_UI_1.png', duration: 0 },
        ];
        this._background?.anims.create({
            key: 'glitched_dice_background',
            frames: Random.getInstance().shuffle(frames, true),
            randomFrame: true,
            frameRate: frameRate,
            repeat: -1,
        });

        frames = [
            { key: 'ui', frame: 'ValeurDice_1.png', duration: 0 },
            { key: 'ui', frame: 'ValeurDice_2.png', duration: 0 },
            { key: 'ui', frame: 'ValeurDice_3.png', duration: 0 },
            { key: 'ui', frame: 'ValeurDice_4.png', duration: 0 },
            { key: 'ui', frame: 'ValeurDice_5.png', duration: 0 },
            { key: 'ui', frame: 'ValeurDice_6.png', duration: 0 },
        ];
        this._dots?.anims.create({
            key: 'glitched_dice_dots',
            frames: Random.getInstance().shuffle(frames, true),
            randomFrame: true,
            frameRate: frameRate,
            repeat: -1,
        });

        this._background?.anims.play('glitched_dice_background');
        this._dots?.anims.play('glitched_dice_dots');
    }

    update() {
        const positionSpeed = 0.5;

        if (this._isBeingDragged) {
            this.setPosition(
                lerp(this.x, this._dragPosition.x, positionSpeed),
                lerp(this.y, this._dragPosition.y, positionSpeed)
            );
        }
        else
            this._dragPosition.setTo(this.x, this.y);
    }
}