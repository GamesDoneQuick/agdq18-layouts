(function () {
	'use strict';

	const questions = nodecg.Replicant('interview:questionTweets');
	const questionShowing = nodecg.Replicant('interview:questionShowing');
	const questionSortMap = nodecg.Replicant('interview:questionSortMap');
	const showPrizesOnMonitorRep = nodecg.Replicant('interview:showPrizesOnMonitor');

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin window.MapSortMixin
	 */
	class DashInterviewTabletLightningRound extends
		window.MapSortMixin(Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element))) {
		static get is() {
			return 'dash-interview-tablet-lightning-round';
		}

		static get properties() {
			return {
				prizesShowingOnMonitor: {
					type: Boolean,
					value: false
				},
				questionShowing: {
					type: Boolean,
					value: false,
					notify: true
				},
				replies: {
					type: Object
				},
				_markingTopQuestionAsDone: Boolean
			};
		}

		ready() {
			super.ready();

			if (isMobileSafari()) {
				let start;
				Polymer.Gestures.addListener(this.$['list-container'], 'track', e => {
					if (e.detail.state === 'start') {
						start = this.$.list.scrollTop;
						return;
					}

					if (this._dragging) {
						return;
					}

					this.$.list.scrollTop = Math.max(start - e.detail.dy, 0);
				});
			} else {
				// Hack to get around https://github.com/bevacqua/crossvent/issues/8
				// I dunno why but this prevents the "auto passive listener" thing.
				Polymer.Gestures.addListener(this.$['list-container'], 'track', () => {});
			}

			this.$.list.createMirror = originalElement => {
				const rect = originalElement.getBoundingClientRect();
				const mirror = originalElement.cloneNode(true);
				mirror.style.width = rect.width + 'px';
				mirror.style.height = rect.height + 'px';
				mirror.querySelector('ui-tweet').tweet = originalElement.querySelector('ui-tweet').tweet;
				return mirror;
			};

			// Fades new question nodes from purple to white when added.
			this._flashAddedNodes(this.$.list, '.tweet');

			questions.on('change', newVal => {
				this.set('replies', newVal);
			});

			questionSortMap.on('change', (newVal, oldVal, operations) => {
				// If the new sortMap is equal to the currently rendered sort order, do nothing.
				if (JSON.stringify(newVal) === JSON.stringify(this._dragListOrder)) {
					return;
				}

				this._sortMapVal = newVal;
				this.notifyPath('replies');

				if (newVal.length > 0 && this._shouldFlash(operations)) {
					this._flashElementBackground(this.$.list);
				}

				this._dragListOrder = newVal.slice(0);
			});

			questionShowing.on('change', newVal => {
				this.questionShowing = newVal;
			});

			showPrizesOnMonitorRep.on('change', newVal => {
				this.prizesShowingOnMonitor = newVal;
			});
		}

		showQuestionsOnMonitor() {
			nodecg.sendMessage('interview:hidePrizePlaylistOnMonitor');
		}

		hideQuestionsOnMonitor() {
			nodecg.sendMessage('interview:showPrizePlaylistOnMonitor');
		}

		reject(event) {
			const button = event.target.closest('paper-button');
			button.disabled = true;
			nodecg.sendMessage('interview:markQuestionAsDone', event.model.reply.id_str, error => {
				button.disabled = false;
				if (error) {
					this.$.errorToast.text = 'Failed to reject interview question.';
					this.$.errorToast.show();
					nodecg.log.error(error);
				}
			});
		}

		openEndInterviewDialog() {
			this.$.endInterviewDialog.open();
		}

		endInterview() {
			nodecg.sendMessage('interview:end');
		}

		_handleDrag() {
			this._dragging = true;
		}

		_handleDragEnd() {
			this._dragging = false;
			const items = Array.from(this.$.list.querySelectorAll('.tweet'));
			const newSortOrder = items.map(item => item.tweetId);
			this._dragListOrder = newSortOrder;
			this.$.repeat.__instances.sort((a, b) => {
				const aMapIndex = newSortOrder.indexOf(a.__data.reply.id_str);
				const bMapIndex = newSortOrder.indexOf(b.__data.reply.id_str);

				if (aMapIndex >= 0 && bMapIndex < 0) {
					return -1;
				}

				if (aMapIndex < 0 && bMapIndex >= 0) {
					return 1;
				}

				// If neither of these replies are in the sort map, just leave them where they are.
				if (aMapIndex < 0 && bMapIndex < 0) {
					return 0;
				}

				return aMapIndex - bMapIndex;
			});
			questionSortMap.value = newSortOrder;
		}

		/* Disabled for now. Can't get drag sort and button sort to work simultaneously.
		calcPromoteDisabled(tweet, _dragListOrder) {
			const sortIndex = _dragListOrder.indexOf(tweet.id_str);
			if (sortIndex === -1) {
				return false;
			}

			return sortIndex <= 1;
		}

		calcDemoteDisabled(tweet, _dragListOrder) {
			const sortIndex = _dragListOrder.indexOf(tweet.id_str);
			if (sortIndex === -1) {
				return false;
			}

			return sortIndex >= _dragListOrder.length - 1;
		}

		promote(e) {
			nodecg.sendMessage('promoteQuestion', e.model.reply.id_str);
		}

		demote(e) {
			nodecg.sendMessage('demoteQuestion', e.model.reply.id_str);
		}
		*/
	}

	customElements.define(DashInterviewTabletLightningRound.is, DashInterviewTabletLightningRound);

	/**
	 * Checks if the page is running in mobile Safari.
	 * @returns {boolean} - True if running in mobile Safari.
	 */
	function isMobileSafari() {
		return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
	}
})();
