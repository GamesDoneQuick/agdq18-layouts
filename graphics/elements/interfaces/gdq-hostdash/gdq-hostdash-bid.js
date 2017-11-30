class GdqHostDashboardBid extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-hostdash-bid';
	}

	static get properties() {
		return {
			bid: {
				type: Object
			},
			failed: {
				type: Boolean,
				computed: 'computeFailed(closed, bid)',
				reflectToAttribute: true
			},
			closed: {
				type: Boolean,
				computed: 'computeClosed(bid)',
				reflectToAttribute: true
			}
		};
	}

	computeFailed(closed, bid) {
		return closed && bid.rawTotal < bid.rawGoal;
	}

	computeClosed(bid) {
		return bid.state.toLowerCase() === 'closed';
	}

	bidIsChallenge(bid) {
		return bid.type === 'challenge';
	}

	limitOptions(options) {
		if (!options) {
			return [];
		}

		return options.slice(0, 3);
	}

	calcOptionMeterFillStyle(bid, option) {
		if (!option || !bid.options || bid.options.length <= 0) {
			return '';
		}

		let percent = option.rawTotal / bid.options[0].rawTotal;
		percent = Math.max(percent, 0); // Clamp to min 0
		percent = Math.min(percent, 1); // Clamp to max 1
		if (Number.isNaN(percent)) {
			percent = 0;
		}
		return `transform: scaleX(${percent});`;
	}

	bidHasMoreThanThreeOptions(bid) {
		if (!bid.options) {
			return false;
		}

		return bid.options.length > 3;
	}

	calcNumAdditionalOptions(bid) {
		if (!bid.options) {
			return 0;
		}

		return bid.options.length - 3;
	}

	calcBidName(description) {
		return description.replace('||', ' -- ');
	}
}

customElements.define(GdqHostDashboardBid.is, GdqHostDashboardBid);
