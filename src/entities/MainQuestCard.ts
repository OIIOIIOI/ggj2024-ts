import { gsap } from "gsap";
import { Colors, Config, Fonts } from "../config";
import { EventManager, Events } from "../managers/Events";
import { Game } from "../scenes/Game";
import { MainQuestStruct } from "../struct/MainQuestStruct";
import { QuestStruct } from "../struct/QuestStruct";
import { QuestCard } from "./QuestCard";
import { QuestSlot } from "./QuestSlot";
import { MultDisplay } from "./MultDisplay";

export class MainQuestCard extends QuestCard {
    declare protected _quest: MainQuestStruct;
    declare protected _multDisplay: MultDisplay | undefined;

    private _multiplier: number = 1;
    private _multiplierTurnsRemaining: number = 0;

    constructor(scene: Phaser.Scene, quest: QuestStruct) {
        super(scene, quest);
    }

    createGraphics() {
        this._back = new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'ui', 'Carte_Main.png');

        this._text = new Phaser.GameObjects.Text(
            this.scene,
            0,
            -125 * Config.DPR,
            "",
            Fonts.getStyle(42, Colors.WHITE_HEX, Fonts.MAIN),
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5)
            .setVisible(this._facingUp);

        this._subText = new Phaser.GameObjects.Text(
            this.scene,
            0,
            -75 * Config.DPR,
            "",
            Fonts.getStyle(26, Colors.WHITE_HEX, Fonts.TEXT),
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5)
            .setVisible(this._facingUp);

        this._turnsIcon = new Phaser.GameObjects.Sprite(
            this.scene,
            0, 0,
            'ui',
            'Picto_Smile.png',
        )
            .setOrigin(0.5, 0.5)
            .setVisible(this._facingUp);

        this._multDisplay = new MultDisplay(this.scene)
            .setPosition(165 * Config.DPR, 57 * Config.DPR)
            .setVisible(this._facingUp);

        this.add([
            this._back,
            this._text,
            this._subText,
            this._multDisplay,
        ]);
    }

    createSlots() {
        for (let i = 0; i < this._quest.requirements.length; i++) {
            const slot = new QuestSlot(this.scene, this._quest.requirements[i], this._quest.requirements, true)
                .setAlpha(0.35);
            this._slots.push(slot);
        }
        this.placeSlots();
    }

    placeSlots() {
        super.placeSlots();

        if (this._turnsIcon && this._slots.length > 0) {
            this._turnsIcon.setPosition(this._slots[0].x, this._slots[0].y);
            this.add(this._turnsIcon);
        }
    }

    getSlot(): QuestSlot | undefined {
        if (this._slots.length > 0)
            return this._slots[0];
        else
            return undefined;
    }

    flip(instant: boolean = false) {
        super.flip(true);

        this._multDisplay?.setVisible(this._facingUp && this._multiplier > 1);
    }

    // NOTE Should not need this since main quest flip is always instant, but better to anticipate it anyway
    protected onFlipComplete(card: MainQuestCard): void {
        card._multDisplay?.setVisible(card._facingUp && this._multiplier > 1);
    }

    update(time: number) {
        super.update(time);

        let title = "The audience listens...";
        let subtitle = "Use Dice here to get easy laughs!";

        const gameScene = this.scene.scene.get("Game") as Game;
        if (gameScene.stageBar?.stage.isLockedAndMaxed()) {
            title = "No more Quick Jokes!";
            subtitle = "The crowd wants some Refined Bits.";
        }

        if (this._text)
            this._text.text = title;

        if (this._subText)
            this._subText.text = subtitle;

        /* if (this._multDisplay) {
            this._multDisplay.setMult(this._multiplier);
            this._multDisplay?.setVisible(this._multiplier > 1);
        } */
    }

    onEndTurn() {
        this._multiplierTurnsRemaining--;

        if (this._multiplierTurnsRemaining <= 0) {
            this._multiplier = 1;

            // If mult display is still visible
            if (this._multDisplay && this._multDisplay.visible) {
                // Animate
                gsap.to(this._multDisplay, {
                    scale: 0,
                    alpha: 0,
                    rotation: -Math.PI * 0.25,
                    duration: 0.35,
                    ease: "power3.out",
                    onComplete: () => {
                        this._multDisplay?.setVisible(false);
                    }
                });
            }
        }
    }

    onRequirementCompleted(uuid: string) {
        if (this._quest.isOwnRequirement(uuid)) {
            // console.log('MAIN QUEST Requirement filled:', uuid);

            const slot = this.getSlot();
            if (slot && slot.diceHistory.length > 0) {
                // Find last dice
                const lastDice = slot.diceHistory[slot.diceHistory.length - 1];
                // Emit event
                EventManager.emit(Events.MAIN_QUEST_PROGRESS, lastDice.value * this._multiplier);
                // Clear history
                slot.clearHistory();
            }

            this._quest.undoRequirements();

            if (this._turnsIcon) {
                gsap.fromTo(this._turnsIcon, {
                    rotation: `${(Math.random() * Math.PI * 0.4) - Math.PI * 0.2}`,
                    scale: 1.5,
                }, {
                    rotation: `${(Math.random() * Math.PI * 0.2) - Math.PI * 0.1}`,
                    scale: 1,
                    duration: 2,
                    ease: "elastic.out(1,0.3)",
                });
            }
        }
    }

    setMultiplier(mult: number, turns: number) {
        this._multiplier = mult;
        this._multiplierTurnsRemaining = turns;

        // If mult should display and is not already visible
        if (this._multiplier > 1 && this._multDisplay && !this._multDisplay.visible) {
            // Set mult
            this._multDisplay.setMult(this._multiplier);
            // Set visible
            this._multDisplay.setVisible(true);
            // Animate
            gsap.fromTo(this._multDisplay, {
                scale: 0,
                alpha: 0,
                rotation: -Math.PI * 0.25,
            }, {
                alpha: 1,
                scale: 1,
                rotation: 0,
                duration: 0.666,
                ease: "elastic.out(1,0.4)",
            });
        }
    }
}