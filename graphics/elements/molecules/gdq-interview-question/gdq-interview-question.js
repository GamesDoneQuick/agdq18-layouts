(function () {
	'use strict';

	const questions = nodecg.Replicant('interview:questionTweets');
	const questionSortMap = nodecg.Replicant('interview:questionSortMap');
	const questionShowing = nodecg.Replicant('interview:questionShowing');

	class GdqInterviewQuestion extends Polymer.Element {
		static get is() {
			return 'gdq-interview-question';
		}

		static get properties() {
			return {
				onScreenTweet: {
					type: Object,
					computed: 'calcOnScreenTweet(_questionsVal, _sortMapVal)',
					value: null
				},
				_timeline: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					}
				},
				_questionsVal: {
					type: Object
				}
			};
		}

		ready() {
			super.ready();

			questions.on('change', newVal => {
				this._questionsVal = newVal.slice(0);
			});

			questionSortMap.on('change', newVal => {
				this._sortMapVal = newVal.slice(0);
			});

			questionShowing.on('change', newVal => {
				if (newVal) {
					this.show();
				} else {
					this.hide();
				}
				this._initialized = true;
			});
		}

		show() {
			if (!this.onScreenTweet) {
				return;
			}

			this._timeline.call(() => {
				this.$.tweet._addReset();
				this.$.tweet._addEntranceAnim(this.onScreenTweet);
			}, null, null, '+=0.5');
		}

		hide() {
			if (!this._initialized) {
				return;
			}

			this._timeline.call(() => {
				this.$.tweet._addExitAnim(0);
			}, null, null, '+=0.5');
		}

		calcOnScreenTweet(_questionsVal, _sortMapVal) {
			if (!_questionsVal || !_sortMapVal) {
				return;
			}

			return _questionsVal.find(reply => {
				return _sortMapVal.indexOf(reply.id_str) === 0;
			});
		}
	}

	customElements.define(GdqInterviewQuestion.is, GdqInterviewQuestion);
})();
