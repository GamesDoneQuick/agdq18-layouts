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
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					},
					readOnly: true
				},
				_questionsVal: {
					type: Object
				},
				onScreenTweet: {
					type: Object,
					computed: 'calcOnScreenTweet(_questionsVal, _sortMapVal)',
					value: null
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
			});
		}

		show() {
			this.tl.call(() => {
				if (!this.onScreenTweet) {
					this.tl.clear();
					return;
				}

				this.$['question-text'].innerHTML = this.onScreenTweet.text;
				this.$.username.innerText = `@${this.onScreenTweet.user.screen_name}`;
				this.style.willChange = 'transform';
			}, null, null, '+=0.3'); // Give time for question replicants to update.

			this.tl.to(this, 0.9, {
				y: 0,
				ease: Power3.easeOut
			});
		}

		hide() {
			this.tl.to(this, 0.9, {
				y: 254,
				ease: Power3.easeIn,
				onComplete() {
					this.style.willChange = '';
				},
				onCompleteScope: this
			});
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
