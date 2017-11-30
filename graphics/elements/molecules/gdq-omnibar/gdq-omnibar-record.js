(function () {
	'use strict';

	const TIME_PER_DOLLAR = 0.03;
	const total = nodecg.Replicant('total');

	class GdqOmnibarRecord extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-record';
		}

		static get properties() {
			return {
				bid: {
					type: Object
				}
			};
		}

		ready() {
			super.ready();
			Polymer.RenderStatus.beforeNextRender(this, () => {
				this.$.total.rawValue = 0;
				total.on('change', this._handleTotalChanged.bind(this));
			});
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

		formatRawValue(rawValue) {
			return rawValue.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				minimumFractionDigits: 0,
				style: 'currency',
				currency: 'USD'
			}).replace(/1/ig, '\u00C0');
		}

		_handleTotalChanged(newVal) {
			const newRawValue = Math.max(window.AGDQ17_TOTAL - newVal.raw, 0);
			if (!this._totalInitialized) {
				this._totalInitialized = true;
				this.$.total.rawValue = newRawValue;
				this.$.total.text = this.formatRawValue(newRawValue);
				return;
			}

			const delta = this.$.total.rawValue - newRawValue;
			const duration = Math.min(delta * TIME_PER_DOLLAR, 3);
			TweenLite.to(this.$.total, duration, {
				rawValue: newRawValue,
				ease: Power2.easeOut,
				onUpdate() {
					this.$.total.text = this.formatRawValue(this.$.total.rawValue);
				},
				callbackScope: this
			});
		}
	}

	customElements.define(GdqOmnibarRecord.is, GdqOmnibarRecord);
})();
