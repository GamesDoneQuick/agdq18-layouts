(function () {
	'use strict';

	const FADE_DURATION = 0.5;
	const FADE_EASE = Power1.easeInOut;
	const allBids = nodecg.Replicant('allBids');

	class GdqChocobo extends Polymer.Element {
		static get is() {
			return 'gdq-chocobo';
		}

		ready() {
			super.ready();
			this.tl = new TimelineLite({autoRemoveChildren: true});
			allBids.on('change', this.chocoboCheck.bind(this));
		}

		showChocobo() {
			this.tl.clear();
			this.tl.to(this, FADE_DURATION, {
				opacity: 1,
				ease: FADE_EASE
			});
		}

		hideChocobo() {
			this.tl.clear();
			this.tl.to(this, FADE_DURATION, {
				opacity: 0,
				ease: FADE_EASE
			});
		}

		chocoboCheck() {
			console.log('checking');
			allBids.value.forEach(bid => {
				if (bid.id === 4640) {
					if (bid.options[0].id === 4641) {
						this.showChocobo();
					} else {
						this.hideChocobo();
					}
				}
			});
		}
	}

	customElements.define(GdqChocobo.is, GdqChocobo);
})();
