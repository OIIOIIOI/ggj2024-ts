import { Char } from "../entities/Char";
import { Game } from "../scenes/Game";
import { CharType } from "../struct/CharStruct";
import { QuestReward, QuestRewardTarget, QuestRewardType } from "../struct/QuestReward";
import { QuestStruct } from "../struct/QuestStruct";
import { EventManager, Events } from "./Events";
import { Random } from "./Random";

export class Rewards {
    private static instance: Rewards;

    private _game: Game | undefined;
    private _queue: Array<RewardObject> = [];

    private _boundOnEndTurn: (() => void) | undefined;

    public static getInstance(): Rewards {
        if (!Rewards.instance)
            Rewards.instance = new Rewards();

        return Rewards.instance;
    }

    constructor() { }

    setup(game: Game) {
        this._game = game;
        this._queue = [];

        // Listen to "end turn" event
        this._boundOnEndTurn = this.onEndTurn.bind(this);
        EventManager.on(Events.END_TURN, this._boundOnEndTurn);
    }

    onEndTurn() {
        for (const rewardObject of this._queue)
            rewardObject.turnsRemaining--;

        const expiredRewards = this._queue.filter((ro) => ro.turnsRemaining < 0);
        this._queue = this._queue.filter((ro) => ro.turnsRemaining >= 0);

        for (const rewardObject of expiredRewards) {
            // TODO Avoid cancelling a reward with the same effect that started later
            // TODO (ex: resetting the multiplier even though we got it again 1 turn later - should be extended)
            if (rewardObject.endCallback)
                rewardObject.endCallback();
        }
    }

    queue(rewards: Array<QuestReward>, quest: QuestStruct) {
        for (const reward of rewards) {
            // console.log('NEW REWARD:', reward.target, reward.type, reward.args);

            const rewardObject: RewardObject = {
                reward: reward,
                quest: quest,
                turnsRemaining: 1
            };
            this._queue.push(rewardObject);

            switch (reward.target) {
                case QuestRewardTarget.ONE_RANDOM_CHAR:
                case QuestRewardTarget.ONE_RANDOM_QUEST_CHAR:
                case QuestRewardTarget.ALL_QUEST_CHARS:
                case QuestRewardTarget.ONE_RANDOM_NON_QUEST_CHAR:
                case QuestRewardTarget.ALL_NON_QUEST_CHARS:
                case QuestRewardTarget.ALL_CHARS:
                    this.applyCharReward(rewardObject);
                    break;

                case QuestRewardTarget.MAIN_QUEST:
                    this.applyMainQuestReward(rewardObject);
                    break

                case QuestRewardTarget.NEXT_X_QUESTS:
                    this.applyQuestsReward(rewardObject);
                    break
            }
        }
    }

    private applyCharReward(rewardObject: RewardObject) {
        const allChars = this._game?.chars;
        if (!allChars)
            return;

        // FIND TARGETS DEPENDING ON QUEST AND/OR RANDOM --------------------------------------------

        const questTypes: Array<CharType> = rewardObject.quest.requirements.map((req) => req.type);
        const questChars: Array<Char> = allChars.filter((char) => questTypes.includes(char.char.type));
        const nonQuestChars: Array<Char> = allChars.filter((char) => !questTypes.includes(char.char.type));

        const targetChars: Array<Char> = [];

        switch (rewardObject.reward.target) {
            // One random character
            case QuestRewardTarget.ONE_RANDOM_CHAR:
                targetChars.push(Random.getInstance().pick(allChars));
                break;

            // One random character who took part in the quest
            case QuestRewardTarget.ONE_RANDOM_QUEST_CHAR:
                targetChars.push(Random.getInstance().pick(questChars));
                break;

            // All characters who took part in the quest
            case QuestRewardTarget.ALL_QUEST_CHARS:
                for (const char of questChars)
                    targetChars.push(char);
                break;

            // One random character who did not take part in the quest
            case QuestRewardTarget.ONE_RANDOM_NON_QUEST_CHAR:
                targetChars.push(Random.getInstance().pick(nonQuestChars));
                break;

            // All characters who did not take part in the quest
            case QuestRewardTarget.ALL_NON_QUEST_CHARS:
                for (const char of nonQuestChars)
                    targetChars.push(char);
                break;

            // All characters
            case QuestRewardTarget.ALL_CHARS:
                for (const char of allChars)
                    targetChars.push(char);
                break;
        }

        // APPLY REWARD --------------------------------------------

        switch (rewardObject.reward.type) {
            // Add [X] dice to the character(s) pool for [Y] turns
            case QuestRewardType.EXTRA_X_DICE_FOR_Y_TURNS:
                // Validate args
                if (rewardObject.reward.args.length != 2)
                    break;
                // Add dice
                for (const char of targetChars)
                    char.addDice(rewardObject.reward.args[0]);
                // Init turns
                rewardObject.turnsRemaining = rewardObject.reward.args[1];
                // Setup end callback
                rewardObject.endCallback = () => {
                    // Remove dice
                    for (const char of targetChars)
                        char.removeDice(rewardObject.reward.args[0]);
                };
                break;

            // Freeze [X] of the character(s) dice each turn for [Y] turns
            case QuestRewardType.FREEZE_X_DICE_FOR_Y_TURNS:
                if (rewardObject.reward.args.length != 2)
                    break;
                break;
        }
    }

    private applyMainQuestReward(rewardObject: RewardObject) {
        const mainQuestCard = this._game?.mainQuestCard;
        if (!mainQuestCard)
            return;

        // APPLY REWARD --------------------------------------------

        switch (rewardObject.reward.type) {
            // Add [X] to the main quest multiplier for [Y] turns
            case QuestRewardType.X_MULT_FOR_Y_TURNS:
                // Validate args
                if (rewardObject.reward.args.length != 2)
                    break;
                // Add multiplier
                mainQuestCard.multiplier = rewardObject.reward.args[0];
                // Init turns
                rewardObject.turnsRemaining = rewardObject.reward.args[1];
                // Setup end callback
                rewardObject.endCallback = () => {
                    // Remove multiplier
                    mainQuestCard.multiplier = 1;
                };
                break;
        }
    }

    private applyQuestsReward(rewardObject: RewardObject) {

    }

    public getRewardText(reward: QuestReward) {
        let s = [];
        let a = -1;
        let v, w, v1, v2, v3, v4, v5;

        // Target
        switch (reward.target) {
            case QuestRewardTarget.ALL_CHARS:
                s.push(`All Comedians`);
                break;
            case QuestRewardTarget.ALL_NON_QUEST_CHARS:
                s.push(`All Comedians outside this Bit`);
                break;
            case QuestRewardTarget.ALL_QUEST_CHARS:
                s.push(`All Comedians from this Bit`);
                break;
            case QuestRewardTarget.MAIN_QUEST:
                s.push(`Quick Jokes`);
                break;
            case QuestRewardTarget.NEXT_X_QUESTS:
                v = reward.args[++a];
                if (v === 1)
                    s.push(`Next Bit:`);
                else
                    s.push(`Next ${v} Bits:`);
                break;
            case QuestRewardTarget.ONE_RANDOM_CHAR:
                s.push(`One random Comedian`);
                break;
            case QuestRewardTarget.ONE_RANDOM_NON_QUEST_CHAR:
                s.push(`One random Comedian outside this Bit`);
                break;
            case QuestRewardTarget.ONE_RANDOM_QUEST_CHAR:
                s.push(`One random Comedian from this Bit`);
                break;
        }

        switch (reward.type) {
            case QuestRewardType.DISCARD:
                s.push(``);
                break;
            case QuestRewardType.EXTRA_X_DICE_FOR_Y_TURNS:
                v1 = reward.args[++a];
                v2 = reward.args[++a];
                if (v2 === 1)
                    s.push(`get ${v1} extra Dice for the next Turn`);
                else
                    s.push(`get ${v1} extra Dice for the next ${v2} Turns`);
                break;
            case QuestRewardType.FREEZE_X_DICE_FOR_Y_TURNS:
                s.push(``);
                break;
            case QuestRewardType.HIDE:
                s.push(``);
                break;
            case QuestRewardType.HIDE_X_DICE_FOR_Y_TURNS:
                v1 = reward.args[++a];
                v2 = reward.args[++a];
                if (v2 === 1)
                    s.push(`get ${v1} hidden Dice for the next Turn`);
                else
                    s.push(`get ${v1} hidden Dice for the next ${v2} Turns`);
                s.push(``);
                break;
            case QuestRewardType.X_LESS_TURNS_TO_COMPLETE:
                w = v;
                v = reward.args[++a];
                if (v === 1)
                    s.push(`get ${v} less Turn to complete`);
                else
                    s.push(`get ${v} less Turns to complete`);
                break;
            case QuestRewardType.X_MORE_TURNS_TO_COMPLETE:
                w = v;
                v = reward.args[++a];
                if (v === 1)
                    s.push(`get ${v} more Turn to complete`);
                else
                    s.push(`get ${v} more Turns to complete`);
                break;
            case QuestRewardType.X_MULT_FOR_Y_TURNS:
                v1 = reward.args[++a];
                v2 = reward.args[++a];
                if (v2 === 1)
                    s.push(`get a x${v1} multiplier for ${v2} Turn`);
                else
                    s.push(`get a x${v1} multiplier for ${v2} Turns`);
                break;
        }

        let joined = s.join(" ");

        for (let i = 0; i < reward.args.length; i++) {
            const arg = reward.args[i];
            joined = joined.replace(`[${i}]`, arg.toFixed());
        }

        return joined;
    }
}

interface RewardObject {
    reward: QuestReward,
    quest: QuestStruct,
    turnsRemaining: number,
    endCallback?: () => void,
}