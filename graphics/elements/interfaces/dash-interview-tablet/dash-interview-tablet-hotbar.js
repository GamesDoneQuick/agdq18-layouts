(function () {
	'use strict';

	const questionShowing = nodecg.Replicant('interview:questionShowing');
	const questionSortMap = nodecg.Replicant('interview:questionSortMap');
	const questionTimeRemaining = nodecg.Replicant('interview:questionTimeRemaining');
	const lowerthirdTimeRemaining = nodecg.Replicant('interview:lowerthirdTimeRemaining');

	class DashInterviewTabletHotbar extends Polymer.Element {
		static get is() {
			return 'dash-interview-tablet-hotbar';
		}

		static get properties() {
			return {
				lowerthirdShowing: Boolean,
				lowerthirdTimeRemaining: Number,
				questionShowing: Boolean,
				questionTimeRemaining: Number,
				_markingTopQuestionAsDone: Boolean
			};
		}

		ready() {
			super.ready();

			lowerthirdTimeRemaining.on('change', newVal => {
				this.lowerthirdTimeRemaining = newVal;
			});

			questionTimeRemaining.on('change', newVal => {
				this.questionTimeRemaining = newVal;
			});
		}

		showLowerthird() {
			this.dispatchEvent(new CustomEvent('show-lowerthird-clicked'));
		}

		hideLowerthird() {
			this.dispatchEvent(new CustomEvent('hide-lowerthird-clicked'));
		}

		showQuestion() {
			this._markingTopQuestionAsDone = true;
			nodecg.sendMessage('pulseInterviewQuestion', questionSortMap.value[0], error => {
				this._markingTopQuestionAsDone = false;
				if (error) {
					this.$.errorToast.text = 'Failed to load next interview question.';
					this.$.errorToast.show();
					nodecg.log.error(error);
				}
			});
		}

		hideQuestion() {
			questionShowing.value = false;
			this._markingTopQuestionAsDone = false;
		}

		autoFillNames() {
			this.dispatchEvent(new CustomEvent('auto-fill-names-clicked'));
		}

		openLowerthirdPreview() {
			this.dispatchEvent(new CustomEvent('open-lowerthird-preview-clicked'));
		}

		_any(...args) {
			return args.find(arg => Boolean(arg));
		}
	}

	customElements.define(DashInterviewTabletHotbar.is, DashInterviewTabletHotbar);
})();
