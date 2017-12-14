(function () {
	const MAX_OPTIONS = 4;

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqOmnibarBidwars extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-bidwars';
		}

		static get properties() {
			return {
				bidWars: Object
			};
		}

		enter(displayDuration, scrollHoldDuration) {
			const tl = new TimelineLite();

			this.bidWars.forEach((bidWar, index) => {
				// Show at most MAX_OPTIONS options.
				const bidElements = bidWar.options.slice(0, MAX_OPTIONS).map(option => {
					const element = document.createElement('gdq-omnibar-bid');
					element.bid = option;
					return element;
				});

				if (bidElements.length <= 0) {
					const placeholder = document.createElement('gdq-omnibar-bid');
					placeholder.bid = {};
					bidElements.push(placeholder);
				}

				const listElement = document.createElement('gdq-omnibar-list');
				bidElements.forEach(element => {
					listElement.appendChild(element);
				});
				this.$.lists.appendChild(listElement);

				tl.call(() => {
					this.$.lists.select(index);
				});

				if (index === 0) {
					tl.add(this.$.label.enter(bidWar.description.replace('||', ': ')));
				} else {
					tl.add(this.$.label.change(bidWar.description.replace('||', ': ')));
				}

				tl.add(listElement.enter(displayDuration, scrollHoldDuration));
				tl.add(listElement.exit());
			});

			return tl;
		}

		exit() {
			const tl = new TimelineLite();
			tl.add(this.$.label.exit());
			return tl;
		}
	}

	customElements.define(GdqOmnibarBidwars.is, GdqOmnibarBidwars);
})();
