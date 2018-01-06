(function () {
	'use strict';

	const interviewNames = nodecg.Replicant('interview:names');
	const lowerthirdShowing = nodecg.Replicant('interview:lowerthirdShowing');
	const runners = nodecg.Replicant('runners');

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

			// Hack to get around https://github.com/bevacqua/crossvent/issues/8
			// I dunno why but this prevents the "auto passive listener" thing.
			Polymer.Gestures.addListener(this.$.nameInputs, 'track', () => {});

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
				this.setNames(newVal);
			});

			lowerthirdShowing.on('change', newVal => {
				this.lowerthirdShowing = newVal;
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

		/**
		 * Takes the names currently entered into the inputs.
		 * @returns {undefined}
		 */
		takeNames() {
			interviewNames.value = this.getNames();
		}

		/**
		 * Returns an array of the names currently entered into the inputs.
		 * @returns {string[]} - The names.
		 */
		getNames() {
			const inputs = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));
			return inputs.map(input => input.value);
		}

		setNames(names) {
			const typeaheads = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));

			if (!names || names.length <= 0) {
				typeaheads.forEach(input => {
					input.value = '';
				});
				return;
			}

			typeaheads.forEach((input, index) => {
				input.value = names[index] || '';
			});
		}

		any(...args) {
			return args.find(arg => arg);
		}
	}

	customElements.define(DashInterviewTabletLowerthird.is, DashInterviewTabletLowerthird);
})();
