import * as Phaser from 'phaser';

export class Config {
    static DEBUG: boolean = false;

    static DPR: number = window.devicePixelRatio <= 1 ? 1 : 2;

    static screen = { width: 1920 * Config.DPR, height: 1080 * Config.DPR };
    static questCard = { width: 700 * Config.DPR, height: 250 * Config.DPR, startX: -350 * Config.DPR, startY: 340 * Config.DPR };
    static stageBar = { width: 1200 * Config.DPR, height: 37 * Config.DPR };
    static diceSize: number = 100 * Config.DPR;
    static sceneTransitionDuration: number = 1000;
    static diceRotationRandom: number = 0.05;
    static dicePositionRandom: number = 5;

    static mainQuestTurns: number = 30;//30?
    static startingStageLevel: number = 0;// Should be 0 unless testing something
    static stageBaseDifficulty: number = 10;
    static maxVisibleQuests: number = 3;
    static locksPerStage: number = 0;// NOTE will be added to stage level
    static questsPerLock: number = 0;// NOTE will be added to stage level
    static maxQuestsPerLock: number = 3;

    static discordWebhook: string = import.meta.env.VITE_DISCORD_WEBHOOK || "";
}

export class Colors {
    static BLACK_HEX: string = '#000000';
    static WHITE_HEX: string = '#FFFFFF';
    static BACKGROUND_HEX: string = '#1D1D2E';
    static DARK_HEX: string = '#097F89';
    static LIGHT_HEX: string = '#FFCD96';
    static PINK_HEX: string = '#FF7777';
    static GOLD_HEX: string = '#D6A100';

    static SLOT_ANY_HEX: string = '#ECECEC';
    static SLOT_MIMO_HEX: string = '#FFD4D5';
    static SLOT_BARD_HEX: string = '#FFE9D4';
    static SLOT_POET_HEX: string = '#C2D5DA';

    static CHECK_ANY_HEX: string = '#BDBDBD';
    static CHECK_MIMO_HEX: string = '#FF6C6F';
    static CHECK_BARD_HEX: string = '#E9AD72';
    static CHECK_POET_HEX: string = '#38899D';

    static BLACK: number = Phaser.Display.Color.HexStringToColor(Colors.BLACK_HEX).color;
    static WHITE: number = Phaser.Display.Color.HexStringToColor(Colors.WHITE_HEX).color;
    static BACKGROUND: number = Phaser.Display.Color.HexStringToColor(Colors.BACKGROUND_HEX).color;
    static DARK: number = Phaser.Display.Color.HexStringToColor(Colors.DARK_HEX).color;
    static LIGHT: number = Phaser.Display.Color.HexStringToColor(Colors.LIGHT_HEX).color;
    static PINK: number = Phaser.Display.Color.HexStringToColor(Colors.PINK_HEX).color;
    static GOLD: number = Phaser.Display.Color.HexStringToColor(Colors.GOLD_HEX).color;
    static SLOT_ANY: number = Phaser.Display.Color.HexStringToColor(Colors.SLOT_ANY_HEX).color;
    static SLOT_MIMO: number = Phaser.Display.Color.HexStringToColor(Colors.SLOT_MIMO_HEX).color;
    static SLOT_BARD: number = Phaser.Display.Color.HexStringToColor(Colors.SLOT_BARD_HEX).color;
    static SLOT_POET: number = Phaser.Display.Color.HexStringToColor(Colors.SLOT_POET_HEX).color;
    static CHECK_ANY: number = Phaser.Display.Color.HexStringToColor(Colors.CHECK_ANY_HEX).color;
    static CHECK_MIMO: number = Phaser.Display.Color.HexStringToColor(Colors.CHECK_MIMO_HEX).color;
    static CHECK_BARD: number = Phaser.Display.Color.HexStringToColor(Colors.CHECK_BARD_HEX).color;
    static CHECK_POET: number = Phaser.Display.Color.HexStringToColor(Colors.CHECK_POET_HEX).color;
}

export class Fonts {
    static MAIN = "paroli";
    static TEXT = "dovetail-mvb";

    static getStyle(size: number, color: string, font: string) {
        return {
            fontFamily: font,
            fontSize: size * Config.DPR,
            color: color,
        }
    }
}