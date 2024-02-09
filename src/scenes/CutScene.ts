import { Scene } from 'phaser';
import { Config } from '../config';
import { Game } from './Game';

export class CutScene extends Scene {
    private spine_bard!: SpineGameObject;
    constructor() {
        super("CutScene");
    }

    init() {
        this.cameras.main.setBackgroundColor(0x000000);
    }

    preload() {
    }

    create() {
        this.add.text(
            Config.screen.width * 0.5,
            Config.screen.height - 32,
            'CutScene', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(0.5, 1);

        const anim = 'animation';
        this.spine_bard = this.add.spine(Config.screen.width * 0.333, Config.screen.height - 120 * Config.DPR, 'SPINE_BARD', anim, true)
            .setScale(1);
        const clone = this.add.spine(Config.screen.width * 0.666, Config.screen.height - 120 * Config.DPR, 'SPINE_BARD', anim, true)
            .setScale(-0.5, 0.5);
        clone.state.timeScale = 1.1;


        /* setTimeout(() => {
            this.scene.transition({
                target: "Game",
                duration: Config.sceneTransitionDuration,
                onUpdate: (progress: number) => {
                    const v = Phaser.Math.Easing.Quartic.Out(progress);
                    (this.scene.get("Game") as Game).mask?.setScale(1 - v, 1);
                }
            });
        }, 3000); */
    }

    shutdown() { }
}
