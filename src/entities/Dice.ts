import { Colors, Config, Fonts } from "../config";
import { EventManager, Events } from "../managers/Events";
import { Random } from "../managers/Random";
import { Game } from "../scenes/Game";
import { CharType } from "../struct/CharStruct";
import { DiceStruct } from "../struct/DiceStruct";
import { ilerp, lerp } from "../utils";
import { QuestSlot } from "./QuestSlot";
import { gsap, Power3, Elastic, Bounce } from 'gsap';

export class Dice extends Phaser.GameObjects.Container {
    // Actual dice class
    private _dice: DiceStruct;
    public get dice() { return this._dice; }

    // Graphics objects
    private _background: Phaser.GameObjects.Sprite | undefined;
    private _dots: Phaser.GameObjects.Sprite | undefined;
    private _text: Phaser.GameObjects.Text | undefined;

    private _shiftKey: Phaser.Input.Keyboard.Key | undefined;
    private _isBeingDragged = false;
    private _dragPosition = new Phaser.Geom.Point(0, 0);

    constructor(scene: Phaser.Scene, dice: DiceStruct) {
        super(scene);

        this._dice = dice;

        this.createGraphics();
        this.setupBehaviour();
    }

    getColor() {
        switch (this._dice.type) {
            case CharType.BARD: return Colors.DARK;
            case CharType.POET: return Colors.LIGHT;
            case CharType.MIMO: return Colors.PINK;
            default: return 0xFFFFFF;
        }
    }

    createGraphics() {
        const prefix = (() => {
            switch (this.dice.type) {
                case CharType.BARD: return 'Barde';
                case CharType.POET: return 'Poet';
                case CharType.MIMO: return 'Mimo';
                default: return '';
            }
        })();

        // Background

        const frames = [];
        for (let i = 1; i <= 3; i++)
            frames.push(`Dice_${prefix}_UI_${i}.png`);

        this._background = new Phaser.GameObjects.Sprite(
            this.scene,
            0, 0,
            'ui',
            Random.getInstance().pick(frames),
        )
            .setOrigin(0.5, 0.5)
            .setScale(Random.getInstance().sign(), Random.getInstance().sign())
            .setRotation(Random.getInstance().integerInRange(0, 3) * Math.PI);

        // Dots

        this._dots = new Phaser.GameObjects.Sprite(
            this.scene,
            0, 0,
            'ui',
            `ValeurDice_${this._dice.currentValue}.png`,
        )
            .setOrigin(0.5, 0.5)
            .setScale(Random.getInstance().sign(), Random.getInstance().sign())
            .setRotation(Random.getInstance().integerInRange(0, 3) * Math.PI);

        this.add([
            this._background,
            this._dots,
        ]);
    }

    setupBehaviour() {
        if (!this._background)
            return;

        // Set interactive
        this.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(
                -this._background.width * 0.5,
                -this._background.height * 0.5,
                this._background.width,
                this._background.height
            ),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            draggable: true,
        }, Phaser.Geom.Rectangle.Contains);

        // Setup Shift key
        if (this.scene.input && this.scene.input.keyboard)
            this._shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Click
        this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onPointerDown);

        // Drag & drop
        this.on(Phaser.Input.Events.GAMEOBJECT_DRAG_START, this.onDragStart);
        this.on(Phaser.Input.Events.GAMEOBJECT_DRAG, this.onDrag);
        this.on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, this.onDragEnd);
        this.on(Phaser.Input.Events.GAMEOBJECT_DROP, this.onDrop);// Triggers only if dropped on a Zone
        // this.on(Phaser.Input.Events.GAMEOBJECT_DRAG_ENTER, this.onDragEnter);
        // this.on(Phaser.Input.Events.GAMEOBJECT_DRAG_LEAVE, this.onDragLeave);
    }

    update() {
        if (this._dots)
            this._dots.setFrame(`ValeurDice_${this._dice.currentValue}.png`);

        const positionSpeed = 0.5;

        if (this._isBeingDragged) {
            this.setPosition(
                lerp(this.x, this._dragPosition.x, positionSpeed),
                lerp(this.y, this._dragPosition.y, positionSpeed)
            );
        }
        else {
            this._dragPosition.setTo(this.x, this.y);
        }
    }

    onPointerDown(pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) {
        if (Game.preventAllInteractions)
            return;

        if (this._shiftKey!.isDown)
            this._dice.throw();

        event.stopPropagation();
    }

    onDragStart(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
        if (Game.preventAllInteractions)
            return;

        const parent = this.parentContainer || this.scene.children;
        parent.bringToTop(this);

        this._isBeingDragged = true;

        EventManager.emit(Events.DICE_PICKED_UP, this._dice.type);

        gsap.to(this, {
            scaleX: 1.2,
            scaleY: 1.2,
            rotation: Math.PI * (Math.random() * Config.diceRotation * 2 - Config.diceRotation),
            duration: 0.65,
            ease: Elastic.easeOut,
            overwrite: true,
        });
    }

    onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
        this._dragPosition.setTo(dragX, dragY);
    }

    onDragEnd(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
        if (!this._isBeingDragged)
            return;

        this._isBeingDragged = false;

        EventManager.emit(Events.DICE_DROPPED, this._dice.type);

        gsap.to(this, {
            scaleX: 1,
            scaleY: 1,
            rotation: this.rotation * 0.5,
            duration: 0.5,
            ease: Bounce.easeOut,
            overwrite: true,
        })
    }

    onDrop(pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) {
        this._isBeingDragged = false;

        EventManager.emit(Events.DICE_DROPPED, this._dice.type);

        const slot = target.parentContainer as QuestSlot;
        const p = slot.getLocalPoint(this.x, this.y);

        if (this.isValidTarget(target) && slot.isDiceValid(this)) {
            gsap.to(this, {
                x: `-=${p.x}`,
                y: `-=${p.y}`,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                duration: 0.2,
                ease: Power3.easeOut,
                overwrite: true,
                onStart: () => {
                    if (this.input)
                        this.input.enabled = false;
                },
                onComplete: () => {
                    slot.addDice(this);
                },
            });
        }
        else {
            gsap.to(this, {
                x: this.input?.dragStartX,
                y: this.input?.dragStartY,
                scaleX: 1,
                scaleY: 1,
                rotation: this.rotation * 0.5,
                duration: 0.2,
                ease: Power3.easeOut,
                overwrite: true,
                onStart: () => {
                    if (this.input)
                        this.input.enabled = false;
                },
                onComplete: () => {
                    if (this.input)
                        this.input.enabled = true;
                },
            });
        }
    }

    private isValidTarget(target: Phaser.GameObjects.GameObject) {
        // Check if target is a Zone, has a parent and parent is a Slot
        return target instanceof Phaser.GameObjects.Zone &&
            target.parentContainer &&
            target.parentContainer instanceof QuestSlot;
    }

    /* onDragEnter(pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) {
        if (!this.isValidTarget(target))
            return;

        const slot = target.parentContainer as QuestSlot;
        slot.addDice(this);
    } */

    /* onDragLeave(pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.GameObject) {
        if (!this.isValidTarget(target))
            return;

        const slot = target.parentContainer as QuestSlot;
        slot.removeDice(this);
    } */
}