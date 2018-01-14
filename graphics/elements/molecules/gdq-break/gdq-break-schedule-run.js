(function () {
	'use strict';

	const DISPALY_DURATION = nodecg.bundleConfig.displayDuration;

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqBreakScheduleRun extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-break-schedule-run';
		}

		static get properties() {
			return {
				importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
				run: {
					type: Object,
					observer: '_runChanged'
				},
				upNext: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				_currentRunnerIndex: {
					type: Number,
					value: 0
				}
			};
		}

		ready() {
			super.ready();
			this.hidden = true;
		}

		_runChanged(newVal) {
			this.hidden = !newVal;
			if (!newVal) {
				return;
			}

			const WIDTH_ADDED_BY_BORDERS = 2;
			const PADDING_OF_INFO_RUNNER = 48;

			this._killRunnerLoopTimeline();

			this.$['info-runner'].maxWidth = 0;
			this.$['info-runner'].text = this._getLongestName(newVal.runners);
			TweenLite.set(this.$['info-runner'], {opacity: 1, width: 'auto'});
			TweenLite.set(this.$['info-runner'].$.fittedContent, {scaleX: 1});

			Polymer.RenderStatus.beforeNextRender(this, () => {
				this.$['info-runner'].maxWidth =
					this.$.info.clientWidth -
					WIDTH_ADDED_BY_BORDERS -
					PADDING_OF_INFO_RUNNER -
					this.$['info-category'].clientWidth;

				this.$['info-runner'].style.width = `${this.$['info-runner'].clientWidth - PADDING_OF_INFO_RUNNER}px`;
				this.$['info-runner'].text = newVal.runners[0].name;

				if (newVal.runners.length > 1) {
					this._killRunnerLoopTimeline();
					this._runnerTimeline = this._createRunnerLoopTimeline(newVal.runners);
				}
			});
		}

		_createRunnerLoopTimeline(runners) {
			const tl = new TimelineMax({repeat: -1});

			runners.slice(1).concat([runners[0]]).forEach(runner => {
				tl.to(this.$['info-runner'], 0.5, {
					opacity: 0,
					ease: Sine.easeInOut
				}, `+=${DISPALY_DURATION}`);

				tl.call(() => {
					this.$['info-runner'].text = runner.name;
				});

				tl.to(this.$['info-runner'], 0.5, {
					opacity: 1,
					ease: Sine.easeInOut
				}, '+=0.1');
			});

			return tl;
		}

		_killRunnerLoopTimeline() {
			if (this._runnerTimeline) {
				this._runnerTimeline.kill();
				this._runnerTimeline = null;
			}
		}

		_formatRunName(runName) {
			if (!runName || typeof runName !== 'string') {
				return '?';
			}

			return runName.replace(/\\n/g, ' ');
		}

		_getLongestName(runners) {
			return runners.reduce((accumulator, currentValue) => {
				return currentValue.name.length > accumulator.length ? currentValue.name : accumulator;
			}, '');
		}
	}

	customElements.define(GdqBreakScheduleRun.is, GdqBreakScheduleRun);
})();
