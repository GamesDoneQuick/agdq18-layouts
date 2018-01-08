class DashHostBid extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'dash-host-bid';
	}

	static get properties() {
		return {
			type: {
				type: String,
				reflectToAttribute: true,
				computed: '_computeType(bid)'
			},
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
		return description.replace(/\\n/g, ' ');
	}

	_computeType(bid) {
		return bid ? bid.type : '';
	}
}

customElements.define(DashHostBid.is, DashHostBid);
