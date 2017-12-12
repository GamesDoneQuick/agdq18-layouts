/**
 * @customElement
 * @polymer
 */
class GdqOmnibarBid extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-bid';
	}

	static get properties() {
		return {
			bid: Object,
			delta: String
		};
	}

	enter() {
		return this.$.listItem.enter();
	}

	exit() {
		return this.$.listItem.exit();
	}

	formatDescription(bid) {
		if (bid && !(bid.description || bid.name)) {
			nodecg.log.error('Got weird bid:', JSON.stringify(bid, null, 2));
			return 'Be the first to bid!';
		}

		return bid ?
			(bid.description || bid.name).replace('||', ' -- ') :
			'Be the first to bid!';
	}

	formatTotal(bid) {
		switch (bid.type) {
			case 'challenge':
				return `${bid.total} / ${bid.goal}`;
			default:
				return bid.total;
		}
	}
}

customElements.define(GdqOmnibarBid.is, GdqOmnibarBid);
