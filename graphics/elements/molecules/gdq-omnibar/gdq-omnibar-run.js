/**
 * @customElement
 * @polymer
 */
class GdqOmnibarRun extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-run';
	}

	static get properties() {
		return {
			run: Object
		};
	}

	enter() {
		return this.$.listItem.enter();
	}

	exit() {
		return this.$.listItem.exit();
	}

	formatName(name) {
		return name.replace('\\n', ' ').trim();
	}

	concatenateRunners(run) {
		if (run.pk === 2274) {
			// Pre-Show
			return 'SpikeVegeta, feasel, Golden, Protomagicalgirl & Hobz';
		}

		if (run.pk === 2233) {
			// Tetris: The Grand Master 8-Way 100% Race
			return 'aperturegrillz, Poochy.EXE, KevinDDR, EnchantressOfNumbers, JBroms, MxKai3, PARTY MAN X & eihoppe';
		}

		if (run.pk === 2255) {
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
