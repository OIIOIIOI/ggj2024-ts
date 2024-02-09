import { Scene } from 'phaser';
import { Colors, Config, Fonts } from '../config';

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        const h = 30 * Config.DPR;

        this.add.rectangle(
            Config.screen.width * 0.5,
            Config.screen.height * 0.5,
            Config.screen.width * 0.5,
            h
        ).setStrokeStyle(4, 0xffffff);

        const bar = this.add.rectangle(
            Config.screen.width * 0.25,
            Config.screen.height * 0.5,
            Config.screen.width * 0.5,
            h - 4 * Config.DPR,
            Colors.GOLD)
            .setOrigin(0, 0.5);

        this.add.text(
            Config.screen.width * 0.5,
            Config.screen.height * 0.5 - 55 * Config.DPR,
            "The Comedians are getting ready...",
            Fonts.getStyle(32, Colors.WHITE_HEX, Fonts.MAIN)
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this.load.on('progress', (progress: number) => {
            bar.setScale(progress, 1);
        });
    }

    preload() {
        this.load.setPath('assets');

        // this.load.audio('main_theme', 'ComediceTheme_Loop.mp3');
        this.load.multiatlas('main', `Main_Spritesheet@${Config.DPR}x.json`, 'assets');
        this.load.multiatlas('ui', `UI_Spritesheet@${Config.DPR}x.json`, 'assets');
        this.load.multiatlas('scene', `Scene_Spritesheet@${Config.DPR}x.json`, 'assets');
        this.load.multiatlas('screens', `Screen_Spritesheet@${Config.DPR}x.json`, 'assets');

        this.load.spine('SPINE_BARD', 'Barde_Idle_test/Barde_puppet.json', 'Barde_Idle_test/Barde_puppet.atlas');
    }

    create() {
        if (!import.meta.env.PROD)
            this.scene.start('Game');
        else
            this.scene.start('MainMenu');
    }
}
