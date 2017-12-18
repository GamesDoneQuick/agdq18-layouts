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
				bidWars: Array
			};
		}

		enter(displayDuration, scrollHoldDuration) {
			const tl = new TimelineLite();

			this.bidWars.forEach((bidWar, index) => {
				// Show at most MAX_OPTIONS options.
				const bidElements = bidWar.options.slice(0, MAX_OPTIONS).map((option, index) => {
					const element = document.createElement('gdq-omnibar-bidwar-option');
					element.bid = option;
					element.winning = index === 0;
					return element;
				});

				if (bidElements.length <= 0) {
					const placeholder = document.createElement('gdq-omnibar-bidwar-option');
					placeholder.bid = {};
					placeholder.placeholder = true;
					bidElements.push(placeholder);
				}

				const listElement = document.createElement('gdq-omnibar-list');
				listElement.classList.add('list');
				listElement.marginSize = -8;
				bidElements.forEach(element => {
					listElement.appendChild(element);
				});
				this.$.lists.appendChild(listElement);

				Polymer.flush();
				bidElements.slice(0).reverse().forEach((element, index) => {
					element.render();
					element.style.zIndex = index; // First item has highest z-index, last item has lowest.
				});

				tl.call(() => {
					this.$.lists.select(index);
				});

				if (index === 0) {
					tl.add(this.$.label.enter(bidWar.description));
				} else {
					tl.add(this.$.label.change(bidWar.description));
				}

				tl.call(() => {
					tl.pause();
					const fooTl = listElement.enter(displayDuration, scrollHoldDuration);
					fooTl.call(tl.resume, null, tl);
				});
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
