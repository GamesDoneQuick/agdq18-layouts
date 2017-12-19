/* global Random */
(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 */
	class AtomTextGreeble extends Polymer.Element {
		static get is() {
			return 'atom-text-greeble';
		}

		static get properties() {
			return {
				/**
				 * The number of characters this greeble should be in length.
				 */
				length: {
					type: Number,
					value: 15
				},

				/**
				 * How many times per second to update the text.
				 */
				tickRate: {
					type: Number,
					value: 5,
					observer: '_tickRateChanged'
				},

				/**
				 * The set of characters from which to create the random strings.
				 */
				characters: {
					type: String,
					value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
				},

				/**
				 * The text currently being shown.
				 */
				text: String,

				_charactersArray: {
					type: Array,
					computed: '_computeCharactersArray(characters)'
				}
			};
		}

		update() {
			let string = '';
			for (let i = 0; i < this.length; i++) {
				string += Random.pick(Random.engines.browserCrypto, this._charactersArray);
			}
			this.text = string;
		}

		_tickRateChanged(newVal) {
			if (this._tickInterval) {
				clearInterval(this._tickInterval);
			}

			this._tickInterval = setInterval(() => {
				this.update();
			}, 1000 / newVal);
		}

		_computeCharactersArray(characters) {
			return characters.split('');
		}
	}

	customElements.define(AtomTextGreeble.is, AtomTextGreeble);
})();
