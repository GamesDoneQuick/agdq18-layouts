(function () {
	'use strict';

	const currentIntermission = nodecg.Replicant('currentIntermission');
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
				const typeaheads = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));

				if (!newVal || newVal.length <= 0) {
					typeaheads.forEach(input => {
						input.value = '';
					});
					return;
				}

				typeaheads.forEach((input, index) => {
					input.value = newVal[index] || '';
				});
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

		openEndInterviewDialog() {
			this.$.endInterviewDialog.open();
		}

		endInterview() {
			nodecg.sendMessage('interview:end');
		}

		autoFillNames() {
			if (!currentIntermission.value || !currentIntermission.value.content) {
				return;
			}

			const typeaheads = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));
			const currentInterview = currentIntermission.value.content.find(item => item.type === 'interview');

			console.log('currentInterview:', currentInterview);

			if (!currentInterview) {
				typeaheads.forEach(input => {
					input.value = '';
				});
				return;
			}

			const allParticipants = currentInterview.interviewers.concat(currentInterview.interviewees);
			console.log('allParticipants:', allParticipants);
			typeaheads.forEach((input, index) => {
				input.value = allParticipants[index] || '';
			});
		}

		/**
		 * Takes the names currently entered into the nodecg-typeahead-inputs.
		 * @returns {undefined}
		 */
		takeNames() {
			const inputs = Array.from(this.shadowRoot.querySelectorAll('dash-lowerthird-name-input'));
			interviewNames.value = inputs.map(input => input.value);
		}

		any(...args) {
			return args.find(arg => arg);
		}
	}

	customElements.define(DashInterviewTabletLowerthird.is, DashInterviewTabletLowerthird);
})();
