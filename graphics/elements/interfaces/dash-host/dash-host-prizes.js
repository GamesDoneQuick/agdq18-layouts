(function () {
	const currentPrizes = nodecg.Replicant('currentPrizes');

	class DashHostPrizes extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-host-prizes';
		}

		static get properties() {
			return {
				prizes: {
					type: Array
				},
				prizeFilterString: {
					type: String,
					notify: true
				}
			};
		}

		ready() {
			super.ready();
			currentPrizes.on('change', newVal => {
				this.prizes = newVal;
			});

			nodecg.listenFor('prizes:updating', () => {
				this.$.cooldown.indeterminate = true;
			});

			nodecg.listenFor('prizes:updated', () => {
				this.$.cooldown.startCountdown(60);
			});
		}

		computePrizesFilter(string) {
			if (string) {
				// Return a filter function for the current search string.
				const regexp = new RegExp(string, 'ig');
				return function (bid) {
					return regexp.test(bid.description);
				};
			}

			// Set filter to null to disable filtering.
			return null;
		}
	}

	customElements.define(DashHostPrizes.is, DashHostPrizes);
})();
