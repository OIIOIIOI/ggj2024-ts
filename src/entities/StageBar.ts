import { Colors, Config, Fonts } from "../config";
import { EventManager, Events } from "../managers/Events";
import { StageStruct } from "../struct/StageStruct";
import { clamp, ilerp, lerp } from "../utils";
import { StageBarIcon } from "./StageBarIcon";
import { StageLock } from "./StageLock";
import { gsap } from "gsap";
// import { RoughEase } from "gsap/EasePack";

// gsap.registerPlugin(RoughEase);

export class StageBar extends Phaser.GameObjects.Container {
    // Graphics objects
    protected _nameText: Phaser.GameObjects.Text;
    protected _background: Phaser.GameObjects.Rectangle;
    protected _bar: Phaser.GameObjects.Rectangle;
    protected _icon: StageBarIcon;
    protected _locksLayer: Phaser.GameObjects.Container;
    protected _locks: Array<StageLock> = [];

    protected _stageLevel: number = 0;
    protected _stage: StageStruct;
    public get stage() { return this._stage; }
    protected _totalScore: number = 0;
    public get score() { return this._totalScore; }

    private _boundOnMainQuestProgress: ((value: number) => void) | undefined;
    private _boundOnQuestCompleted: (() => void) | undefined;
    private _boundOnVibrateLock: (() => void) | undefined;

    constructor(scene: Phaser.Scene) {
        super(scene);

        // Base graphics
        this._nameText = new Phaser.GameObjects.Text(
            this.scene,
            0,
            -70 * Config.DPR,
            "",
            Fonts.getStyle(32, Colors.WHITE_HEX, Fonts.MAIN)
        )
            .setAlign('center')
            .setOrigin(0.5, 0);

        if (!import.meta.env.PROD) {
            this._nameText.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
                this.scene.scene.start('GameOver');
            })
        }

        this._background = new Phaser.GameObjects.Rectangle(this.scene, 0, 0);
        this._bar = new Phaser.GameObjects.Rectangle(this.scene, 0, 0);

        this._icon = new StageBarIcon(this.scene);

        this._locksLayer = new Phaser.GameObjects.Container(this.scene, 0, 0);

        this.add([
            this._nameText,
            this._background,
            this._icon,
            this._bar,
            this._locksLayer,
        ]);

        this._totalScore = 0;

        // Init first stage
        this._stageLevel = Config.startingStageLevel;
        this._stage = new StageStruct(this._stageLevel);
        this.resetGraphics();

        // Listen to quest events
        this._boundOnMainQuestProgress = this.onMainQuestProgress.bind(this);
        this._boundOnQuestCompleted = this.onQuestCompleted.bind(this);
        this._boundOnVibrateLock = this.onVibrateLock.bind(this);
        EventManager.on(Events.MAIN_QUEST_PROGRESS, this._boundOnMainQuestProgress);
        EventManager.on(Events.QUEST_COMPLETED, this._boundOnQuestCompleted);
        // Listen to lock event
        EventManager.on(Events.VIBRATE_LOCK, this._boundOnVibrateLock);
    }

    resetGraphics() {
        const size = Config.stageBar.width * clamp(0.6, 1, 0.6 + 0.1 * this._stageLevel);

        // Update stage name
        if (this._nameText)
            this._nameText.text = this._stage.name;

        // Icon
        this._icon.setPosition(-size * 0.5 - 1 * Config.DPR, -2 * Config.DPR);

        // Bar
        this._background?.setSize(size, Config.stageBar.height)
            .setFillStyle(Colors.WHITE, 0.25)
            .setStrokeStyle(3 * Config.DPR, Colors.WHITE)
            .setOrigin(0, 0.5)
            .setPosition(-size * 0.5, 0);

        this._bar?.setSize(size - 1 * Config.DPR, Config.stageBar.height - 3 * Config.DPR)
            .setFillStyle(Colors.GOLD)
            .setOrigin(0, 0.5)
            .setPosition(-size * 0.5, 0)
            .setScale(0, 1);

        // Destroy existing locks
        while (this._locks.length > 0) {
            const lock = this._locks.pop();
            lock?.destroy();
        }

        // Create new locks
        for (const lock of this._stage.locks) {
            let x = ilerp(0, this._stage.total, lock.cap);
            x = lerp(-size * 0.5, size * 0.5, x);
            const stageLock = new StageLock(this.scene, lock)
                .setPosition(x, 0);
            this._locksLayer.add(stageLock);
            this._locks.push(stageLock);
        }
    }

    startNextStage() {
        this._stageLevel++;
        this._stage = new StageStruct(this._stageLevel);
        this.resetGraphics();
    }

    update(time: number) {
        // Bar progress
        if (this._bar) {
            const targetScale = lerp(this._bar.scaleX, this._stage.progress, 0.35);
            this._bar?.setScale(targetScale, 1);
        }

        // Locks
        for (const lock of this._locks)
            lock.update();

        // Icon
        // this._icon.update(time);
    }

    onVibrateLock() {
        for (const lock of this._locks) {
            if (!lock.lock.isOpen) {
                /* gsap.to(lock, {
                    scaleX: 0.75,
                    scaleY: 1.25,
                    // rotation: Math.PI * 0.5,
                    duration: 0.25,
                    repeat: 1,
                    yoyo: true,
                    ease: "rough({template:none.out,strength:2,points:5,taper:none,randomize:false,clamp:false})",
                }); */
                gsap.from(lock, {
                    scale: 1.666,
                    duration: 1,
                    ease: "bounce.out",
                });
                break;
            }
        }
    }

    onQuestCompleted() {
        const wasComplete = this._stage.isComplete;
        const lockStruct = this._stage.decrementLock();

        if (lockStruct) {
            for (const lock of this._locks) {
                if (lock.lock.uuid === lockStruct.uuid) {
                    gsap.from(lock, {
                        scale: 1.5,
                        rotation: Math.PI * 1,
                        duration: 1.5,
                        ease: "elastic.out(1,0.3)",
                    });
                    break;
                }
            }
        }

        if (!wasComplete && this._stage.isComplete)
            EventManager.emit(Events.STAGE_COMPLETED);
    }

    onMainQuestProgress(value: number) {
        const wasComplete = this._stage.isComplete;
        const added = this._stage.add(value);
        this._totalScore += added;

        if (!wasComplete && this._stage.isComplete)
            EventManager.emit(Events.STAGE_COMPLETED);
    }

    destroy(fromScene?: boolean | undefined) {
        EventManager.off(Events.MAIN_QUEST_PROGRESS, this._boundOnMainQuestProgress);
        EventManager.off(Events.QUEST_COMPLETED, this._boundOnQuestCompleted);
        EventManager.off(Events.VIBRATE_LOCK, this._boundOnVibrateLock);

        super.destroy();
    }
}