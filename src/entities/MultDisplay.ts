import { Colors, Config, Fonts } from "../config";

export class MultDisplay extends Phaser.GameObjects.Container {
    private _multBackground: Phaser.GameObjects.Ellipse;
    private _multText: Phaser.GameObjects.Text;
    private _multSubText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene);

        this._multBackground = new Phaser.GameObjects.Ellipse(
            this.scene,
            0, 0,
            100 * Config.DPR, 100 * Config.DPR,
            Colors.GOLD
        );

        this._multText = new Phaser.GameObjects.Text(
            this.scene,
            this._multBackground.x + 0 * Config.DPR,
            this._multBackground.y - 10 * Config.DPR,
            "",
            Fonts.getStyle(55, Colors.WHITE_HEX, Fonts.MAIN),
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this._multSubText = new Phaser.GameObjects.Text(
            this.scene,
            this._multBackground.x + 0 * Config.DPR,
            this._multBackground.y + 25 * Config.DPR,
            "MULT",
            Fonts.getStyle(18, Colors.BLACK_HEX, Fonts.TEXT),
        )
            .setAlign('center')
            .setOrigin(0.5, 0.5);

        this.add([
            this._multBackground,
            this._multText,
            this._multSubText,
        ]);
    }

    setMult(mult: number) {
        this._multText.text = `x${mult}`;
    }
}