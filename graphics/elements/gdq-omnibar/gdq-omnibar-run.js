class GdqOmnibarRun extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-run';
	}

	static get properties() {
		return {
			run: {
				type: Object
			}
		};
	}

	enter() {
		const enterTL = new TimelineLite();
		enterTL.set(this.$.text, {y: '100%'});
		enterTL.add(this.$.background.enter('below'));
		enterTL.to(this.$.text, 0.334, {
			y: '0%',
			ease: Power1.easeInOut
		}, 0.2);
		return enterTL;
	}

	exit() {
		const exitTL = new TimelineLite();
		exitTL.add(this.$.background.exit('above'));
		exitTL.to(this.$.text, 0.334, {
			y: '-100%',
			ease: Power1.easeInOut
		}, 0.2);
		return exitTL;
	}

	formatName(name) {
		return name.replace('\\n', ' ').trim();
	}

	concatenateRunners(run) {
		if (run.pk === 2274) {
			// Pre-Show
			return 'SpikeVegeta, feasel, Golden, Protomagicalgirl & Hobz';
		} else if (run.pk === 2233) {
			// Tetris: The Grand Master 8-Way 100% Race
			return 'aperturegrillz, Poochy.EXE, KevinDDR, EnchantressOfNumbers, JBroms, MxKai3, PARTY MAN X & eihoppe';
		} else if (run.pk === 2255) {
			// Super Mario Series Warpless Relay Race Warpless
			return 'Just_defend, bjw, Svenne, darbian, Dotsarecool, xsvArea51, truman, LackAttack24, grandpoobear, Kosmicd12, MrCab, Kirua, SuperSonic71087, Aweglib & RaikouRider';
		}

		let concatenatedRunners = run.runners[0].name;
		if (run.runners.length > 1) {
			concatenatedRunners = run.runners.slice(1).reduce((prev, curr, index, array) => {
				if (index === array.length - 1) {
					return `${prev} & ${curr.name}`;
				}

				return `${prev}, ${curr.name}`;
			}, concatenatedRunners);
		}
		return concatenatedRunners;
	}
}

customElements.define(GdqOmnibarRun.is, GdqOmnibarRun);
