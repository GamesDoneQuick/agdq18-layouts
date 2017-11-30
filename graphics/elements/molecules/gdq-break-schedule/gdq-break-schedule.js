/* global SplitText */
(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');
	const schedule = nodecg.Replicant('schedule');
	const displayDuration = nodecg.bundleConfig.displayDuration;
	const TYPE_INTERVAL = 0.03;
	const EMPTY_OBJ = {};

	class GdqBreakSchedule extends Polymer.Element {
		static get is() {
			return 'gdq-break-schedule';
		}

		static get properties() {
			return {
				onDeckTL: {
					type: TimelineMax,
					value() {
						return new TimelineMax({
							repeat: -1,
							repeatDelay: displayDuration
						});
					},
					readOnly: true
				}
			};
		}

		ready() {
			super.ready();
			currentRun.on('change', this._handleCurrentRunChange.bind(this));
			schedule.on('change', () => {
				Polymer.RenderStatus.afterNextRender(this, this.recalcOnDeckRuns);
			});
		}

		_handleCurrentRunChange(newVal) {
			this._typeAnim(this.$.upNext, newVal);
			this.recalcOnDeckRuns();
		}

		recalcOnDeckRuns() {
			Array.from(this.$.onDeck.querySelectorAll('.run-name, .run-details')).forEach(el => {
				el.innerHTML = '';
			});

			Array.from(this.$.onDeck.querySelectorAll('.onDeckRun')).forEach(el => {
				el.style.display = 'none';
			});

			if (!currentRun.value || !schedule.value) {
				return;
			}

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

			const tl = this.onDeckTL;
			tl.clear();

			switch (onDeckRuns.length) {
				case 3: {
					const time = displayDuration * 2;
					tl.set(this.$.redPip3, {opacity: 1}, time);
					tl.set([this.$.redPip1, this.$.redPip2], {opacity: 0}, time);
					tl.set(this.$.onDeck3, {display: 'flex'}, time);
					tl.set([this.$.onDeck1, this.$.onDeck2], {display: 'none'}, time);
					tl.add(this._typeAnim(this.$.onDeck3, onDeckRuns[2]), time);
				}
				/* falls through */
				case 2: {
					const time = displayDuration;
					tl.set(this.$.redPip2, {opacity: 1}, time);
					tl.set([this.$.redPip1, this.$.redPip3], {opacity: 0}, time);
					tl.set(this.$.onDeck2, {display: 'flex'}, time);
					tl.set([this.$.onDeck1, this.$.onDeck3], {display: 'none'}, time);
					tl.add(this._typeAnim(this.$.onDeck2, onDeckRuns[1]), time);
				}
				/* falls through */
				case 1: {
					const time = 0;
					tl.set(this.$.redPip1, {opacity: 1}, time);
					tl.set([this.$.redPip2, this.$.redPip3], {opacity: 0}, time);
					tl.set(this.$.onDeck1, {display: 'flex'}, time);
					tl.set([this.$.onDeck2, this.$.onDeck3], {display: 'none'}, time);
					tl.add(this._typeAnim(this.$.onDeck1, onDeckRuns[0]), time);

					if (onDeckRuns.length === 1) {
						tl.addPause();
					}
					break;
				}
				default:
				// Display something about there being no on deck runs
			}

			tl.restart();
		}

		_typeAnim($parent, run, tl) {
			tl = tl || new TimelineLite();

			const $runName = $parent.querySelector('.run-name');
			const $runDetails = $parent.querySelector('.run-details');
			const processWord = function (word) {
				tl.staggerFrom(word.children, 0.001, {
					visibility: 'hidden'
				}, TYPE_INTERVAL);

				tl.to(EMPTY_OBJ, TYPE_INTERVAL, EMPTY_OBJ);
			};

			$runName.innerHTML = this._formatRunName(run.name);
			$runDetails.innerText = `${run.category} - ${this.concatRunners(run.runners)}`;

			const nameSplit = new SplitText($runName, {type: 'chars,words'});
			const categoryAndRunnerSplit = new SplitText($runDetails, {type: 'chars,words'});
			nameSplit.words.forEach(processWord);
			categoryAndRunnerSplit.words.forEach(processWord);

			return tl;
		}

		_formatRunName(runName) {
			if (!runName || typeof runName !== 'string') {
				return '?';
			}

			return runName.replace('\\n', '<br/>');
		}

		concatRunners(runners) {
			if (!runners || !Array.isArray(runners)) {
				return '?';
			}

			let concatenatedRunners;
			if (runners.length === 1) {
				concatenatedRunners = runners[0].name;
			} else {
				concatenatedRunners = runners.slice(1).reduce((prev, curr, index, array) => {
					if (index === array.length - 1) {
						return `${prev} & ${curr.name}`;
					}

					return `${prev}, ${curr.name}`;
				}, runners[0].name);
			}

			return concatenatedRunners;
		}
	}

	customElements.define(GdqBreakSchedule.is, GdqBreakSchedule);
})();
