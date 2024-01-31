import { EventManager, Events } from "../managers/Events";
import { Colors, Config, Fonts } from "../config";
import { CharType } from "../struct/CharStruct";
import { QuestRequirement, QuestRequirementMode } from "../struct/QuestRequirement";
import { Dice } from "./Dice";
import { clamp } from "../utils";
import DissolvePipelinePlugin from "phaser3-rex-plugins/plugins/dissolvepipeline-plugin";
import { Game } from "../scenes/Game";
import { GlitchedDice } from "./GlitchedDice";

export class QuestSlot extends Phaser.GameObjects.Container {
    protected _zone: Phaser.GameObjects.Zone;
    protected _background: Phaser.GameObjects.Sprite;
    protected _text: Phaser.GameObjects.Text;
    protected _subText: Phaser.GameObjects.Text;
    protected _check: Phaser.GameObjects.Image;
    protected _pictoSame: Phaser.GameObjects.Image;

    protected _requirement: QuestRequirement;
    protected _allRequirements: Array<QuestRequirement>;
    protected _belongsToMainQuest: boolean;
    public get belongsToMainQuest() { return this._belongsToMainQuest; };

    protected _diceHistory: Array<DiceSnapshot>;
    public get diceHistory() { return this._diceHistory; }

    constructor(scene: Phaser.Scene, requirement: QuestRequirement, allRequirements: Array<QuestRequirement>, belongsToMainQuest = false) {
        super(scene);

        this._requirement = requirement;
        this._allRequirements = allRequirements;
        this._belongsToMainQuest = belongsToMainQuest;

        this._diceHistory = [];

        const backgroundColor = (() => {
            switch (this._requirement.type) {
                case CharType.BARD: return Colors.SLOT_BARD;
                case CharType.POET: return Colors.SLOT_POET;
                case CharType.MIMO: return Colors.SLOT_MIMO;
                case CharType.ANY: return Colors.SLOT_ANY;
            }
        })();

        const checkColor = (() => {
            switch (this._requirement.type) {
                case CharType.BARD: return Colors.CHECK_BARD;
                case CharType.POET: return Colors.CHECK_POET;
                case CharType.MIMO: return Colors.CHECK_MIMO;
                case CharType.ANY: return Colors.CHECK_ANY;
            }
        })();

        this._background = new Phaser.GameObjects.Sprite(
            this.scene,
            0, 0,
            'ui',
            'Picto_Dropzone.png',
        )
            .setTintFill(backgroundColor)
            .setOrigin(0.5, 0.5);

        this.width = this._background.width;
        this.height = this._background.height;

        this._text = new Phaser.GameObjects.Text(
            this.scene,
            0, 10 * Config.DPR,
            this.getRequirementValue(),
            Fonts.getStyle(72, Colors.BLACK_HEX, Fonts.MAIN),
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this._subText = new Phaser.GameObjects.Text(
            this.scene,
            0, -40 * Config.DPR,
            this.getRequirementText(),
            Fonts.getStyle(26, Colors.BLACK_HEX, Fonts.TEXT),
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this._check = new Phaser.GameObjects.Image(
            this.scene,
            0, 0,
            'ui',
            'Picto_Check.png',
        )
            .setTintFill(checkColor)
            .setScale(1.5)
            .setVisible(false);

        this._pictoSame = new Phaser.GameObjects.Image(
            this.scene,
            -this._background.width * 0.555, 0,
            'ui',
            'Picto_Egal.png',
        )
            .setVisible(false);

        this._zone = new Phaser.GameObjects.Zone(
            this.scene,
            0, 0,
            this._background.width,
            this._background.height
        )
            .setRectangleDropZone(this._background.width, this._background.height);

        this.add([
            this._background,
            this._text,
            this._subText,
            this._check,
            this._pictoSame,
            this._zone,
        ]);
    }

    getRequirementValue() {
        if (this._belongsToMainQuest || this._requirement.done)
            return "";

        let s = (() => {
            switch (this._requirement.mode) {
                case QuestRequirementMode.EVEN: return "";
                case QuestRequirementMode.ODD: return "";
                case QuestRequirementMode.SAME: return "?";
                default: return this._requirement.value.toFixed();
            }
        })();

        if (this._requirement.mode === QuestRequirementMode.SAME && this.isLastOfAll())
            this._pictoSame?.setVisible(true);

        return s;
    }

    getRequirementText() {
        if (this._belongsToMainQuest || this._requirement.done)
            return "";

        let s = (() => {
            switch (this._requirement.mode) {
                case QuestRequirementMode.EVEN: return "EVEN";
                case QuestRequirementMode.EXACT: return "EXACTLY";
                case QuestRequirementMode.EXCEPT: return "EXCEPT";
                case QuestRequirementMode.MAX: return "MAX";
                case QuestRequirementMode.MIN: return "MIN";
                case QuestRequirementMode.ODD: return "ODD";
                // case QuestRequirementMode.SAME: return "SAME";
                case QuestRequirementMode.SCORE: return "REACH";
                default: return "";
            }
        })();
        return s;
    }

    update() {
        this._text.text = this.getRequirementValue();
        this._subText.text = this.getRequirementText();
        this._check.setVisible(this._requirement.done);

        if (this._subText.text === "")
            this._text.y = 0;
        else
            this._text.y = 10 * Config.DPR;

        if (this._text.text === "")
            this._subText.y = 0;
        else
            this._subText.y = -40 * Config.DPR;
    }

    isDiceValid(dice: Dice) {
        if (this._belongsToMainQuest) {
            // Reject glitched dice
            if ("glitched" in dice)
                return false;

            const gameScene = this.scene.scene.get("Game") as Game;
            if (gameScene.stageBar?.stage.isLockedAndMaxed())
                return false;
        }

        if (this._requirement.done)
            return false;

        const isTypeValid = this._requirement.type === CharType.ANY || this._requirement.type === dice.dice.type;

        let isValueValid = false;
        switch (this._requirement.mode) {
            case QuestRequirementMode.EVEN:
                isValueValid = dice.dice.currentValue % 2 === 0;
                break;
            case QuestRequirementMode.EXACT:
                isValueValid = dice.dice.currentValue === this._requirement.value;
                break;
            case QuestRequirementMode.EXCEPT:
                isValueValid = dice.dice.currentValue !== this._requirement.value;
                break;
            case QuestRequirementMode.MAX:
                isValueValid = dice.dice.currentValue <= this._requirement.value;
                break;
            case QuestRequirementMode.MIN:
                isValueValid = dice.dice.currentValue >= this._requirement.value;
                break;
            case QuestRequirementMode.ODD:
                isValueValid = dice.dice.currentValue % 2 === 1;
                break;
            case QuestRequirementMode.SAME:
                const reqValue = this.getValueFromOtherSlots();
                isValueValid = reqValue === -1 ? true : reqValue === dice.dice.currentValue;
                break;
            case QuestRequirementMode.SCORE:
                isValueValid = true;
                break;
        }

        return "glitched" in dice || (isTypeValid && isValueValid);
    }

    protected isFirstOfAll() {
        return this._allRequirements[0].uuid === this._requirement.uuid;
    }

    protected isLastOfAll() {
        return this._allRequirements[this._allRequirements.length - 1].uuid === this._requirement.uuid;
    }

    protected getValueFromOtherSlots(): number {
        for (const req of this._allRequirements) {
            if (req.done)
                return req.value;
        }
        return -1;
    }

    addDice(dice: Dice): boolean {
        if (!this.isDiceValid(dice))
            return false;

        // If SCORE mode
        if (this._requirement.mode === QuestRequirementMode.SCORE) {
            // Substract dice current value from score
            this._requirement.value = clamp(0, this._requirement.value, this._requirement.value - dice.dice.currentValue);
            // If score reached, we're done
            if (this._requirement.value <= 0)
                this._requirement.done = true
        }
        // If SAME mode, store the dice value to constrain the other slots later
        else if (this._requirement.mode === QuestRequirementMode.SAME) {
            this._requirement.value = dice.dice.currentValue;
            this._requirement.done = true;

            for (const req of this._allRequirements) {
                if (req.uuid !== this._requirement.uuid) {
                    req.mode = QuestRequirementMode.EXACT;
                    req.value = this._requirement.value;
                }
            }
        }
        // If any other mode
        else
            this._requirement.done = true;

        // Save to history
        this._diceHistory.push({ type: dice.dice.type, value: dice.dice.currentValue });

        // Update text
        this._text.text = this.getRequirementText();

        // Hide dice
        dice.setVisible(false);

        // Emit event if done
        if (this._requirement.done)
            EventManager.emit(Events.REQUIREMENT_COMPLETED, this._requirement.uuid);
        else
            EventManager.emit(Events.REQUIREMENT_PROGRESS, this._requirement.uuid);

        return true;
    }

    clearHistory() {
        this._diceHistory = [];
    }
}

interface DiceSnapshot {
    type: CharType,
    value: number,
}