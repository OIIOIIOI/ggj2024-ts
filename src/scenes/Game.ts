import { Power3, gsap } from 'gsap';
import { Scene } from 'phaser';
import { EventManager, Events } from '../managers/Events';
import { Colors, Config } from '../config';
import { StageBar } from '../entities/StageBar';
import { Char } from '../entities/Char';
import { Dice } from '../entities/Dice';
import { MainQuestCard } from '../entities/MainQuestCard';
import { QuestCard } from '../entities/QuestCard';
import { CharType } from '../struct/CharStruct';
import { MainQuestStruct } from '../struct/MainQuestStruct';
import { QuestBook } from '../struct/QuestBook';
import { QuestRequirement, QuestRequirementMode } from '../struct/QuestRequirement';
import { Rewards } from '../managers/Rewards';
import { QuestReward, QuestRewardTarget, QuestRewardType } from '../struct/QuestReward';

export class Game extends Scene {
    static preventAllInteractions: boolean = true;
    static firstTimeUsedDice = 3;

    // Entities
    private _chars: Array<Char> = [];
    public get chars() { return this._chars; }
    private _questCards: Array<QuestCard> = [];
    private _bossBar: StageBar | undefined;

    // Data
    private _mainQuestCard: MainQuestCard | undefined;
    public get mainQuestCard() { return this._mainQuestCard; }
    private _turnsRemaining: number = 10;

    // Layers
    private _charsLayer: Phaser.GameObjects.Container | undefined;
    private _questsLayer: Phaser.GameObjects.Container | undefined;
    private _diceLayer: Phaser.GameObjects.Container | undefined;
    private _uiLayer: Phaser.GameObjects.Container | undefined;

    // UI
    private _endTurnButton: Phaser.GameObjects.Text | undefined;
    private _turnText: Phaser.GameObjects.Text | undefined;

    public mask: Phaser.GameObjects.Rectangle | undefined;

    private _boundOnMainQuestProgress: (() => void) | undefined;

    constructor() {
        super("Game");
    }

    init() {
        this.cameras.main.setBackgroundColor(Colors.BACKGROUND);

        // Reset data
        this._chars = [];
        this._questCards = [];
        this._turnsRemaining = 10;
    }

    preload() { }

    create() {
        Game.preventAllInteractions = true;

        // Create all layers
        this._charsLayer = this.add.container();
        this._questsLayer = this.add.container();
        this._diceLayer = this.add.container();
        this._uiLayer = this.add.container();
        this.mask = this.add.rectangle(0, 0, Config.screen.width, Config.screen.height, 0x000000)
            .setOrigin(0, 0)
            .removeFromDisplayList();

        // Seed the randomizer
        // Random.getInstance().setSeed('make me laugh');

        // Setup rewards manager
        Rewards.getInstance().setup(this);

        // Turns display
        this._turnText = this.add.text(
            10, 10,
            "", {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });

        // End turn button
        this._endTurnButton = this.add.text(
            Config.screen.width - 20, Config.screen.height - 20,
            "END TURN", {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(1, 1)
            .setInteractive()
            .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
                if (Game.preventAllInteractions)
                    return;
                this.endTurn();
            });

        // Boss bar
        this._bossBar = new StageBar(this)
            .setPosition(Config.screen.width * 0.5, 30);

        // Add to UI layer
        this._uiLayer.add([
            this._turnText,
            this._endTurnButton,
            this._bossBar,
        ]);

        // NOTE Debug scene name
        let t = this.add.text(
            Config.screen.width * 0.5,
            Config.screen.height - 32 * Config.DPR,
            'Game', {
            fontFamily: 'Arial Black', fontSize: 32 * Config.DPR, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8 * Config.DPR,
            align: 'center'
        })
            .setOrigin(0.5, 1)
            .setInteractive()
            .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
                this.scene.start('GameOver');
            });
        this._uiLayer.add(t);

        // NOTE Cutscene test
        t = this.add.text(
            Config.screen.width * 0.5,
            50 * Config.DPR,
            'Launch cutscene', {
            fontFamily: 'Arial Black',
            fontSize: 24 * Config.DPR,
            color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        })
            .setOrigin(0.5, 0)
            .setInteractive()
            .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
                this.mask?.setScale(0, 1)
                    .addToDisplayList();
                this.scene.transition({
                    target: "CutScene",
                    // moveAbove: true,
                    moveBelow: true,
                    duration: Config.sceneTransitionDuration,
                    sleep: true,
                    onUpdate: (progress: number) => {
                        const v = Phaser.Math.Easing.Bounce.Out(progress);
                        this.mask?.setScale(v, 1);
                    }
                });
            });
        this._uiLayer.add(t);

        // Listen to "use remaining dice" event
        EventManager.on(Events.USE_REMAINING_DICE, this.onUseRemainingDice.bind(this));

        // Listen to "end turn" event
        EventManager.on(Events.END_TURN, this.onEndTurn.bind(this));

        // Listen to quest events
        EventManager.on(Events.QUEST_COMPLETED, this.onQuestCompleted.bind(this));
        EventManager.on(Events.QUEST_FAILED, this.onQuestFailed.bind(this));

        // Listen to requirement events (to keep track of used dice)
        EventManager.on(Events.REQUIREMENT_PROGRESS, this.onDiceUsed.bind(this));
        EventManager.on(Events.REQUIREMENT_COMPLETED, this.onDiceUsed.bind(this));

        // Listen to main quest progress if needed
        if (Game.firstTimeUsedDice > 0) {
            this._boundOnMainQuestProgress = this.onMainQuestProgress.bind(this);
            EventManager.on(Events.MAIN_QUEST_PROGRESS, this._boundOnMainQuestProgress);
        }

        // Listen to shutdown event
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdown.bind(this));

        // Create all characters
        this.createCharAndDice(CharType.BARD, 300 * Config.DPR);
        this.createCharAndDice(CharType.POET, 700 * Config.DPR);
        this.createCharAndDice(CharType.MIMO, 1100 * Config.DPR);

        // Create main quest
        const mainQuest = new MainQuestStruct()
            .addRequirement(new QuestRequirement(CharType.ANY, QuestRequirementMode.MIN, 1))
            .setTurnsRemaining(9999);
        this._mainQuestCard = new MainQuestCard(this, mainQuest)
            .setPosition(Config.screen.width * 0.75, 300 * Config.DPR);
        this._questsLayer?.add(this._mainQuestCard);

        // Activate main quest
        this._mainQuestCard.activate();

        // Activate first quest if player has already played
        if (Game.firstTimeUsedDice <= 0)
            this.activateNextQuest(true);

        // Throw and show
        this.throwAllDice();
    }

    private onMainQuestProgress() {
        Game.firstTimeUsedDice--;

        if (Game.firstTimeUsedDice === 0) {
            EventManager.off(Events.MAIN_QUEST_PROGRESS, this._boundOnMainQuestProgress);
            // Activate first quest
            this.activateNextQuest();
        }
    }

    private endTurn() {
        this._turnsRemaining--;
        EventManager.emit(Events.END_TURN);
    }

    private queueAnotherQuest() {
        const i = this._questCards.length;
        const quest = QuestBook.getInstance().pickOne();
        const card = new QuestCard(this, quest)
            .setPosition(Config.questCard.startX, Config.questCard.startY);
        this._questsLayer?.addAt(card, 0);
        this._questCards.push(card);
    }

    private activateNextQuest(primed: boolean = false) {
        while (this._questCards.length < Config.maxVisibleQuests) {
            this.queueAnotherQuest();
        }

        // Reset target positions
        for (let i = 0; i < this._questCards.length; i++) {
            const card = this._questCards[i];
            card.targetPosition = new Phaser.Geom.Point(Config.screen.width * 0.25 + i * -40, Config.questCard.startY);
        }

        const card = this._questCards[0];
        // console.log('Activating card', card?.quest.uuid);
        card?.activate(primed);
    }

    private createCharAndDice(type: CharType, x: number) {
        const char = new Char(this, type);
        char.setPosition(x, Config.screen.height);
        if (this._charsLayer)
            this._charsLayer.add(char);
        this._chars.push(char);

        /* for (const dice of char.diceEntities) {
            if (this._diceLayer)
                this._diceLayer.add(dice);
        } */
    }

    private throwAllDice() {
        // Actual dice "throw" (get new random values)
        for (const char of this._chars) {
            char.throwAllDice();
        }

        const timeline = gsap.timeline({
            defaults: {
                duration: 0.4,
                ease: Power3.easeOut,
            },
            onStart: () => {
                Game.preventAllInteractions = true;
            },
            onComplete: () => {
                Game.preventAllInteractions = false;
            },
        });

        for (const char of this._chars) {
            let diceWidth = Config.diceSize * char.diceEntities.length + Config.diceSize * 0.25 * (char.diceEntities.length - 1);
            let startX = char.x + Config.diceSize / 2 - diceWidth / 2;

            for (let i = 0; i < char.diceEntities.length; i++) {
                const dice = char.diceEntities[i];
                timeline.fromTo(
                    dice,
                    // Start values
                    {
                        x: startX + i * Config.diceSize * 1.25,
                        y: Config.screen.height + Config.diceSize * 0.75,
                        rotation: Math.PI,
                    },
                    // End values
                    {
                        x: startX + i * Config.diceSize * 1.25 + Math.random() * Config.dicePosition * 2 - Config.dicePosition,
                        y: char.y - Config.diceSize * 0.75 + Math.random() * Config.dicePosition * 2 - Config.dicePosition,
                        rotation: Math.PI * (Math.random() * Config.diceRotation * 2 - Config.diceRotation),
                        onStart: () => {
                            this._diceLayer?.add(dice);
                            dice.setVisible(true);
                            // Deactivate dice
                            if (dice.input)
                                dice.input.enabled = false;
                        },
                        onComplete: () => {
                            // Activate dice
                            if (dice.input)
                                dice.input.enabled = true;
                        },
                    },
                    "<0.1"
                );
            }
        }
    }

    update(time: number, delta: number) {
        // Update all chars (and their dice)
        for (let i = 0; i < this._chars.length; i++) {
            const char = this._chars[i];
            char.update();
        }

        // Update main quest card
        this._mainQuestCard?.update(time);

        // Update all quest cards
        for (let i = 0; i < this._questCards.length; i++) {
            const card = this._questCards[i];
            card.update(time);
        }

        // Update UI
        this._bossBar?.update();
        if (this._turnText)
            this._turnText.text = "Turns remaining: " + this._turnsRemaining;
    }

    private getQuestCardFromUUID(uuid: string): QuestCard | undefined {
        for (const card of this._questCards) {
            if (card.quest.uuid === uuid)
                return card;
        }
        return undefined;
    }

    private deleteQuestCardFromUUID(uuid: string): QuestCard | undefined {
        const card = this.getQuestCardFromUUID(uuid);
        this._questCards = this._questCards.filter((card) => card.quest.uuid !== uuid);
        return card;
    }

    private onDiceUsed() {
        let allDiceUsed = true;
        for (const char of this._chars) {
            for (const dice of char.diceEntities) {
                if (dice.visible)
                    allDiceUsed = false;
            }
        }
        // Automatically end turn
        if (allDiceUsed)
            this.endTurn();
    }

    private onUseRemainingDice() {
        const slot = this._mainQuestCard?.getSlot();
        if (!slot)
            return;

        // Filter and sort dice
        let sortedDice: Array<Dice> = [];
        for (const char of this._chars) {
            for (let i = 0; i < char.diceEntities.length; i++) {
                const dice = char.diceEntities[i];
                // If dice was used already, skip it
                if (!dice.visible || !slot.isDiceValid(dice))
                    continue;
                sortedDice.push(dice);
            }
        }
        sortedDice.sort((a, b) => b.dice.currentValue - a.dice.currentValue);

        // Prepare timeline
        const timeline = gsap.timeline({
            defaults: {
                rotation: -Math.PI * 2,
                duration: 0.4,
                ease: Power3.easeOut,
            },
            onStart: () => {
                Game.preventAllInteractions = true;
            },
            onComplete: () => {
                Game.preventAllInteractions = false;
            },
        });

        // Animate all dice
        for (const dice of sortedDice) {
            timeline.to(
                dice,
                {
                    x: (this._mainQuestCard ? this._mainQuestCard.x : 0) + slot.x,
                    y: (this._mainQuestCard ? this._mainQuestCard.y : 0) + slot.y,
                    onStart: () => {
                        // Deactivate dice
                        if (dice.input)
                            dice.input.enabled = false;
                    },
                    onComplete: () => {
                        slot.addDice(dice);
                    },
                },
                "<0.1"
            );
        }
    }

    private onEndTurn() {
        // console.log("onEndTurn");

        this.throwAllDice();
    }

    private onQuestCompleted(uuid: string) {
        console.log('Detected quest completed!', uuid);

        // Get target quest card
        const card = this.getQuestCardFromUUID(uuid);
        // Queue rewards for success
        if (card?.rewardsForSuccess)
            Rewards.getInstance().queue(card?.rewardsForSuccess, card.quest);

        // Delete quest and activate the next
        this.deleteQuestAndActivateNext(uuid, true);
    }

    private onQuestFailed(uuid: string) {
        console.log('Detected quest failed!', uuid);

        // Get target quest card
        const card = this.getQuestCardFromUUID(uuid);
        // Queue rewards for fail
        if (card?.rewardsForFail)
            Rewards.getInstance().queue(card?.rewardsForFail, card.quest);

        // Delete quest and activate the next
        this.deleteQuestAndActivateNext(uuid, false);
    }

    private deleteQuestAndActivateNext(uuid: string, success: boolean) {
        const card = this.deleteQuestCardFromUUID(uuid);

        if (card) {
            card.isBeingDestroyed = true;
            gsap.to(card, {
                y: success ? `-=${Config.questCard.height * 2}` : `+=${Config.questCard.height * 2}`,
                rotation: success ? `-=${Math.PI * 0.2}` : `+=${Math.PI * 0.2}`,
                alpha: 0,
                duration: 0.5,
                onComplete: () => {
                    card?.destroy();
                    this.activateNextQuest(!success);// Prime if previous quest failed
                }
            });
        }
        else
            this.activateNextQuest(!success);// Prime if previous quest failed
    }

    private shutdown() {
        EventManager.off(Events.USE_REMAINING_DICE);
        EventManager.off(Events.END_TURN);
        EventManager.off(Events.QUEST_COMPLETED);
        EventManager.off(Events.QUEST_FAILED);
        EventManager.off(Events.REQUIREMENT_PROGRESS);
        EventManager.off(Events.REQUIREMENT_COMPLETED);

        this.events.off(Phaser.Scenes.Events.SHUTDOWN);
    }
}
