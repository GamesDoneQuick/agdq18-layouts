/* global SplitText */
(function () {
	'use strict';

	const displayDuration = nodecg.bundleConfig.displayDuration;
	const currentBids = nodecg.Replicant('currentBids');
	const TYPE_INTERVAL = 0.03;
	const CHALLENGE_BAR_WIDTH = 372;
	const CHALLENGE_PIP_INTERVAL = 0.03;
	const TUG_PIP_INTERVAL = 0.04;
	const CHOICE_BAR_WIDTH = 214;
	const CHOICE_PIP_INTERVAL = 0.03;
	const BIG_PIP_WIDTH = 6;
	const SMALL_PIP_WIDTH = 4;
	const EMPTY_OBJ = {};

	class GdqBreakBids extends Polymer.Element {
		static get is() {
			return 'gdq-break-bids';
		}

		static get properties() {
			return {
				hidden: {
					type: Boolean,
					reflectToAttribute: true,
					observer: '_hiddenChanged'
				},
				bidType: {
					type: String,
					reflectToAttribute: true
				},
				bitsChallenge: {
					type: String,
					reflectToAttribute: true
				},
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					},
					readOnly: true
				},
				screenHeader: {
					type: String,
					value: 'VIEWER INCENTIVES',
					readOnly: true
				}
			};
		}

		_hiddenChanged(newVal) {
			if (newVal) {
				this.$['runName-content'].innerText = '';
				this.$['bidDescription-content'].innerText = '';
			}
		}

		/**
		 * Returns whether or not there are any bids to show at this time.
		 * @returns {boolean} - A bool.
		 */
		hasContent() {
			if (window._disableBids) {
				return false;
			}

			return this._calcBidsToDisplay(currentBids.value).length > 0;
		}

		/**
		 * Adds an animation to the global timeline for showing some current bids.
		 * @returns {undefined}
		 */
		showContent() {
			return new Promise(resolve => {
				if (currentBids.value.length <= 0 || window._disableBids) {
					setTimeout(resolve, 0);
					return;
				}

				// Figure out what bids to display in this batch, then
				// loop over each bid and queue it up on the timeline
				const bidsToDisplay = this._calcBidsToDisplay(currentBids.value);
				bidsToDisplay.forEach(this.showBid, this);
				this.tl.call(resolve);
			});
		}

		replaceBottomText(text) {
			if (text === this._lastBottomTest) {
				return;
			}

			this._lastBottomTest = text;
			document.getElementById('screen-donateURL').innerHTML = text;
			this._typeAnim(document.getElementById('screen-donateURL'));
		}

		/**
		 * Adds an animation to the global timeline for showing a specific bid.
		 * Intended to be used as the callback of a "forEach" statement.
		 * @param {Object} bid - The bid to display.
		 * @param {Number} index - The index of this bid in bidsArray.
		 * @param {Array} bidsArray - The parent array containing all the bids being shown in this cycle.
		 * @returns {undefined}
		 */
		showBid(bid, index, bidsArray) {
			// Tiny timekiller to fix things breaking. Seriously, do not remove this.
			this.tl.to({}, 0.03, {
				onComplete() {
					this.replaceBottomText(
						bid.isBitsChallenge ?
							'Use&nbsp;Twitch&nbsp;chat&nbsp;to&nbsp;contribute&nbsp;Bits!' : '' +
							'gamesdonequick.com/donate'
					);

					this.bitsChallenge = bid.isBitsChallenge;
					this.$['challenge-leftarrow'].src =
						`${this.importPath}img/${this.bitsChallenge ? 'bits_' : ''}challenge_leftarrow.png`;
					this.$['challenge-rightarrow'].src =
						`${this.importPath}img/${this.bitsChallenge ? 'bits_' : ''}challenge_rightarrow.png`;
				},
				callbackScope: this
			});

			// Prep elements for animation
			if (bid.type === 'challenge') {
				this.tl.set(this.$['challenge-bar-fill'], {width: 0});
				this.tl.call(() => {
					this.$['challenge-goal'].innerHTML = bid.isBitsChallenge ?
						`<img id="challenge-goal-bitsIcon" width="44" src="img/bitsicon.png">${bid.goal.replace('$', '')}` :
						bid.goal;
					this.$['challenge-bar-fill-label-text'].innerHTML = bid.isBitsChallenge ?
						'<img id="challenge-bar-fill-label-text-bitsIcon" width="26" src="img/bitsicon.png">0' :
						'$0';
				});
			} else if (bid.type === 'choice-binary') {
				this.tl.set(this.$['tug-bar-left'], {clearProps: 'width'});
				this.tl.call(() => {
					this.$['tug-bar-center-label'].style.borderColor = 'white';
					this.shadowRoot.querySelector('#tug-left .tug-option-total').innerHTML = bid.options[0].total;
					this.shadowRoot.querySelector('#tug-right .tug-option-total').innerHTML = bid.options[1].total;
					this.shadowRoot.querySelector('#tug-left .tug-option-desc').innerHTML = bid.options[0].description || bid.options[0].name;
					this.shadowRoot.querySelector('#tug-right .tug-option-desc').innerHTML = bid.options[1].description || bid.options[1].name;
					this.$['tug-bar-center-label-leftarrow'].style.display = 'none';
					this.$['tug-bar-center-label-rightarrow'].style.display = 'none';
					this.$['tug-bar-center-label-delta'].innerHTML = '$0';
				});
			} else if (bid.type === 'choice-many') {
				const qsa = selector => {
					return Array.from(this.$.choice.querySelectorAll(selector));
				};

				this.tl.set(qsa('.choice-row'), {y: 0});
				this.tl.call(() => {
					qsa('.choice-row-meter-fill').forEach(el => {
						el.style.width = 0;
					});
					qsa('.choice-row-label').forEach((el, index) => {
						el.textContent = bid.options[index].description || bid.options[index].name;
					});
					qsa('.choice-row-amount').forEach((el, index) => {
						// Don't show cents if the value of this option is $100,000 or more.
						if (bid.options[index].rawTotal >= 100000) {
							el.textContent = bid.options[index].total.split('.')[0];
						} else {
							el.textContent = bid.options[index].total;
						}
					});
				});
			}

			const newRunName = this._formatRunName(bid.speedrun);
			this.tl.call(() => {
				if (!this.$['runName-content'].innerText && !this.$['bidDescription-content'].innerText) {
					return;
				}

				this.tl.pause();

				let changingRunName = false;
				if (this.$['runName-content'].innerText !== newRunName && this.$['runName-content'].split) {
					changingRunName = true;
					this._untypeAnim(this.$['runName-content']).then(checkDone.bind(this));
				}

				if (this.$['bidDescription-content'].split) {
					this._untypeAnim(this.$['bidDescription-content']).then(checkDone.bind(this));
				}

				let counter = 0;

				/**
				 * Resolves the promise once all the untype anims have finished.
				 * @returns {undefined}
				 */
				function checkDone() {
					counter++;
					if (!changingRunName || counter >= 2) {
						this.tl.resume();
					}
				}
			});

			// Tween the height of the description area, if appropriate.
			// Otherwise, just hard set it or don't do anything, to minimize dead time between bids.
			const bidDescriptionHeight = bid.type === 'challenge' ? 80 : 45;
			if (index === 0) {
				this.tl.set(this.$.bidDescription, {
					height: bidDescriptionHeight
				});
			} else {
				const previousBidDescriptionHeight = bidsArray[index - 1].type === 'challenge' ? 80 : 45;
				if (previousBidDescriptionHeight !== bidDescriptionHeight) {
					this.tl.to(this.$.bidDescription, 0.333, {
						height: bidDescriptionHeight,
						ease: Power2.easeInOut
					});
				}
			}

			this.tl.call(() => {
				this.$['runName-content'].innerHTML = newRunName;
				this._typeAnim(this.$['runName-content']);
				this.bidType = bid.type;
			}, null, null, `+=${TYPE_INTERVAL}`);

			this.tl.call(() => {
				let newDescription = bid.description;
				const parts = newDescription.split('||');
				if (parts.length >= 2) {
					newDescription = parts[1];
				}

				this.$['bidDescription-content'].innerHTML = newDescription;
				this._typeAnim(this.$['bidDescription-content'], {splitType: 'chars,words,lines'});
			}, null, null, `+=${TYPE_INTERVAL}`);

			this.tl.fromTo(this.$.body, 0.333, {
				opacity: 0,
				y: -20
			}, {
				opacity: 1,
				y: 0,
				ease: Power1.easeOut,
				immediateRender: false
			});

			switch (bid.type) {
				case 'choice-binary': {
					this.tl.call(() => {
						this._typeAnim(this.shadowRoot.querySelector('#tug-left .tug-option-desc'));
					}, null, null, `+=${TYPE_INTERVAL}`);

					this.tl.call(() => {
						this._typeAnim(this.shadowRoot.querySelector('#tug-left .tug-option-total'));
					}, null, null, `+=${TYPE_INTERVAL}`);

					this.tl.call(() => {
						this._typeAnim(this.shadowRoot.querySelector('#tug-right .tug-option-total'));
					}, null, null, `+=${TYPE_INTERVAL}`);

					this.tl.call(() => {
						this._typeAnim(this.shadowRoot.querySelector('#tug-right .tug-option-desc'));
					}, null, null, `+=${TYPE_INTERVAL}`);

					const maxPips = CHALLENGE_BAR_WIDTH / BIG_PIP_WIDTH;
					let leftPips = Math.floor(maxPips * (bid.options[0].rawTotal / bid.rawTotal));
					leftPips = Math.min(leftPips, maxPips);
					let rightPips = Math.floor(maxPips * (bid.options[1].rawTotal / bid.rawTotal));
					rightPips = Math.min(rightPips, maxPips);
					const barDeltaDuration = Math.abs(leftPips - rightPips) * TUG_PIP_INTERVAL;

					// Only the left bar needs to be animated, right bar just takes remaining space.
					this.tl.add('barDelta', '+=0.4');
					this.tl.to(this.$['tug-bar-left'], barDeltaDuration, {
						width: leftPips * BIG_PIP_WIDTH,
						ease: Linear.easeNone
					}, 'barDelta');

					const deltaTweenProxy = {delta: 0};
					this.tl.to(deltaTweenProxy, barDeltaDuration, {
						onStart() {
							if (bid.options[0].rawTotal > bid.options[1].rawTotal) {
								this.$['tug-bar-center-label'].style.borderColor = '#ffaf31';
								this.$['tug-bar-center-label-leftarrow'].style.display = 'block';
							} else if (bid.options[0].rawTotal < bid.options[1].rawTotal) {
								this.$['tug-bar-center-label-rightarrow'].style.display = 'block';
								this.$['tug-bar-center-label'].style.borderColor = '#d778ff';
							}
						},
						onStartScope: this,
						delta: Math.abs(bid.options[0].rawTotal - bid.options[1].rawTotal),
						ease: Linear.easeNone,
						onUpdate() {
							this.$['tug-bar-center-label-delta'].innerText =
								deltaTweenProxy.delta.toLocaleString('en-US', {
									maximumFractionDigits: 2,
									style: 'currency',
									currency: 'USD'
								});
						},
						onUpdateScope: this
					}, 'barDelta');

					break;
				}

				case 'choice-many': {
					const rows = Array.from(this.$.choice.querySelectorAll('.choice-row'));

					rows.forEach(row => {
						this.tl.call(() => {
							this._typeAnim(row.querySelector('.choice-row-label'));
						}, null, null, `+=${TYPE_INTERVAL}`);

						this.tl.call(() => {
							this._typeAnim(row.querySelector('.choice-row-amount'), {splitType: 'chars'});
						}, null, null, `+=${TYPE_INTERVAL}`);
					});

					const maxPips = CHOICE_BAR_WIDTH / SMALL_PIP_WIDTH;
					this.tl.add('barFills', '+=0.3');
					rows.forEach((row, index) => {
						const option = bid.options[index];
						let numPips = Math.floor(maxPips * (option.rawTotal / bid.options[0].rawTotal));
						numPips = Math.min(numPips, maxPips);
						const barFillDuration = numPips * CHOICE_PIP_INTERVAL;

						this.tl.to(row.querySelector('.choice-row-meter-fill'), barFillDuration, {
							width: numPips * SMALL_PIP_WIDTH,
							modifiers: {
								width(width) {
									// Only increase width in increments of 4px.
									width = parseInt(width, 10);
									return `${width - (width % SMALL_PIP_WIDTH)}px`;
								}
							},
							ease: Linear.easeNone
						}, index === 0 ? 'barFills' : `barFills+=${CHOICE_PIP_INTERVAL * 2 * index}`);
					});

					this.tl.call(() => {
						const scrollHeight = this.$.choice.scrollHeight;
						const clientHeight = this.$.choice.clientHeight;
						const diff = scrollHeight - clientHeight;
						if (diff > 0) {
							const timePerPixel = 0.035;
							this.tl.pause();
							TweenLite.to(this.shadowRoot.querySelectorAll('.choice-row'), diff * timePerPixel, {
								y: -diff,
								ease: Linear.easeNone,
								delay: 1.5,
								onComplete() {
									this.tl.resume();
								},
								callbackScope: this
							});
						}
					});

					break;
				}

				case 'challenge': {
					this.tl.call(() => {
						this._typeAnim(this.$['challenge-goal'], {splitType: 'chars'});
					}, null, null, `+=${TYPE_INTERVAL}`);

					const maxPips = CHALLENGE_BAR_WIDTH / BIG_PIP_WIDTH;
					let numPips = Math.floor(maxPips * (bid.rawTotal / bid.rawGoal));
					numPips = Math.min(numPips, maxPips);
					const barFillDuration = numPips * CHALLENGE_PIP_INTERVAL;

					this.tl.add('barFill', '+=0.4');
					this.tl.to(this.$['challenge-bar-fill'], barFillDuration, {
						width: numPips * BIG_PIP_WIDTH,
						modifiers: {
							width(width) {
								// Only increase width in increments of 6px.
								width = parseInt(width, 10);
								return `${width - (width % BIG_PIP_WIDTH)}px`;
							}
						},
						ease: Linear.easeNone
					}, 'barFill');

					const rawTotalTweenProxy = {rawTotal: 0};
					this.tl.to(rawTotalTweenProxy, barFillDuration, {
						rawTotal: bid.rawTotal,
						ease: Linear.easeNone,
						onUpdate() {
							const formattedTotal = rawTotalTweenProxy.rawTotal.toLocaleString('en-US', {
								maximumFractionDigits: 0,
								minimumFractionDigits: 0
							});
							this.$['challenge-bar-fill-label-text'].innerHTML = bid.isBitsChallenge ?
								`<img id="challenge-bar-fill-label-text-bitsIcon" width="26" src="img/bitsicon.png">${formattedTotal}` :
								`$${formattedTotal}`;
						},
						onUpdateScope: this
					}, 'barFill');

					break;
				}

				default: {
					const errorMsg = `Unexpected bid type "${bid.type}" (ID: ${bid.id})`;
					nodecg.log.error(errorMsg);
				}
			}

			// Give the bid some time to show
			this.tl.to({}, displayDuration, {
				onComplete() {
					// If this is the last bid, be kind, rewind.
					if (index === bidsArray.length - 1) {
						this.replaceBottomText('gamesdonequick.com/donate');
					}
				},
				callbackScope: this
			});

			this.tl.to(this.$.body, 0.333, {
				opacity: 0,
				y: 15,
				ease: Power1.easeIn
			});
		}

		_formatRunName(runName) {
			if (!runName || typeof runName !== 'string') {
				return '?';
			}

			return runName.replace('\\n', ' ');
		}

		_calcBidsToDisplay(bidsArray) {
			const bidsToDisplay = [];
			bidsArray.forEach(bid => {
				// Don't show closed bids in the automatic rotation.
				if (bid.state.toLowerCase() === 'closed') {
					return;
				}

				// We cant handle choice-many bids that have less than 3 options, which is totally valid
				// but we didn't think about. Just don't show them.
				if (bid.type === 'choice-many' && bid.options.length < 3) {
					return;
				}

				// If we have already have our three bids determined, we still need to check
				// if any of the remaining bids are for the same speedrun as the third bid.
				// This ensures that we are never displaying a partial list of bids for a given speedrun.
				if (bidsToDisplay.length < 3) {
					bidsToDisplay.push(bid);
				} else if (bid.speedrun === bidsToDisplay[bidsToDisplay.length - 1].speedrun) {
					bidsToDisplay.push(bid);
				}
			});
			return bidsToDisplay;
		}

		_typeAnim($el, {splitType = 'chars,words'} = {}) {
			const tl = new TimelineLite();
			const split = new SplitText($el, {
				type: splitType,
				charsClass: 'character style-scope gdq-break-bids',
				linesClass: 'line style-scope gdq-break-bids'
			});
			$el.split = split;

			switch (splitType) {
				case 'chars':
					tl.staggerFrom(split.chars, 0.001, {
						visibility: 'hidden'
					}, TYPE_INTERVAL);

					break;
				case 'chars,words':
				case 'chars,words,lines':
					split.words.forEach(word => {
						tl.staggerFrom(word.children, 0.001, {
							visibility: 'hidden'
						}, TYPE_INTERVAL);

						tl.to(EMPTY_OBJ, TYPE_INTERVAL, EMPTY_OBJ);
					});
					break;
				default:
					throw new Error(`Unexpected splitType "${splitType}"`);
			}

			return tl;
		}

		_untypeAnim($el) {
			return new Promise(resolve => {
				if (!$el.split) {
					return setTimeout(resolve, 0);
				}

				const tl = new TimelineLite({
					onComplete: resolve
				});

				const split = $el.split;

				if (split.words) {
					split.words.forEach(word => {
						tl.staggerTo(word.children, 0.001, {
							visibility: 'hidden'
						}, TYPE_INTERVAL);

						tl.to(EMPTY_OBJ, TYPE_INTERVAL, EMPTY_OBJ);
					});
				} else {
					tl.staggerFrom(split.chars, 0.001, {
						visibility: 'hidden'
					}, TYPE_INTERVAL);
				}

				return tl;
			});
		}
	}

	customElements.define(GdqBreakBids.is, GdqBreakBids);
})();
