import { Config } from "../config";
import { Random } from "../managers/Random";

export class Audience extends Phaser.GameObjects.Container {
    private _members: Array<Array<Phaser.GameObjects.Sprite>>;

    constructor(scene: Phaser.Scene) {
        super(scene);

        this._members = [];

        const rows = 3;
        const memberPerRow = 10;
        // const rowSpacing = Config.screen.height * 0.666 / (rows - 1);
        const rowSpacing = Config.screen.height * 0.1;
        const memberSpacing = Config.screen.width / (memberPerRow - 1);

        const frames = [];
        for (let i = 1; i <= 12; i++)
            frames.push(`Public_Scene_${i}.png`);

        // Loop rows
        for (let y = 0; y < rows; y++) {
            // Add row
            this._members.push([]);

            // Offset odd rows
            const offset = y % 2 === 0 ? 0 : memberSpacing * 0.5;
            const posY = -(rows - y - 1) * rowSpacing - Config.screen.height * 0.3;

            // Set color
            const c = 35 + y * 25;
            const color = new Phaser.Display.Color(c, c, c);

            const rect = new Phaser.GameObjects.Rectangle(
                this.scene,
                0, posY,
                Config.screen.width, 400,
                color.color
            )
                .setOrigin(0.5, 0);
            this.add(rect);

            // Loop members
            for (let x = 0; x < memberPerRow; x++) {
                const m = new Phaser.GameObjects.Sprite(
                    this.scene,
                    -Config.screen.width * 0.5 + x * memberSpacing + offset,
                    posY,
                    'scene',
                    Random.getInstance().pick(frames, true),
                )
                    .setScale(Random.getInstance().sign(true), 1)
                    .setTintFill(color.color)
                    .setOrigin(0.5, 1);
                this._members[y].push(m);
                this.add(m);
            }
        }

        this.add(new Phaser.GameObjects.Rectangle(
            this.scene,
            0, 0,
            Config.screen.width, Config.screen.height, 0x742174)
            .setOrigin(0.5, 1)
            .setBlendMode(Phaser.BlendModes.MULTIPLY)
        );

        const c = 40 + rows * 40;
        const color = new Phaser.Display.Color(c, c, c);
        const rect = new Phaser.GameObjects.Rectangle(
            this.scene,
            0, 0,
            Config.screen.width, 200 * Config.DPR,
            0x353756
        )
            .setOrigin(0.5, 1);
        this.add(rect);
    }
}