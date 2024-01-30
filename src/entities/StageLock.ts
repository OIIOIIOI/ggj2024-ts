import { Colors, Config, Fonts } from "../config";
import { Random } from "../managers/Random";
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle.js';

export class StageLock extends Phaser.GameObjects.Container {
    private _lock: StageLockStruct;
    public get lock() { return this._lock; };

    protected _background: RoundRectangle;
    protected _text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, lock: StageLockStruct) {
        super(scene);

        this._lock = lock;

        this._background = new RoundRectangle(
            this.scene,
            0, 0,
            60 * Config.DPR, Config.stageBar.height * 1.35,
            10,
            Colors.WHITE
        );

        this._text = new Phaser.GameObjects.Text(
            this.scene, 0, 0,
            "",
            Fonts.getStyle(32, Colors.BLACK_HEX, Fonts.MAIN)
        )
            .setOrigin(0.5, 0.5);

        this.add([
            this._background,
            this._text,
        ]);
    }

    update() {
        if (!this.visible)
            return;

        this._text.text = this._lock.remaining;

        if (this._lock.isOpen)
            this.setVisible(false);
    }
}

export class StageLockStruct {
    readonly uuid: string;
    private _questsNeeded: number;
    private _questsDone: number;
    public get isOpen() { return this._questsDone >= this._questsNeeded; };
    public get remaining() { return (this._questsNeeded - this._questsDone).toFixed(); };

    readonly cap: number;

    constructor(questsNeeded: number, cap: number) {
        this.uuid = Random.getInstance().uuid();
        this._questsNeeded = questsNeeded;
        this._questsDone = 0;
        this.cap = cap;
    }

    updateCount(count: number = 1) {
        this._questsDone += count;

        // if (this.isOpen)
        // console.log('lock @' + this.cap, 'is open');
    }
}