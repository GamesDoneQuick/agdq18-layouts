class GdqOmnibarBid extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-bid';
	}

	static get properties() {
		return {
			bid: {
				type: Object
			}
		};
	}

	enter() {
		const enterTL = new TimelineLite({
			onStart() {
				if (this.bid.isBitsChallenge) {
					this.$.background.startColor = '#7e31b2';
					this.$.background.endColor = '#4a196b';
					this.$.totalAndDelta.style.justifyContent = 'flex-start';
					this.$.bitsIcon.removeAttribute('hidden');
					this.$.total.text = `${this.bid.total} / ${this.bid.goal}`.replace(/\$/ig, '');
					this.$.total.startColor = '#e4ffff';
					this.$.total.endColor = '#94d9d0';
				}
			},
			callbackScope: this
		});
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
