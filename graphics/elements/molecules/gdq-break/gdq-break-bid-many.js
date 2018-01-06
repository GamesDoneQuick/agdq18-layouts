/**
 * @customElement
 * @polymer
 */
class GdqBreakBidMany extends Polymer.Element {
	static get is() {
		return 'gdq-break-bid-many';
	}

	static get properties() {
		return {
			bid: Object
		};
	}

	enter() {
		this.$.optionRepeat.render();

		const tl = new TimelineLite();
		const optionElements = Array.from(this.shadowRoot.querySelectorAll('gdq-break-bid-many-option'));

		tl.addLabel('flickerOptions');
		optionElements.forEach((optionElement, index) => {
			optionElement.style.opacity = 0;
			tl.add(MaybeRandom.createTween({
				target: optionElement.style,
				propName: 'opacity',
				duration: 0.465,
				ease: Power4.easeIn,
				start: {probability: 1, normalValue: 0},
				end: {probability: 0, normalValue: 1}
			}), `flickerOptions+=${index * 0.1}`);
		});

		tl.addLabel('enterOptions');
		optionElements.forEach((optionElement, index) => {
			tl.add(optionElement.enter(), `enterOptions+=${index * 0.1}`);
		});

		return tl;
	}

	exit() {
		const tl = new TimelineLite();

		const optionElements = Array.from(this.shadowRoot.querySelectorAll('gdq-break-bid-many-option'));

		tl.addLabel('flickerOptions');
		optionElements.slice(0).reverse().forEach((optionElement, index) => {
			tl.add(MaybeRandom.createTween({
				target: optionElement.style,
				propName: 'opacity',
				duration: 0.2,
				ease: Power4.easeIn,
				start: {probability: 1, normalValue: 1},
				end: {probability: 0, normalValue: 0}
			}), `flickerOptions+=${index * 0.1}`);
		});

		return tl;
	}

	_calcOptions(bid) {
		if (!bid) {
			return [];
		}

		return bid.options.slice(0, 5);
	}
}

customElements.define(GdqBreakBidMany.is, GdqBreakBidMany);
