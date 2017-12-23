/**
 * @customElement
 * @polymer
 */
class AtomTweeningNumber extends Polymer.Element {
	static get is() {
		return 'atom-tweening-number';
	}

	static get properties() {
		return {
			/**
			 * The value you wish to tween to.
			 */
			value: {
				type: Number,
				observer: '_valueChanged'
			},

			/**
			 * An optional function which takes in the currently displaying value
			 * and transforms it in some way. By default, it converts _displayValue
			 * to USD with no cents (whole integer dollar amounts only).
			 */
			displayValueTransform: {
				type: Function,
				value() {
					// By default, displayValueTransform converts displayValue to a display with no fraction.
					return displayValue => {
						return displayValue.toLocaleString('en-US', {
							maximumFractionDigits: 0
						});
					};
				}
			},

			/**
			 *
			 */
			intervalLength: {
				type: Number,
				value: 1
			},

			/**
			 * How much time to add to the duration of the tween for
			 * each "interval" in the value. (Default interval length is 1).
			 */
			timePerValueInterval: {
				type: Number,
				value: 0.03
			},

			/**
			 * The maximum duration, in seconds, that a single value tween can be.
			 */
			maxDuration: {
				type: Number,
				value: 3
			},

			/**
			 * The ease to use when tweening between the old value and the new value.
			 */
			ease: {
				type: Function,
				value: Power2.easeOut
			},

			/**
			 * If true, doesn't tween the first time value is set.
			 */
			skipInitial: {
				type: Boolean,
				value: true
			},

			/**
			 * The value displaying right now, this is what actually gets tweened.
			 * @private
			 */
			_displayValue: {
				type: Number,
				value: 0
			},

			/**
			 * Whether or not we have done the first-time setup of the value, which simply sets
			 * it with no tween.
			 * @private
			 */
			_initialized: {
				type: Boolean,
				value: false
			}
		};
	}

	/**
	 * Computes how long the tween will be for a given value delta.
	 * @param {Number} deltaValue - The delta to compute a tween duration for.
	 * @returns {Number} - The computed tween duration, in seconds.
	 */
	calcTweenDuration(deltaValue) {
		const deltaIntervals = deltaValue / this.intervalLength;
		return Math.min(deltaIntervals * this.timePerValueInterval, this.maxDuration);
	}

	_valueChanged(newValue) {
		if (this.skipInitial && !this._initialized) {
			this._initialized = true;
			this._displayValue = newValue;
			return;
		}

		const deltaValue = newValue - this._displayValue;
		const duration = this.calcTweenDuration(deltaValue);
		this.tween(newValue, duration);
	}

	tween(newValue, duration) {
		if (this._tween) {
			this._tween.kill();
			this._tween = null;
		}

		this._tween = TweenLite.to(this, duration, {
			_displayValue: newValue,
			ease: this.ease
		});

		return this._tween;
	}
}

customElements.define(AtomTweeningNumber.is, AtomTweeningNumber);
