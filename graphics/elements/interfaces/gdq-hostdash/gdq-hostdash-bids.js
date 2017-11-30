(function () {
	const allBids = nodecg.Replicant('allBids');
	const currentRun = nodecg.Replicant('currentRun');
	const runOrderMap = nodecg.Replicant('runOrderMap');

	class GdqHostdashBids extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-hostdash-bids';
		}

		static get properties() {
			return {
				relevantBids: {
					type: Array
				},
				bidFilterString: {
					type: String,
					notify: true
				}
			};
		}

		ready() {
			super.ready();
			allBids.on('change', () => {
				this.recalcRelevantBids();
			});

			currentRun.on('change', () => {
				this.recalcRelevantBids();
			});

			runOrderMap.on('change', () => {
				this.recalcRelevantBids();
			});

			nodecg.listenFor('bids:updating', () => {
				this.$.cooldown.indeterminate = true;
			});

			nodecg.listenFor('bids:updated', () => {
				this.$.cooldown.indeterminate = false;
				this.$.cooldown.classList.remove('transiting');
				this.$.cooldown.value = 100;

				Polymer.RenderStatus.afterNextRender(this, () => {
					this.$.cooldown.classList.add('transiting');
					this.$.cooldown.value = 0;
				});
			});
		}

		computeBidsFilter(string) {
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

		recalcRelevantBids() {
			if (allBids.status !== 'declared' ||
				currentRun.status !== 'declared' ||
				runOrderMap.status !== 'declared' ||
				!allBids.value ||
				!runOrderMap.value ||
				!currentRun.value) {
				return;
			}

			this.relevantBids = allBids.value.filter(bid => {
				return runOrderMap.value[bid.speedrun] >= currentRun.value.order;
			}).sort((a, b) => {
				return runOrderMap.value[a.speedrun] - runOrderMap.value[b.speedrun];
			});
		}
	}

	customElements.define(GdqHostdashBids.is, GdqHostdashBids);
})();
