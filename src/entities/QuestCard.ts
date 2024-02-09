import { EventManager, Events } from "../managers/Events";
import { Colors, Config, Fonts } from "../config";
import { QuestStruct } from "../struct/QuestStruct";
import { QuestSlot } from "./QuestSlot";
import { QuestReward } from "../struct/QuestReward";
import { Random } from "../managers/Random";
import { gsap } from "gsap";
import { lerp } from "../utils";
import { Rewards } from "../managers/Rewards";
import { CharType } from "../struct/CharStruct";
import { QuestRequirement } from "../struct/QuestRequirement";

export class QuestCard extends Phaser.GameObjects.Container {
    // Actual quest class
    protected _quest: QuestStruct;
    // Expose some of the quest properties, keep the rest private
    public get quest() { return this._quest; }
    public get uuid() { return this._quest.uuid; }
    public get questName() { return this._quest.name; }
    public get turnsRemaining() { return this._quest.turnsRemaining; }
    public get rewardsForFail() { return this._quest.rewardsForFail; }
    public get rewardsForSuccess() { return this._quest.rewardsForSuccess; }

    // Graphics objects
    protected _back: Phaser.GameObjects.Sprite | undefined;
    protected _text: Phaser.GameObjects.Text | undefined;
    protected _subText: Phaser.GameObjects.Text | undefined;
    protected _slots: Array<QuestSlot> = [];
    public get slots() { return this._slots; }
    protected _turnsText: Phaser.GameObjects.Text | undefined;
    protected _turnsIcon: Phaser.GameObjects.Image | undefined;
    protected _turnsCircle: Phaser.GameObjects.Ellipse | undefined;

    protected _facingUp: boolean;
    protected _boundOnRequirementProgress: ((uuid: string) => void) | undefined;
    protected _boundOnRequirementCompleted: ((uuid: string) => void) | undefined;
    protected _boundOnEndTurn: (() => void) | undefined;

    public targetPosition: Phaser.Geom.Point;
    public isBeingDestroyed: boolean = false;

    constructor(scene: Phaser.Scene, quest: QuestStruct) {
        super(scene);

        this.targetPosition = new Phaser.Geom.Point(this.x, this.y);

        this._quest = quest;

        // Setup dynamic requirements
        this._quest.setupDynamicRequirements();

        // Create graphics
        this.createGraphics();

        // Start facing down
        this._facingUp = false;
    }

    createGraphics() {
        this._back = new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'ui', this.getBackSprite());

        this._text = new Phaser.GameObjects.Text(
            this.scene,
            -this._back.width * 0.5 + (30 * Config.DPR),
            -this._back.height * 0.5 + (17 * Config.DPR),
            "",
            Fonts.getStyle(32, Colors.BLACK_HEX, Fonts.MAIN)
        )
            .setFixedSize(this._back.width, this._back.height)
            .setOrigin(0, 0)
            .setVisible(this._facingUp);

        this._subText = new Phaser.GameObjects.Text(
            this.scene,
            -this._back.width * 0.5 + 30 * Config.DPR,
            -this._back.height * 0.5 + 65 * Config.DPR,
            "",
            Fonts.getStyle(24, Colors.BLACK_HEX, Fonts.TEXT)
        )
            // .setFixedSize(this._back.width - 60 * Config.DPR, this._back.height)
            .setWordWrapWidth(this._back.width - 150 * Config.DPR)
            .setOrigin(0, 0)
            .setVisible(this._facingUp);

        this._turnsText = new Phaser.GameObjects.Text(
            this.scene,
            this._back.width * 0.5 - (45 * Config.DPR),
            -this._back.height * 0.5 + (65 * Config.DPR),
            "",
            Fonts.getStyle(48, Colors.BLACK_HEX, Fonts.MAIN)
        )
            .setOrigin(0.5, 0.5)
            .setVisible(this._facingUp);

        this._turnsIcon = new Phaser.GameObjects.Image(
            this.scene,
            this._turnsText.x - 40 * Config.DPR, this._turnsText.y,
            'ui',
            'Picto_Turn.png',
        )
            .setOrigin(0.5, 0.5)
            .setScale(0.55)
            .setVisible(this._facingUp);

        this._turnsCircle = new Phaser.GameObjects.Ellipse(
            this.scene,
            this._turnsText.x - 22 * Config.DPR, this._turnsText.y,
            95 * Config.DPR, 95 * Config.DPR,
            Colors.SLOT_ANY
        )
            .setVisible(this._facingUp);

        this.add([
            this._back,
            this._text,
            this._subText,
            this._turnsCircle,
            this._turnsIcon,
            this._turnsText,
        ]);
    }

    getBackSprite() {
        // List types from requirements
        const types: Map<CharType, QuestRequirement> = new Map();
        for (const requirement of this._quest.requirements) {
            if (!types.has(requirement.type))
                types.set(requirement.type, requirement);
        }
        // All three types
        if (types.has(CharType.BARD) && types.has(CharType.MIMO) && types.has(CharType.POET))
            return 'Carte_Special.png';
        // Bard / Mimo
        else if (types.has(CharType.BARD) && types.has(CharType.MIMO))
            return 'Carte_Mimo_Barde.png';
        // Bard / Poet
        else if (types.has(CharType.BARD) && types.has(CharType.POET))
            return 'Carte_Barde_Poet.png';
        // Poet / Mimo
        else if (types.has(CharType.POET) && types.has(CharType.MIMO))
            return 'Carte_Mimo_Poet.png';
        // Bard
        else if (types.has(CharType.BARD))
            return 'Carte_Barde.png';
        // Mimo
        else if (types.has(CharType.MIMO))
            return 'Carte_Mimo.png';
        // Poet
        else if (types.has(CharType.POET))
            return 'Carte_Poet.png';
        // Default
        else
            return 'Carte_Malus.png';// TODO Replace with standard card back when asset is ready
    }

    createSlots() {
        for (const requirement of this._quest.requirements) {
            const slot = new QuestSlot(this.scene, requirement, this._quest.requirements)
                .setVisible(this._facingUp);
            this._slots.push(slot);
        }
        this.placeSlots();
    }

    placeSlots() {
        const w = this._slots[0].width * this._slots.length + 20 * Config.DPR * (this._slots.length - 1);
        for (let i = 0; i < this._slots.length; i++) {
            this._slots[i].x = -w * 0.5 + (i + 0.5) * this._slots[i].width + i * 20 * Config.DPR;
            this._slots[i].y = 57 * Config.DPR;
            this.add(this._slots[i]);
        }
    }

    hasRequirement(uuid: string): boolean {
        return this.quest.isOwnRequirement(uuid);
    }

    activate(primed: boolean = false) {
        console.log('Activating quest', this._quest.uuid, this.quest.name, primed);

        // Activate quest
        this._quest.activate(primed);

        // Create slots
        this.createSlots();

        // Update texts
        if (this._text)
            this._text.text = this._quest.name;

        if (this._subText) {
            let s = "";
            if (this._quest.rewardsForSuccess.length > 0)
                s = this._quest.rewardsForSuccess.map((r) => Rewards.getInstance().getRewardText(r)).join(", ");
            else if (this._quest.rewardsForFail.length > 0)
                s = "Fail: " + this._quest.rewardsForFail.map((r) => r.type).join(", ");
            this._subText.text = s;
        }

        // Flip to face up
        this.flip();

        this._boundOnRequirementProgress = this.onRequirementProgress.bind(this);
        this._boundOnRequirementCompleted = this.onRequirementCompleted.bind(this);
        this._boundOnEndTurn = this.onEndTurn.bind(this);
        EventManager.on(Events.REQUIREMENT_PROGRESS, this._boundOnRequirementProgress);
        EventManager.on(Events.REQUIREMENT_COMPLETED, this._boundOnRequirementCompleted);
        EventManager.on(Events.END_TURN, this._boundOnEndTurn);
    }

    flip(instant: boolean = false) {
        console.log('flip quest card, instant:', instant);

        if (instant) {
            this._facingUp = !this._facingUp;

            this._text?.setVisible(this._facingUp);
            this._subText?.setVisible(this._facingUp);
            this._turnsCircle?.setVisible(this._facingUp);
            this._turnsIcon?.setVisible(this._facingUp);
            this._turnsText?.setVisible(this._facingUp);

            for (const slot of this._slots)
                slot.setVisible(this._facingUp);
        }
        else {
            const timeline = gsap.timeline({
                delay: 0.35,
                defaults: {
                    duration: 0.4,
                    ease: "power3.out",
                }
            });
            timeline.to(this, {
                scaleX: 1.1,
                scaleY: 0,
                onStart: () => {
                    this.targetPosition.y = Config.questCard.startY + 250 * Config.DPR;
                },
                onComplete: this.onFlipComplete,
                onCompleteParams: [this],
            }).to(this, {
                scaleX: 1,
                scaleY: 1,
            });
        }
    }

    protected onFlipComplete(card: QuestCard) {
        console.log('onFlipComplete', card.quest.uuid, card.quest.name, '| facing up:', card._facingUp);

        card._facingUp = !card._facingUp;

        card._back?.setTintFill(0xFFFFFF);

        card._text?.setVisible(card._facingUp);
        card._subText?.setVisible(card._facingUp);
        card._turnsCircle?.setVisible(card._facingUp);
        card._turnsIcon?.setVisible(card._facingUp);
        card._turnsText?.setVisible(card._facingUp);

        for (const slot of card._slots)
            slot.setVisible(card._facingUp);

        card.targetPosition.y = Config.questCard.startY;
    }

    setPosition(x?: number | undefined, y?: number | undefined, z?: number | undefined, w?: number | undefined): this {
        super.setPosition(x, y, z, w);
        if (x)
            this.targetPosition.x = x;
        if (y)
            this.targetPosition.y = y;
        return this;
    }

    update(time: number) {
        if (this.isBeingDestroyed)
            return;

        if (this._quest.isPrimed) {
            this._turnsIcon?.setAlpha(1);
            this._turnsText?.setAlpha(1);
        } else {
            this._turnsIcon?.setAlpha(0.5);
            this._turnsText?.setAlpha(0.5);
        }

        if (this._turnsText)
            this._turnsText.text = this.turnsRemaining.toFixed();

        // Lerp to target position
        const x = this.targetPosition.x - this.x;
        const y = this.targetPosition.y - this.y;
        if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
            const mult = 0.15;
            this.x = lerp(this.x, this.targetPosition.x, mult);
            this.y = lerp(this.y, this.targetPosition.y, mult);
        }
        else if (Math.abs(x) > 0 || Math.abs(y) > 0) {
            this.setPosition(this.targetPosition.x, this.targetPosition.y);
        }

        // Update slots
        for (const slot of this._slots) {
            slot.update();
        }

        // Last turn warning
        if (this._quest.turnsRemaining === 1 && this._quest.isPrimed) {
            const r = 0.01 * Math.sin(time / 75);// amplitude * sin(time / freq)
            const s = 0.01 * Math.sin(time / 125);// amplitude * sin(time / freq)
            this.setRotation(r);
            this.setScale(1 + s);
        }
    }

    onEndTurn() {
        if (!this._quest.isPrimed)
            return;

        if (this._turnsIcon) {
            gsap.to(this._turnsIcon, {
                rotation: `-=${Math.PI}`,
                duration: 1.5,
                ease: "elastic.out(1,0.3)",
            });
        }

        if (this._turnsText) {
            gsap.from(this._turnsText, {
                scale: 1.35,
                duration: 1.5,
                ease: "elastic.out(1,0.3)",
            });
        }
    }

    onRequirementProgress(uuid: string) {
        // if (this._quest.isOwnRequirement(uuid))
        // console.log('Requirement progress:', uuid);

        if (this._quest.isOwnRequirement(uuid) && !this._quest.isPrimed)
            this._quest.isPrimed = true;
    }

    onRequirementCompleted(uuid: string) {
        // if (this._quest.isOwnRequirement(uuid))
        // console.log('Requirement completed:', uuid, this._quest.uuid);

        if (this._quest.isOwnRequirement(uuid)) {
            if (this._quest.isDone())
                EventManager.emit(Events.QUEST_COMPLETED, this._quest.uuid);
            else if (!this._quest.isPrimed)
                this._quest.isPrimed = true
        }
    }

    destroy(fromScene?: boolean | undefined) {
        // console.log('Destroying quest', this._quest.uuid);

        EventManager.off(Events.REQUIREMENT_PROGRESS, this._boundOnRequirementProgress);
        EventManager.off(Events.REQUIREMENT_COMPLETED, this._boundOnRequirementCompleted);
        EventManager.off(Events.END_TURN, this._boundOnEndTurn);

        this._quest.destroy();

        super.destroy();
    }
}