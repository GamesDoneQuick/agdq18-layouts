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
			run: Object,
			first: {
				type: Boolean,
				reflectToAttribute: true
			}
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
		if (run.pk === 2640) {
			// Pre-Show
			return 'SpikeVegeta, feasel, Blechy, Protomagicalgirl & JHobz';
		}

		if (run.pk === 2779) {
			// Mega Man 1 - 3 Team Relay Race Any%
			return '12 Runners';
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
