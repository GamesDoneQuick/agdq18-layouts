(function () {
	'use strict';

	const questionTweets = nodecg.Replicant('interview:questionTweets');
	const questionSortMap = nodecg.Replicant('interview:questionSortMap');

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin window.MapSortMixin
	 */
	class DashInterviewMonitorTweets extends window.MapSortMixin(Polymer.MutableData(Polymer.Element)) {
		static get is() {
			return 'dash-interview-monitor-tweets';
		}

		static get properties() {
			return {
				questionTweets: {
					type: Array
				},
				noQuestionTweets: {
					type: Boolean,
					computed: '_computeNoQuestionTweets(questionTweets)'
				},
				pgmTweet: {
					type: Object,
					computed: '_calcPgmTweet(questionTweets, _sortMapVal)',
					observer: '_pgmTweetChanged',
					value: null
				}
			};
		}

		ready() {
			super.ready();

			// Fades new question nodes from purple to white when added.
			this._flashAddedNodes(this.shadowRoot, 'dash-interview-monitor-tweet', node => {
				const firstChild = this.shadowRoot.querySelector('dash-interview-monitor-tweet');
				const isFirstChild = node === firstChild;
				return !isFirstChild;
			});

			questionTweets.on('change', newVal => {
				if (!newVal || newVal.length === 0) {
					this.questionTweets = [];
					return;
				}

				this.questionTweets = newVal;
			});

			questionSortMap.on('change', (newVal, oldVal, operations) => {
				this._sortMapVal = newVal;
				this.$.repeat.render();

				if (newVal.length > 0 && this._shouldFlash(operations)) {
					this._flashElementBackground(this);
				}
			});
		}

		_computeNoQuestionTweets(questionTweets) {
			return !questionTweets || questionTweets.length <= 0;
		}

		_calcPgmTweet(questionTweets, _sortMapVal) {
			if (!questionTweets || !_sortMapVal) {
				return;
			}

			return questionTweets.find(tweet => {
				return _sortMapVal.indexOf(tweet.id_str) === 0;
			});
		}

		_pgmTweetChanged(newVal, oldVal) {
			if (!newVal) {
				return;
			}

			if (newVal && oldVal && newVal.id_str === oldVal.id_str) {
				return;
			}

			this.$.repeat.render();
			Polymer.flush();

			const firstMonitorTweet = this.shadowRoot.querySelector('dash-interview-monitor-tweet');
			if (!firstMonitorTweet) {
				return;
			}

			this._flashElementBackground(firstMonitorTweet.$.material, {endColor: '#DDFEDF'});
		}
	}

	customElements.define(DashInterviewMonitorTweets.is, DashInterviewMonitorTweets);
})();
