(function () {
	'use strict';

	const interviewNames = nodecg.Replicant('interview:names');
	const lowerthirdShowing = nodecg.Replicant('interview:lowerthirdShowing');
	const questions = nodecg.Replicant('interview:questionTweets');
	const questionShowing = nodecg.Replicant('interview:questionShowing');
	const questionSortMap = nodecg.Replicant('interview:questionSortMap');
	const runners = nodecg.Replicant('runners');
	const lowerthirdTimeRemaining = nodecg.Replicant('interview:lowerthirdTimeRemaining');
	const questionTimeRemaining = nodecg.Replicant('interview:questionTimeRemaining');

	class GdqInterviewTier2 extends Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element)) {
		static get is() {
			return 'gdq-interview-tier2';
		}

		static get properties() {
			return {
				replies: {
					type: Object
				},
				lowerthirdShowing: {
					type: Boolean
				},
				questionShowing: {
					type: Boolean,
					reflectToAttribute: true
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
				mirror.querySelector('gdq-tweet').tweet = originalElement.querySelector('gdq-tweet').tweet;
				return mirror;
			};

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

			runners.on('change', newVal => {
				if (newVal && newVal.length > 0) {
					this._typeaheadCandidates = newVal.filter(runner => runner).map(runner => runner.name).sort();
				} else {
					this._typeaheadCandidates = [];
				}
			});

			interviewNames.on('change', newVal => {
				const typeaheads = Array.from(this.shadowRoot.querySelectorAll('gdq-lowerthird-name-input'));
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

		calcStartDisabled(lowerthirdShowing, questionShowing) {
			return lowerthirdShowing || questionShowing;
		}

		showQuestion() {
			questionShowing.value = true;
		}

		hideQuestion() {
			questionShowing.value = false;
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

		/**
		 * Takes the names currently entered into the nodecg-typeahead-inputs.
		 * @returns {undefined}
		 */
		takeNames() {
			const inputs = Array.from(this.shadowRoot.querySelectorAll('gdq-lowerthird-name-input'));
			if (this.fivePersonMode) {
				inputs.unshift(this.$.fifthPersonInput);
			}

			interviewNames.value = inputs.map(input => input.value);
		}

		any(...args) {
			return args.find(arg => arg);
		}

		calcShowNextDisabled(replies, _markingTopQuestionAsDone) {
			if (replies.length <= 0 || _markingTopQuestionAsDone) {
				return true;
			}
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

	customElements.define(GdqInterviewTier2.is, GdqInterviewTier2);

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
