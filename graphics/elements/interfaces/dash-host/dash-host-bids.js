(function () {
	const allBids = nodecg.Replicant('allBids');
	const currentRun = nodecg.Replicant('currentRun');
	const runOrderMap = nodecg.Replicant('runOrderMap');

	class DashHostBids extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'dash-host-bids';
		}

		static get properties() {
			return {
				relevantBids: {
					type: Array
				},
				bidFilterString: {
					type: String,
					notify: true
				},
				dialogBid: Object
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
				this.$.cooldown.startCountdown(60);
			});
		}

		closeDialog() {
			this.$.dialog.close();
		}

		computeBidsFilter(string) {
			if (string) {
				// Return a filter function for the current search string.
				const regexp = new RegExp(escapeRegExp(string), 'ig');
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
				if (bid.speedrun in runOrderMap.value) {
					return runOrderMap.value[bid.speedrun] >= currentRun.value.order;
				}

				return true;
			}).sort((a, b) => {
				return runOrderMap.value[a.speedrun] - runOrderMap.value[b.speedrun];
			});
		}

		calcBidName(description) {
			return description.replace('||', ' -- ');
		}

		_handleBidTap(e) {
			if (e.target.bid.type !== 'choice-many') {
				return;
			}

			this.dialogBid = e.target.bid;
			this.$.dialog.open();
		}
	}

	function escapeRegExp(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	customElements.define(DashHostBids.is, DashHostBids);
})();
