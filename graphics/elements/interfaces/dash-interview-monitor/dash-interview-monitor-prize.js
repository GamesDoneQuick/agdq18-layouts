(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');

	/**
	 * @customElement
	 * @polymer
	 */
	class DashInterviewMonitorPrize extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-interview-monitor-prize';
		}

		static get properties() {
			return {
				prize: Object,
				currentRun: Object,
				bidType: {
					type: String,
					reflectToAttribute: true,
					computed: '_computeBidType(prize)'
				},
				closed: {
					type: Boolean,
					reflectToAttribute: true,
					computed: '_computeClosed(prize, currentRun)'
				}
			};
		}

		ready() {
			super.ready();

			currentRun.on('change', newVal => {
				this.currentRun = newVal;
			});
		}

		_computeBidType(prize) {
			return prize.sumdonations ? 'total' : 'single';
		}

		_computeClosed(prize, currentRun) {
			if (!prize || !currentRun) {
				return false;
			}

			return prize.endrun.order < currentRun.order;
		}

		_calcBidTypeChar(bidType) {
			if (!bidType) {
				return '';
			}
			return bidType.charAt(0);
		}

		_calcOpening(prize, currentRun) {
			if (!prize || !currentRun) {
				return '?';
			}

			if (prize.startrun.order <= currentRun.order) {
				return 'OPEN';
			}

			return prize.startrun.name;
		}

		_calcClosing(prize, currentRun) {
			if (!prize || !currentRun) {
				return '?';
			}

			if (prize.endrun.order < currentRun.order) {
				return 'CLOSED';
			}

			return prize.endrun.name;
		}
	}

	customElements.define(DashInterviewMonitorPrize.is, DashInterviewMonitorPrize);
})();
