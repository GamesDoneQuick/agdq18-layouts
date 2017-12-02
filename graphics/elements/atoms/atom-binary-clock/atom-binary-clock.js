/* global Random */
(function () {
	const NUM_BITS = 4;

	/**
	 * @customElement
	 * @polymer
	 */
	class AtomBinaryClock extends Polymer.Element {
		static get is() {
			return 'atom-binary-clock';
		}

		static get properties() {
			return {
				hours: {
					type: Number,
					observer: '_updateHours'
				},
				minutes: {
					type: Number,
					observer: '_updateMinutes'
				},
				seconds: {
					type: Number,
					observer: '_updateSeconds'
				},
				milliseconds: {
					type: Number,
					observer: '_updateMilliseconds'
				},
				pulsating: {
					type: Boolean,
					value: false,
					reflectToAttribute: true
				},
				randomized: {
					type: Boolean,
					value: false,
					reflectToAttribute: true,
					observer: '_randomizedChanged'
				}
			};
		}

		ready() {
			super.ready();
			const cells = Array.from(this.shadowRoot.querySelectorAll('.cell'));

			[
				'hourOnes',
				'minuteTens',
				'minuteOnes',
				'secondTens',
				'secondOnes',
				'millisecondHundredths'
			].forEach((columnName, index) => {
				const offset = index * NUM_BITS;
				this[`_$${columnName}Cells`] = cells.slice(offset, offset + NUM_BITS);
			});
		}

		startRandomFlashing() {
			if (this._randomFlashingInterval) {
				return this._randomFlashingInterval;
			}

			this._randomFlashingInterval = setInterval(() => {
				this.flashRandomCell();
			}, 100);
		}

		stopRandomFlashing() {
			const cells = Array.from(this.shadowRoot.querySelectorAll('.cell--flash'));
			cells.forEach(cell => cell.classList.remove('cell--flash'));
			clearInterval(this._randomFlashingInterval);
			this._randomFlashingInterval = null;
		}

		flashRandomCell() {
			const availableCells = Array.from(this.shadowRoot.querySelectorAll('.cell:not(.cell--flash)'));
			if (availableCells.length === 0) {
				return;
			}

			const cell = Random.pick(Random.engines.browserCrypto, availableCells);
			cell.classList.add('cell--flash');
			setTimeout(() => {
				cell.classList.remove('cell--flash', 'cell--on');
			}, 450);
		}

		_updateHours() {
			this._setColumn(numberPlace(this.hours, 1), this._$hourOnesCells);
		}

		_updateMinutes() {
			this._setColumn(numberPlace(this.minutes, 10), this._$minuteTensCells);
			this._setColumn(numberPlace(this.minutes, 1), this._$minuteOnesCells);
		}

		_updateSeconds() {
			this._setColumn(numberPlace(this.seconds, 10), this._$secondTensCells);
			this._setColumn(numberPlace(this.seconds, 1), this._$secondOnesCells);
		}

		_updateMilliseconds() {
			this._setColumn(numberPlace(this.milliseconds, 100), this._$millisecondHundredthsCells);
		}

		_randomizedChanged(newVal) {
			if (newVal) {
				this.startRandomFlashing();
			} else {
				this.stopRandomFlashing();
			}
		}

		_setColumn(number, cells) {
			number
				.toString(2)
				.padStart(NUM_BITS, '0')
				.split('')
				.forEach((oneOrZero, index) => {
					const on = oneOrZero === '1';
					cells[index].classList.toggle('cell--on', on);
				});
		}
	}

	customElements.define(AtomBinaryClock.is, AtomBinaryClock);

	function numberPlace(number, place) {
		if (typeof place !== 'number') {
			throw new Error('must provide a place and it must be a number');
		}

		if (place === 1) {
			return number % 10;
		}

		return Math.floor(number / place);
	}
})();
