(function () {
	'use strict';

	const recordTrackerEnabled = nodecg.Replicant('recordTrackerEnabled');
	const total = nodecg.Replicant('total');

	class GdqOmnibarMilestoneAlert extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-milestone-alert';
		}

		static get properties() {
			return {
				milestones: Array,
				currentMilestone: {
					type: Object,
					readOnly: true
				},
				_initialized: {
					type: Boolean,
					value: false
				}
			};
		}

		ready() {
			super.ready();

			total.on('change', (newVal, oldVal) => {
				if (!this._initialized) {
					const highestSurpassedMilestone = this.milestones.find(milestone => {
						return newVal.raw >= milestone.total;
					});

					this._setCurrentMilestone(highestSurpassedMilestone);
					this._initialized = true;
					return;
				}

				if (oldVal &&
					this.currentMilestone &&
					newVal.raw >= this.currentMilestone.total &&
					oldVal.raw < this.currentMilestone.total) {
					this.alertMilestonePassed(this.currentMilestone);

					const nextMilestone = this.milestones.find(milestone => {
						return newVal.raw < milestone.total;
					});

					this._setCurrentMilestone(nextMilestone);
				}
			});
		}

		alertMilestonePassed() {
			const tl = new TimelineLite();

			// If we have manually disabled this feature, return.
			if (!recordTrackerEnabled.value) {
				return tl;
			}
		}
	}

	customElements.define(GdqOmnibarMilestoneAlert.is, GdqOmnibarMilestoneAlert);
})();
