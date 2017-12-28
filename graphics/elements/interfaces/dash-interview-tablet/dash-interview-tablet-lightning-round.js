(function () {
	'use strict';

	const questions = nodecg.Replicant('interview:questionTweets');
	const questionShowing = nodecg.Replicant('interview:questionShowing');
	const questionSortMap = nodecg.Replicant('interview:questionSortMap');
	const questionTimeRemaining = nodecg.Replicant('interview:questionTimeRemaining');

	/**
	 * @customElement
	 * @polymer
	 */
	class DashInterviewTabletLightningRound extends Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element)) {
		static get is() {
			return 'dash-interview-tablet-lightning-round';
		}

		static get properties() {
			return {
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

			let start;
			Polymer.Gestures.addListener(this.$['list-container'], 'track', e => {
				if (this._dragging) {
					return;
				}

				if (e.detail.state === 'start') {
					start = this.$.list.scrollTop;
				}

				this.$.list.scrollTop = start - e.detail.dy;
			});

			this.$.list.createMirror = originalElement => {
				const rect = originalElement.getBoundingClientRect();
				const mirror = originalElement.cloneNode(true);
				mirror.style.width = rect.width + 'px';
				mirror.style.height = rect.height + 'px';
				mirror.querySelector('ui-tweet').tweet = originalElement.querySelector('ui-tweet').tweet;
				return mirror;
			};

			// Fades new question nodes from purple to white when added.
			this._listObserver = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (!mutation.addedNodes) {
						return;
					}

					Array.from(mutation.addedNodes).filter(node => {
						return node.classList && node.classList.contains('tweet');
					}).forEach(node => {
						flushCss(node);
						node.style.backgroundColor = 'white';
					});
				});
			});

			this._listObserver.observe(this.$.list, {childList: true, subtree: true});

			questionTimeRemaining.on('change', newVal => {
				if (questionShowing.value) {
					this.$.autoQuestion.innerText = newVal;
				} else {
					this.$.autoQuestion.innerText = 'Auto';
				}
			});

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

				if (newVal.length > 0) {
					this._flashBgIfAppropriate(operations);
				}

				this._dragListOrder = newVal.slice(0);
			});

			questionShowing.on('change', newVal => {
				this.questionShowing = newVal;
				if (newVal) {
					this.$.autoQuestion.innerText = questionTimeRemaining.value === 0 ? 'Auto' : questionTimeRemaining.value;
				} else {
					this.$.autoQuestion.innerText = 'Auto';
				}
			});
		}

		showQuestion() {
			questionShowing.value = true;
		}

		hideQuestion() {
			questionShowing.value = false;
			this._markingTopQuestionAsDone = false;
		}

		autoQuestion() {
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

		showNextQuestion() {
			this.hideQuestion();
			this._markingTopQuestionAsDone = true;
			nodecg.sendMessage('interview:markQuestionAsDone', questionSortMap.value[0], error => {
				this._markingTopQuestionAsDone = false;
				if (error) {
					this.$.errorToast.text = 'Failed to load next interview question.';
					this.$.errorToast.show();
					nodecg.log.error(error);
				}
			});
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

		calcShowNextDisabled(replies, _markingTopQuestionAsDone) {
			return replies.length <= 0 || _markingTopQuestionAsDone;
		}

		_flashBgIfAppropriate(operations) {
			if (operations && operations.length === 1) {
				// Don't flash if the change was just the addition of a new question.
				if (operations[0].method === 'push') {
					return;
				}

				// Don't flash if the change was just caused by hitting "Show Next" on tier2.
				if (operations[0].method === 'splice' && operations[0].args.length === 2 &&
					operations[0].args[0] === 0 && operations[0].args[1] === 1) {
					return;
				}
			}

			this.$.list.classList.remove('bg-color-transition');
			this.$.list.style.backgroundColor = '#9966cc';
			flushCss(this.$.list);
			this.$.list.classList.add('bg-color-transition');
			this.$.list.style.backgroundColor = 'transparent';
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

		_mapSort(a, b) {
			if (!this._sortMapVal) {
				return 0;
			}

			const aMapIndex = this._sortMapVal.indexOf(a.id_str);
			const bMapIndex = this._sortMapVal.indexOf(b.id_str);

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
	 * By reading the offsetHeight property, we are forcing
	 * the browser to flush the pending CSS changes (which it
	 * does to ensure the value obtained is accurate).
	 * @param {Object} element - The element to force a CSS flush on.
	 * @returns {undefined}
	 */
	function flushCss(element) {
		element.offsetHeight; // eslint-disable-line no-unused-expressions
	}
})();
