export class Random {
	private static instance: Random;

	private rnd: Phaser.Math.RandomDataGenerator;
	private unseeded: Phaser.Math.RandomDataGenerator;

	constructor() {
		this.rnd = new Phaser.Math.RandomDataGenerator();
		this.unseeded = new Phaser.Math.RandomDataGenerator();
	}

	public static getInstance(): Random {
		if (!Random.instance)
			Random.instance = new Random();

		return Random.instance;
	}

	public setSeed(seed: string) {
		this.rnd.init([seed]);
	}

	public sign(unseeded: boolean = false) {
		return unseeded ? this.unseeded.sign() : this.rnd.sign();
	}

	public frac(unseeded: boolean = false) {
		return unseeded ? this.unseeded.frac() : this.rnd.frac();
	}

	public floatInRange(min: number, max: number, unseeded: boolean = false) {
		return unseeded ? this.unseeded.realInRange(min, max) : this.rnd.realInRange(min, max);
	}

	public integerInRange(min: number, max: number, unseeded: boolean = false) {
		return unseeded ? this.unseeded.integerInRange(min, max) : this.rnd.integerInRange(min, max);
	}

	public rotation(unseeded: boolean = false) {
		return unseeded ? this.unseeded.rotation() : this.rnd.rotation();
	}

	public uuid(unseeded: boolean = false) {
		return unseeded ? this.unseeded.uuid() : this.rnd.uuid();
	}

	public pick<T>(a: Array<T>, unseeded: boolean = false): T {
		return unseeded ? this.unseeded.pick(a) : this.rnd.pick(a);
	}

	public shuffle<T>(a: Array<T>, unseeded: boolean = false) {
		return unseeded ? this.unseeded.shuffle(a) : this.rnd.shuffle(a);
	}
}