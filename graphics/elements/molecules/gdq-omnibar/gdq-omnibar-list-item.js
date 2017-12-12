/* global MaybeRandom */
/**
 * @customElement
 * @polymer
 */
class GdqOmnibarListItem extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-list-item';
	}

	static get properties() {
		return {
			firstLine: String,
			secondLine: String
		};
	}

	ready() {
		super.ready();
		this._$borderBodies = this.shadowRoot.querySelectorAll('.border-body');
		this._$leftBorderCaps = this.shadowRoot.querySelectorAll('.border-cap:first-child');
		this._$rightBorderCaps = this.shadowRoot.querySelectorAll('.border-cap:last-child');
	}

	enter() {
		const enterTL = new TimelineLite();

		enterTL.fromTo(this, 0.234, {
			x: 20,
			opacity: 0
		}, {
			x: 0,
			opacity: 1,
			ease: Sine.easeOut
		});

		return enterTL;
	}

	exit() {
		const exitTL = new TimelineLite();

		exitTL.to(this._$borderBodies, 0.465, {
			scaleX: 0,
			ease: Sine.easeInOut
		}, 0);

		exitTL.to(this._$rightBorderCaps, 0.465, {
			x: -this.clientWidth + 2,
			ease: Sine.easeInOut
		}, 0);

		exitTL.add(MaybeRandom.createTween({
			target: this.$.text.style,
			propName: 'opacity',
			duration: 0.465,
			start: {probability: 1, normalValue: 0},
			end: {probability: 0, normalValue: 0}
		}), 0);

		exitTL.to([this._$leftBorderCaps, this._$rightBorderCaps], 0.165, {
			scaleX: 0,
			ease: Sine.easeInOut
		});

		return exitTL;
	}
}

customElements.define(GdqOmnibarListItem.is, GdqOmnibarListItem);
