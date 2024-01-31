import { EventManager, Events } from "../managers/Events";
import { Random } from "../managers/Random";
import { CharType } from "./CharStruct";
import { QuestRequirement, QuestRequirementMode } from "./QuestRequirement";
import { QuestReward } from "./QuestReward";

export class QuestStruct {
    readonly uuid: string;
    readonly name: string;

    public isPrimed: boolean = false;

    protected _requirements: Array<QuestRequirement> = [];
    protected _turnsRemaining: number = 2;
    protected _rewardsForFail: Array<QuestReward> = [];
    protected _rewardsForSuccess: Array<QuestReward> = [];
    protected _boundOnEndTurn: (() => void) | undefined;

    public get requirements() { return this._requirements; }
    public get turnsRemaining() { return this._turnsRemaining; }
    public get rewardsForFail() { return this._rewardsForFail; }
    public get rewardsForSuccess() { return this._rewardsForSuccess; }

    constructor(name: string) {
        this.uuid = Random.getInstance().uuid();
        this.name = name;
        this.isPrimed = false;
    }

    addRequirement(req: QuestRequirement) {
        this._requirements.push(req);
        return this;
    }

    setTurnsRemaining(turns: number) {
        this._turnsRemaining = turns;
        return this;
    }

    addRewardForFail(reward: QuestReward) {
        this._rewardsForFail.push(reward);
        return this;
    }

    addRewardForSuccess(reward: QuestReward) {
        this._rewardsForSuccess.push(reward);
        return this;
    }

    clone() {
        const q = new QuestStruct(this.name)
            // Copy turns
            .setTurnsRemaining(this.turnsRemaining);

        // Copy requirements
        for (let i = 0; i < this._requirements.length; i++)
            q.addRequirement(this._requirements[i].clone());

        // Copy rewards for fail
        for (const reward of this.rewardsForFail)
            q.addRewardForFail(reward.clone());

        // Copy rewards for success
        for (const reward of this.rewardsForSuccess)
            q.addRewardForSuccess(reward.clone());

        return q;
    }

    setupDynamicRequirements() {
        // Setup dynamic requirements
        const randomTypeReqs = [];
        for (const req of this._requirements) {
            // Store all requirements that need a random CharType
            if (req.type === CharType.RANDOM)
                randomTypeReqs.push(req);

            // Pick a random value for requirements that apply
            if ((req.mode === QuestRequirementMode.EXACT || req.mode === QuestRequirementMode.EXCEPT) && req.value === -1)
                req.value = Random.getInstance().integerInRange(1, 6);
        }
        // Pick a different random CharType for each requirement
        if (randomTypeReqs.length > 0)
            this.pickRandomTypes(randomTypeReqs);
    }

    activate(primed: boolean = false) {
        // Prime if necessary
        this.isPrimed = primed;

        // Listen to END_TURN event
        this._boundOnEndTurn = this.onEndTurn.bind(this)
        EventManager.on(Events.END_TURN, this._boundOnEndTurn);
    }

    onEndTurn() {
        if (this.isPrimed)
            this._turnsRemaining--;
        else
            this.isPrimed = true;

        if (this.turnsRemaining <= 0)
            EventManager.emit(Events.QUEST_FAILED, this.uuid);
    }

    pickRandomTypes(reqs: Array<QuestRequirement>) {
        let a: Array<CharType> = [];
        for (const req of reqs) {
            // If empty, fill the array with all the available types and shuffle it
            if (a.length <= 0) {
                a = [CharType.BARD, CharType.POET, CharType.MIMO];
                Random.getInstance().shuffle(a);
            }
            // @ts-ignore - Pick one type and assign to req
            req.type = a.pop();
        }
    }

    isOwnRequirement(uuid: string): boolean {
        for (const req of this._requirements) {
            if (req.uuid === uuid)
                return true;
        }
        return false;
    }

    isDone() {
        // Return false if one of the requirements is not done
        for (const req of this._requirements) {
            if (!req.done)
                return false;
        }
        // Else return true
        return true;
    }

    destroy() {
        EventManager.off(Events.END_TURN, this._boundOnEndTurn);
    }
}