/**
 * @customElement
 * @polymer
 */
class GdqBreakBidChallenge extends Polymer.Element {
	static get is() {
		return 'gdq-break-bid-challenge';
	}

	static get properties() {
		return {};
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

		this.$.percent.ease = Power2.easeOut;
		this.$.percent.displayValueTransform = displayValue => {
			return displayValue.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				useGrouping: false
			}) + '%';
		};

		TweenLite.set(this, {opacity: 0});
		TweenLite.set(this.$.meter, {scaleX: 0});
		TweenLite.set(this.$['meter-line'], {scaleY: 0});
	}

	enter() {
		let meterPercent = this.bid.rawTotal / this.bid.rawGoal;
		meterPercent = Math.max(meterPercent, 0); // Clamp to min 0
		meterPercent = Math.min(meterPercent, 1); // Clamp to max 1
		if (Number.isNaN(meterPercent)) {
			meterPercent = 0;
		}

		const tl = new TimelineLite();
		const meterDuration = 0.75 * meterPercent;

		tl.set(this.$.left, {
			width: `${meterPercent * 100}%`
		});

		tl.call(() => {
			this.$.goal.textContent = '$' + this.bid.rawGoal.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				useGrouping: false
			});

			if (this.$.meter.clientWidth < this.$.amount.clientWidth) {
				TweenLite.set(this.$.amount, {
					right: '',
					left: '100%'
				});
			}
		}, null, null, '+=0.03');

		tl.add(MaybeRandom.createTween({
			target: this.style,
			propName: 'opacity',
			duration: 0.465,
			ease: Power4.easeIn,
			start: {probability: 1, normalValue: 0},
			end: {probability: 0, normalValue: 1}
		}));

		tl.to(this.$['meter-line'], 0.324, {
			scaleY: 1,
			ease: Power2.easeInOut
		});

		tl.to(this.$.meter, meterDuration, {
			scaleX: 1,
			ease: Power2.easeOut,
			callbackScope: this,
			onStart() {
				this.$.amount.tween(this.bid.rawTotal, meterDuration);
				this.$.percent.tween(Math.floor(meterPercent * 100), meterDuration);
			}
		});

		return tl;
	}

	exit() {
		const tl = new TimelineLite();

		tl.add(MaybeRandom.createTween({
			target: this.style,
			propName: 'opacity',
			duration: 0.2,
			ease: Power4.easeIn,
			start: {probability: 1, normalValue: 1},
			end: {probability: 0, normalValue: 0}
		}));

		return tl;
	}
}

customElements.define(GdqBreakBidChallenge.is, GdqBreakBidChallenge);
