(function () {
	/* Minimum amount of content overflow, in pixels, required before the scrolling behavior kicks in.
	 * We have this because if the content just scrolls a few pixels, it looks kinda bad.
	 * We've found it's better to just not scroll it at all in those cases, and let it
	 * cut off those few pixels. */
	const MIN_CONTENT_SCROLL_DISTANCE = 3;

	// How much time, in seconds, to spend scrolling on a single pixel.
	const CONTENT_SCROLL_TIME_PER_PIXEL = 0.002;

	// The opacity to set on list items which are partially occluded by the total.
	const OCCLUDED_OPACITY = 0.25;

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqOmnibarList extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-list';
		}

		static get properties() {
			return {
				/**
				 * How much space, in pixels, to put between items in the list.
				 */
				marginSize: {
					type: Number,
					observer: '_marginSizeChanged',
					value: 6
				}
			};
		}

		enter(displayDuration, scrollHoldDuration) {
			const listWidth = this.clientWidth;
			const contentWidth = this.$.content.clientWidth;
			const contentOverflowWidth = contentWidth - listWidth;
			const tl = new TimelineLite();
			const elements = this.getListItems();

			elements.forEach((element, index) => {
				tl.add(element.enter(), index * 0.1134);
			});

			if (contentOverflowWidth < MIN_CONTENT_SCROLL_DISTANCE) {
				tl.to({}, displayDuration, {});
			} else {
				// Display the content cards long enough for people to read.
				// Scroll the list of cards if necessary to show them all.
				const occludedElements = new Set();
				const observerMap = new Map();
				const observers = elements.map(element => {
					const observer = new IntersectionObserver(entries => {
						if (!entries || entries.length < 1) {
							return;
						}

						const entry = entries[0];
						const occluded = entry.intersectionRatio < 1;
						if (occluded) {
							occludedElements.add(element);
						} else {
							occludedElements.delete(element);
						}

						TweenLite.to(element, 0.224, {
							opacity: occluded ? OCCLUDED_OPACITY : 1,
							ease: Sine.easeInout
						});
					}, {
						root: this,
						rootMargin: '0px',
						threshold: [0, 1]
					});

					observer.observe(element);
					observerMap.set(element, observer);
					return observer;
				});

				// Figure out how many items we need to exit before all items are visible.
				let recoveredWidth = 0;
				const leadingElementsToExit = [];
				while (recoveredWidth < (contentOverflowWidth - MIN_CONTENT_SCROLL_DISTANCE)) {
					const leadingItem = elements[leadingElementsToExit.length];
					leadingElementsToExit.push(leadingItem);
					recoveredWidth += leadingItem.clientWidth;
				}

				leadingElementsToExit.forEach(leadingElement => {
					const trailingElements = elements.slice(elements.indexOf(leadingElement) + 1);
					tl.add(leadingElement.exit(), `+=${scrollHoldDuration}`);
					tl.to(trailingElements, leadingElement.clientWidth * CONTENT_SCROLL_TIME_PER_PIXEL, {
						x: -leadingElement.getBoundingClientRect().width - this.marginSize,
						ease: Power2.easeInOut
					});
					tl.call(() => {
						leadingElement.remove();
						observerMap.get(leadingElement).disconnect();
						TweenLite.set(trailingElements, {x: 0});
						occludedElements.delete(leadingElement);
					});
				});

				tl.call(() => {
					observers.forEach(observer => observer.disconnect());
				}, null, null, `+=${scrollHoldDuration}`);
			}

			return tl;
		}

		exit() {
			const tl = new TimelineLite();
			const elements = this.getListItems();
			elements.slice(0).reverse().forEach((element, index) => {
				tl.add(element.exit(), index * 0.3134);
			});

			return tl;
		}

		getListItems() {
			return Array.from(this.$.contentSlot.assignedNodes());
		}

		_marginSizeChanged(newVal) {
			this.updateStyles({
				'--gdq-omnibar-list-margin-size': `${newVal}px`
			});
		}
	}

	customElements.define(GdqOmnibarList.is, GdqOmnibarList);
})();
