(function () {
	'use strict';

	const SLIDE_HOLD_DURATION = 4;
	const recordTrackerEnabled = nodecg.Replicant('recordTrackerEnabled');
	const total = nodecg.Replicant('total');

	class GdqOmnibarMilestoneAlert extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-milestone-alert';
		}

		static get properties() {
			return {
				milestones: Array,
				displayingMilestone: {
					type: Object
				},
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					}
				},
				_initialized: {
					type: Boolean,
					value: false
				}
			};
		}

		ready() {
			super.ready();

			let lastRaw;
			total.on('change', newVal => {
				if (!newVal || typeof newVal.raw !== 'number') {
					return;
				}

				if (!this._initialized) {
					lastRaw = newVal.raw;
					this._initialized = true;
					return;
				}

				// If we have manually disabled this feature, return.
				if (!recordTrackerEnabled.value) {
					return;
				}

				const highestPassedMilestone = this.milestones
					.slice(0)
					.reverse()
					.find(milestone => {
						return newVal.raw >= milestone.total;
					});

				if (!highestPassedMilestone) {
					return;
				}

				if (lastRaw &&
					newVal.raw >= highestPassedMilestone.total &&
					lastRaw < highestPassedMilestone.total) {
					const alertAnim = this.alertMilestonePassed(highestPassedMilestone);
					this.tl.add(alertAnim, '+=0.1');
				}

				lastRaw = newVal.raw;
			});
		}

		alertMilestonePassed(milestone) {
			const tl = new TimelineLite();

			tl.call(() => {
				this.displayingMilestone = milestone;
			}, null, null, '+=0.1');

			tl.to(this.$.layer1, 0.5, {
				clipPath: 'inset(0 0% 0 0%)',
				ease: Power3.easeInOut
			});

			tl.to(this.$.layer2, 0.5, {
				clipPath: 'inset(0 0% 0 0%)',
				ease: Power3.easeInOut
			}, `+=${SLIDE_HOLD_DURATION}`);

			tl.to(this.$.layer3, 0.5, {
				clipPath: 'inset(0 0% 0 0%)',
				ease: Power3.easeInOut
			}, `+=${SLIDE_HOLD_DURATION}`);

			tl.set([this.$.layer1, this.$.layer2], {opacity: 0});
			tl.set(this.$.layer3, {
				// Prevent GSAP from using shorthand, which would break the next anim.
				clipPath: 'inset(0.01px 0.01% 0.02px 0%)'
			});

			tl.to(this.$.layer3, 0.5, {
				clipPath: 'inset(0px 0% 0px 100%)',
				ease: Power3.easeInOut
			}, `+=${SLIDE_HOLD_DURATION}`);

			tl.set([
				this.$.layer1,
				this.$.layer2,
				this.$.layer3
			], {
				clearProps: 'all'
			});

			return tl;
		}

		_formatTotal(amount) {
			return '$' + amount.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				minimumFractionDigits: 0
			});
		}

		_calcLayer3Message(succeedingMilestone) {
			if (succeedingMilestone) {
				return `NEXT MILESTONE:&nbsp;<b>${succeedingMilestone.name} - ${this._formatTotal(succeedingMilestone.total)}</b>`;
			}

			return '<b>NEW GAMES DONE QUICK PB!</b>';
		}
	}

	customElements.define(GdqOmnibarMilestoneAlert.is, GdqOmnibarMilestoneAlert);
})();
