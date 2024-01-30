import { gsap, Power3 } from "gsap";
import { EventManager, Events } from "../managers/Events";
import { CharStruct, CharType } from "../struct/CharStruct";
import { Dice } from "./Dice";
import { Colors, Config } from "../config";
import { lerp } from "../utils";

export class Char extends Phaser.GameObjects.Container {
    // Actual char class
    private _char: CharStruct;
    public get char() { return this._char; }

    // Graphics objects
    private _prefix: string;
    private _body: Phaser.GameObjects.Sprite;

    public diceEntities: Array<Dice> = [];

    private _basePosition: Phaser.Geom.Point;
    private _fadeColor: Phaser.Display.Color;
    private _boundOnDicePickedUp: (type: CharType) => void;
    private _boundOnDiceDropped: (type: CharType) => void;

    constructor(scene: Phaser.Scene, type: CharType) {
        super(scene);
        // console.log(type);

        // Create this char's struct
        this._char = new CharStruct(type);

        this._basePosition = new Phaser.Geom.Point(this.x, this.y);

        this._prefix = (() => {
            switch (this.char.type) {
                case CharType.BARD: return 'Barde';
                case CharType.POET: return 'Poet';
                case CharType.MIMO: return 'Mimo';
                default: return '';
            }
        })();

        this._fadeColor = (() => {
            switch (this.char.type) {
                case CharType.BARD: return new Phaser.Display.Color(100, 100, 100);
                case CharType.POET: return new Phaser.Display.Color(100, 100, 100);
                case CharType.MIMO: return new Phaser.Display.Color(100, 100, 100);
                default: return new Phaser.Display.Color(100, 100, 100);
            }
        })();

        this._body = new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'main', `${this._prefix}_Idle.png`)
            .setOrigin(0.5, 1);

        this.add([
            this._body,
        ]);

        // Create the dice entities from this char's dice pool
        for (const dice of this._char.dicePool)
            this.diceEntities.push(new Dice(this.scene, dice));

        this._boundOnDicePickedUp = this.onDicePickedUp.bind(this);
        this._boundOnDiceDropped = this.onDiceDropped.bind(this);
        EventManager.on(Events.DICE_PICKED_UP, this._boundOnDicePickedUp);
        EventManager.on(Events.DICE_DROPPED, this._boundOnDiceDropped);
    }

    setPosition(x?: number | undefined, y?: number | undefined, z?: number | undefined, w?: number | undefined): this {
        super.setPosition(x, y, z, w);
        this._basePosition?.setTo(x, y);
        return this;
    }

    onDicePickedUp(type: CharType) {
        if (type === this._char.type)
            this._body.setFrame(`${this._prefix}_Select.png`);

        let destY = type === this._char.type ?
            this._basePosition.y - 30 * Config.DPR :
            this._basePosition.y + 20 * Config.DPR;

        gsap.to(this, {
            y: destY,
            duration: 0.35,
            ease: "power3.out",
            onUpdate: function (body, color) {
                if (!body) return;
                const p = Power3.easeOut(this.progress());
                const r = lerp(255, color.r, p);
                const g = lerp(255, color.g, p);
                const b = lerp(255, color.b, p);
                const c = new Phaser.Display.Color(r, g, b);
                body.setTint(c.color);
            },
            onUpdateParams: [type !== this._char.type ? this._body : false, this._fadeColor],
        });
    }

    onDiceDropped(type: CharType) {
        if (type === this._char.type)
            this._body.setFrame(`${this._prefix}_Idle.png`);

        gsap.to(this, {
            y: this._basePosition.y,
            duration: 0.35,
            ease: "power3.out",
            onUpdate: function (body, color) {
                if (!body) return;
                const p = 1 - Power3.easeOut(this.progress());
                const r = lerp(255, color.r, p);
                const g = lerp(255, color.g, p);
                const b = lerp(255, color.b, p);
                const c = new Phaser.Display.Color(r, g, b);
                body.setTint(c.color);
            },
            onUpdateParams: [type !== this._char.type ? this._body : false, this._fadeColor],
        });
    }

    update() {
        for (let i = 0; i < this.diceEntities.length; i++) {
            const dice = this.diceEntities[i];
            dice.update();
        }
    }

    throwAllDice() {
        for (let i = 0; i < this._char.dicePool.length; i++) {
            const dice = this._char.dicePool[i];
            dice.throw();
        }
    }

    addDice(n: number) {
        // Add to dice to pool
        const newDice = this._char.addDice(n);
        // Create the new dice entities
        for (const dice of newDice)
            this.diceEntities.push(new Dice(this.scene, dice));
    }

    removeDice(n: number) {
        // Remove dice from pool
        const oldDice = this._char.removeDice(n);
        // Delete the old dice entities
        const oldUUIDs = oldDice.map((dice) => dice?.uuid);
        const oldDiceEntities = this.diceEntities.filter((dice) => oldUUIDs.includes(dice.dice.uuid));
        for (const dice of oldDiceEntities)
            dice.destroy();
        this.diceEntities = this.diceEntities.filter((dice) => !oldUUIDs.includes(dice.dice.uuid));
    }

    destroy() {
        EventManager.off(Events.DICE_PICKED_UP, this._boundOnDicePickedUp);
        EventManager.off(Events.DICE_PICKED_UP, this._boundOnDiceDropped);
        super.destroy();
    }
}