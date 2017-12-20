(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');
	const schedule = nodecg.Replicant('schedule');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakSchedule extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-break-schedule';
		}

		static get properties() {
			return {
				upNext: Object,
				onDeck: Array
			};
		}

		ready() {
			super.ready();

			currentRun.on('change', () => {
				this.update();
			});

			schedule.on('change', () => {
				this.update();
			});

			this._$runs = this.shadowRoot.querySelectorAll('gdq-break-schedule-run');
		}

		update() {
			this._updateDebouncer = Polymer.Debouncer.debounce(
				this._updateDebouncer,
				Polymer.Async.timeOut.after(16),
				this._update.bind(this)
			);
		}

		_update() {
			const tl = new TimelineLite();

			if (schedule.status !== 'declared' ||
				currentRun.status !== 'declared' ||
				!schedule.value ||
				!currentRun.value) {
				return tl;
			}

			tl.set(this._$runs, {willChange: 'opacity'});

			tl.to(this._$runs, 0.5, {
				opacity: 0,
				ease: Sine.easeInOut
			}, '+=0.25');

			tl.call(() => {
				this.upNext = currentRun.value;

				const onDeckRuns = [];
				schedule.value.some(item => {
					if (item.type !== 'run') {
						return false;
					}

					if (item.order <= currentRun.value.order) {
						return false;
					}

					onDeckRuns.push(item);
					return onDeckRuns.length >= 3;
				});
				this.onDeck = onDeckRuns;
			});

			tl.to(this._$runs, 0.5, {
				opacity: 1,
				ease: Sine.easeInOut
			}, '+=0.1');

			tl.set(this._$runs, {clearProps: 'will-change'});

			return tl;
		}

		_getArrayItem(array, index) {
			if (!array) {
				return null;
			}

			return array[index];
		}
	}

	customElements.define(GdqBreakSchedule.is, GdqBreakSchedule);
})();
