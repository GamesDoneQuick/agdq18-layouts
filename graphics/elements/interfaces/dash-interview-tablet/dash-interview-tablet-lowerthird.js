(function () {
	'use strict';

	const interviewNames = nodecg.Replicant('interview:names');
	const lowerthirdShowing = nodecg.Replicant('interview:lowerthirdShowing');
	const runners = nodecg.Replicant('runners');
	const lowerthirdTimeRemaining = nodecg.Replicant('interview:lowerthirdTimeRemaining');

	/**
	 * @customElement
	 * @polymer
	 */
	class DashInterviewTabletLowerthird extends Polymer.Element {
		static get is() {
			return 'dash-interview-tablet-lowerthird';
		}

		static get properties() {
			return {
				lowerthirdShowing: {
					type: Boolean,
					value: false,
					notify: true
				},
				questionShowing: {
					type: Boolean
				},
				_typeaheadCandidates: {
					type: Array,
					value() {
						return [];
					}
				}
			};
		}

		ready() {
			super.ready();

			this.$.nameInputs.moves = function (element, source, handle) {
				return handle.id === 'handle';
			};

			this.$.nameInputs.createMirror = originalElement => {
				const rect = originalElement.getBoundingClientRect();
				const mirror = originalElement.cloneNode(true);
				mirror.style.width = rect.width + 'px';
				mirror.style.height = rect.height + 'px';
				mirror.allowCustomValue = true;
				mirror.value = originalElement.value;
				Polymer.RenderStatus.beforeNextRender(mirror, () => {
					mirror.$.input.$.input.value = originalElement.value;
				});
				return mirror;
			};

			runners.on('change', newVal => {
				if (newVal && newVal.length > 0) {
					this._typeaheadCandidates = newVal.filter(runner => runner).map(runner => runner.name).sort();
				} else {
					this._typeaheadCandidates = [];
				}
			});

			interviewNames.on('change', newVal => {
				const typeaheads = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));
				typeaheads.unshift(this.$.fifthPersonInput);

				if (!newVal || newVal.length <= 0) {
					typeaheads.forEach(input => {
						input.value = '';
					});
					return;
				}

				if (newVal.length === 5) {
					typeaheads[0].selectedItem = newVal[0];
				}

				const lastFour = newVal.slice(-4);
				lastFour.forEach((name, index) => {
					typeaheads[index + 1].selectedItem = name;
				});
			});

			lowerthirdShowing.on('change', newVal => {
				this.lowerthirdShowing = newVal;
				if (newVal) {
					this.$.autoLowerthird.innerText = lowerthirdTimeRemaining.value === 0 ? 'Auto' : lowerthirdTimeRemaining.value;
				} else {
					this.$.autoLowerthird.innerText = 'Auto';
				}
			});

			lowerthirdTimeRemaining.on('change', newVal => {
				if (lowerthirdShowing.value) {
					this.$.autoLowerthird.innerText = newVal;
				} else {
					this.$.autoLowerthird.innerText = 'Auto';
				}
			});
		}

		calcStartDisabled(lowerthirdShowing, questionShowing) {
			return lowerthirdShowing || questionShowing;
		}

		showLowerthird() {
			this.takeNames();
			lowerthirdShowing.value = true;
		}

		hideLowerthird() {
			lowerthirdShowing.value = false;
		}

		autoLowerthird() {
			this.takeNames();
			nodecg.sendMessage('pulseInterviewLowerthird', 10);
		}

		openEndInterviewDialog() {
			this.$.endInterviewDialog.open();
		}

		endInterview() {
			nodecg.sendMessage('interview:end');
		}

		/**
		 * Takes the names currently entered into the nodecg-typeahead-inputs.
		 * @returns {undefined}
		 */
		takeNames() {
			const inputs = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));
			if (this.fivePersonMode) {
				inputs.unshift(this.$.fifthPersonInput);
			}

			interviewNames.value = inputs.map(input => input.value);
		}

		any(...args) {
			return args.find(arg => arg);
		}
	}

	customElements.define(DashInterviewTabletLowerthird.is, DashInterviewTabletLowerthird);
})();
