/**
 * @customElement
 * @polymer
 *
 * A base class for iterating through an array of items and playing an animation for each one in series.
 * This element is not useful on its own, it needs to be extended by some other element which implements
 * a _showItem method.
 */
class GdqBreakLoop extends Polymer.Element { // eslint-disable-line no-unused-vars
	static get properties() {
		return {
			availableItems: Array,
			currentItem: Object,
			noAutoLoop: {
				type: Boolean,
				value: false
			},
			maxNoMoreItemsRetries: {
				type: Number,
				value: Infinity
			},
			itemIdField: {
				type: String,
				value: 'id'
			},
			_noMoreItemsRetries: {
				type: Number,
				value: 0
			}
		};
	}

	ready() {
		super.ready();
		if (!this.noAutoLoop) {
			this._loop();
		}
	}

	_loop() {
		// If there's no prizes, do nothing and try again in one second.
		if (!this.availableItems || this.availableItems.length <= 0) {
			clearTimeout(this._loopRetryTimeout);
			this._loopRetryTimeout = setTimeout(() => {
				this._loop();
			}, 1000);
			return;
		}

		const availableItems = this.availableItems;

		let nextIdx = 0;
		if (this.currentItem && this.currentItem[this.itemIdField]) {
			// Figure out the array index of the current item.
			let currentIdx = -1;
			availableItems.some((item, index) => {
				if (item[this.itemIdField] === this.currentItem[this.itemIdField]) {
					currentIdx = index;
					return true;
				}

				return false;
			});

			nextIdx = currentIdx + 1;
		}

		// If this index is greater than the max, loop back to the start.
		if (nextIdx >= availableItems.length) {
			nextIdx = 0;
		}

		const nextItem = availableItems[nextIdx];

		// If the next item is the same as the current item, do nothing and try again in one second.
		if (this.currentItem && nextItem[this.itemIdField] === this.currentItem[this.itemIdField]) {
			if (this._noMoreItemsRetries < this.maxNoMoreItemsRetries) {
				this._noMoreItemsRetries++;
				clearTimeout(this._loopRetryTimeout);
				this._loopRetryTimeout = setTimeout(() => {
					this._loop();
				}, 1000);
				return;
			}
		}

		// Kill any existing loop, if one was somehow running.
		// This also resets our internal state, used to make things like the enter/exit anims more seamless.
		this._killLoop();

		// Show the next item.
		this.currentItem = nextItem;
		const tl = this._showItem(nextItem);
		tl.call(() => {
			this._loop();
		});

		this._currentLoopIterationTimeline = tl;
	}

	_killLoop() {
		if (this._currentLoopIterationTimeline) {
			this._currentLoopIterationTimeline.clear();
			this._currentLoopIterationTimeline.kill();
			this._currentLoopIterationTimeline = null;
		}

		clearTimeout(this._loopRetryTimeout);

		this._noMoreItemsRetries = 0;

		if (this._resetState) {
			this._resetState();
		}
	}
}
