/**
 * @customElement
 * @polymer
 */
class GdqBreakBidManyOption extends Polymer.Element {
	static get is() {
		return 'gdq-break-bid-many-option';
	}

	static get properties() {
		return {
			bid: Object,
			option: Object
		};
	}

	ready() {
		super.ready();
		this.$.amount.ease = Power2.easeOut;
		this.$.amount.displayValueTransform = displayValue => {
			return '$' + displayValue.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				useGrouping: false
			});
		};
	}

	enter() {
		let meterPercent = this.option.rawTotal / this.bid.options[0].rawTotal;
		meterPercent = Math.max(meterPercent, 0); // Clamp to min 0
		meterPercent = Math.min(meterPercent, 1); // Clamp to max 1
		if (Number.isNaN(meterPercent)) {
			meterPercent = 0;
		}

		const tl = new TimelineLite();
		const duration = 0.75 * meterPercent;

		tl.fromTo(this.$.meter, duration, {
			scaleX: 0
		}, {
			scaleX: meterPercent,
			ease: Power2.easeOut,
			callbackScope: this,
			onStart() {
				this.$.amount.tween(this.option.rawTotal, duration);
			}
		});

		return tl;
	}

	_calcOptionName(option) {
		if (!option) {
			return '';
		}

		return option.name || option.description;
	}
}

customElements.define(GdqBreakBidManyOption.is, GdqBreakBidManyOption);
