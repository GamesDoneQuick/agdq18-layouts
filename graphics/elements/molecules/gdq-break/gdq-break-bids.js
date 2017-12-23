/* global GdqBreakLoop */
(function () {
	'use strict';

	const EMPTY_OBJ = {};
	const DISPLAY_DURATION = nodecg.bundleConfig.displayDuration;

	const currentBids = nodecg.Replicant('currentBids');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakBids extends GdqBreakLoop {
		static get is() {
			return 'gdq-break-bids';
		}

		static get properties() {
			return {
				currentBid: Object,
				noAutoLoop: {
					type: Boolean,
					value: false
				}
			};
		}

		ready() {
			super.ready();
			this.maxNoMoreItemsRetries = 30;
			currentBids.on('change', newVal => {
				this.availableItems = newVal;
			});
		}

		_showItem(bid) {
			let elementTagName;
			if (bid.type === 'choice-many') {
				elementTagName = 'gdq-break-bid-many';
			} else if (bid.type === 'choice-binary') {
				elementTagName = 'gdq-break-bid-binary';
			} else if (bid.type === 'challenge') {
				elementTagName = 'gdq-break-bid-challenge';
			} else {
				nodecg.log.error('Got bid of unexpected type (%s):', bid.type, JSON.stringify(bid, null, 2));
			}

			const tl = new TimelineLite();
			if (!elementTagName) {
				return tl;
			}

			const element = document.createElement(elementTagName);
			element.bid = bid;

			this.$.content.appendChild(element);
			if (this.$.content.selectedItem) {
				const currentlyDisplayingElement = this.$.content.selectedItem;
				tl.add(currentlyDisplayingElement.exit());
				tl.call(() => {
					currentlyDisplayingElement.remove();
				});
			}

			tl.call(() => {
				this.$.content.selectIndex(this.$.content.indexOf(element));
				this.$['description-actual'].innerHTML = bid.description.replace(/\\n/g, '</br>');
				TypeAnims.type(this.$['description-actual']);
			}, null, null, '+=0.1');

			tl.add(element.enter());

			// Give the bid some time to show.
			tl.to(EMPTY_OBJ, DISPLAY_DURATION, EMPTY_OBJ);

			return tl;
		}
	}

	customElements.define(GdqBreakBids.is, GdqBreakBids);
})();
