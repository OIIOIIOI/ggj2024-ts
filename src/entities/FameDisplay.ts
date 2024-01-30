import { gsap } from "gsap";
import { Colors, Config, Fonts } from "../config";
import { EventManager, Events } from "../managers/Events";

export class FameDisplay extends Phaser.GameObjects.Container {
    private _label: Phaser.GameObjects.Text;
    private _score: Phaser.GameObjects.Text;
    private _icon: Phaser.GameObjects.Image;

    private _boundOnMainQuestProgress: (() => void);
    private _animateTimeout: NodeJS.Timeout | undefined;

    constructor(scene: Phaser.Scene) {
        super(scene);

        this._label = new Phaser.GameObjects.Text(
            this.scene,
            25 * Config.DPR,
            -25 * Config.DPR,
            "Fame",
            Fonts.getStyle(40, Colors.WHITE_HEX, Fonts.TEXT)
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this._score = new Phaser.GameObjects.Text(
            this.scene,
            0,
            28 * Config.DPR,
            "",
            Fonts.getStyle(64, Colors.WHITE_HEX, Fonts.MAIN)
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this._icon = new Phaser.GameObjects.Sprite(
            this.scene,
            this._label.x - 80 * Config.DPR, this._label.y,
            'ui',
            'Picto_Smile.png',
        )
            .setTintFill(Colors.WHITE)
            .setOrigin(0.5, 0.5)
            .setScale(0.55);

        this.add([
            this._label,
            this._icon,
            this._score,
        ]);

        this._boundOnMainQuestProgress = this.onMainQuestProgress.bind(this);
        EventManager.on(Events.MAIN_QUEST_PROGRESS, this._boundOnMainQuestProgress);
    }

    updateValue(v: number) {
        this._score.text = v.toFixed();
    }

    onMainQuestProgress() {
        clearTimeout(this._animateTimeout);
        this._animateTimeout = setTimeout(this.animate.bind(this), 150);
    }

    animate() {
        gsap.from(this._icon, {
            scale: 0.85,
            duration: 1.5,
            ease: "elastic.out(1,0.3)",
        });

        gsap.from(this._score, {
            scale: 1.35,
            duration: 1.5,
            ease: "elastic.out(1,0.3)",
        });
    }

    destroy(fromScene?: boolean | undefined) {
        // EventManager.off(Events.END_TURN, this._boundOnEndTurn);

        super.destroy();
    }
}