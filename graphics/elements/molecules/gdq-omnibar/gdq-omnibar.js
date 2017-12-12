(function () {
	'use strict';

	/* Minimum amount of content overflow, in pixels, required before the scrolling behavior kicks in.
	 * We have this because if the content just scrolls a few pixels, it looks kinda bad.
	 * We've found it's better to just not scroll it at all in those cases, and let it
	 * cut off those few pixels. */
	const MIN_CONTENT_SCROLL_DISTANCE = 3;

	// How much time, in seconds, to spend scrolling on a single pixel.
	const CONTENT_SCROLL_TIME_PER_PIXEL = 0.002;

	// The opacity to set on list items which are partially occluded by the total.
	const OCCLUDED_OPACITY = 0.25;

	// Used by the record tracker functionality.
	const AGDQ17_TOTAL = 2222790.52;
	window.AGDQ17_TOTAL = AGDQ17_TOTAL;

	// Configuration consts.
	const DISPLAY_DURATION = nodecg.bundleConfig.displayDuration;
	const SCROLL_HOLD_DURATION = nodecg.bundleConfig.omnibar.scrollHoldDuration;

	// Replicants.
	const currentBids = nodecg.Replicant('currentBids');
	const currentLayout = nodecg.Replicant('gdq:currentLayout');
	const currentPrizes = nodecg.Replicant('currentPrizes');
	const currentRun = nodecg.Replicant('currentRun');
	const nextRun = nodecg.Replicant('nextRun');
	const recordTrackerEnabled = nodecg.Replicant('recordTrackerEnabled');
	const schedule = nodecg.Replicant('schedule');
	const total = nodecg.Replicant('total');

	// State variables.
	let contentEnterCounter = 0;
	let contentExitCounter = 0;

	class GdqOmnibar extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar';
		}

		ready() {
			super.ready();

			const replicants = [
				currentBids,
				currentLayout,
				currentPrizes,
				currentRun,
				nextRun,
				recordTrackerEnabled,
				schedule,
				total
			];

			let numDeclared = 0;
			replicants.forEach(replicant => {
				replicant.once('change', () => {
					numDeclared++;

					// Start the loop once all replicants are declared;
					if (numDeclared >= replicants.length) {
						Polymer.RenderStatus.beforeNextRender(this, this.run);
						total.on('change', (newVal, oldVal) => {
							if (oldVal && newVal.raw >= AGDQ17_TOTAL && oldVal.raw < AGDQ17_TOTAL) {
								this.alertNewRecord();
							}
						});
					}
				});
			});
		}

		run() {
			const self = this;
			const parts = [
				// this.showRecordTracker,
				this.showCTA,
				this.showUpNext,
				this.showChallenges,
				this.showChoices,
				this.showCurrentPrizes
			];

			function processNextPart() {
				if (parts.length > 0) {
					const part = parts.shift().bind(self);
					promisifyTimeline(part())
						.then(processNextPart)
						.catch(error => {
							nodecg.log.error('Error when running main loop:', error);
						});
				} else {
					self.run();
				}
			}

			function promisifyTimeline(tl) {
				return new Promise(resolve => {
					tl.call(resolve, null, null, '+=0.03');
				});
			}

			processNextPart();
		}

		alertNewRecord() {
			const tl = new TimelineLite();

			/* Disabled for now.
			// Enter
			tl.set(this.$['newRecord-text'], {y: '-100%'});
			tl.set(this.$.newRecord, {visibility: 'visible'});
			tl.to([this.$.main, this.$.label], 0.25, {
				opacity: 0,
				ease: Power1.easeIn
			});
			tl.add(this.$['newRecord-bg'].enter('above'), 0.1);
			tl.to(this.$['newRecord-text'], 0.334, {
				y: '0%',
				ease: Power1.easeInOut
			}, 0.2);

			// Exit
			tl.addLabel('exit', '+=20');
			tl.add(this.$['newRecord-bg'].exit('below'), 'exit');
			tl.to(this.$['newRecord-text'], 0.334, {
				y: '100%',
				ease: Power1.easeInOut
			}, 'exit+=0.2');
			tl.to([this.$.main, this.$.label], 0.25, {
				opacity: 1,
				ease: Power1.easeOut
			}, 'exit+=0.2'); */

			return tl;
		}

		/**
		 * Creates an animation timeline for showing the label.
		 * @param {String} text - The text to show.
		 * @param {LabelShowAndChangeOptions} [options={}] - Options for this animation.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		showLabel(text, options = {}) {
			const tl = new TimelineLite();
			options.flagHoldDuration = DISPLAY_DURATION;
			if (this.$.label._showing) {
				tl.add(this.$.label.change(text, options));
			} else {
				tl.add(this.$.label.show(text, options));
			}

			return tl;
		}

		/**
		 * Creates an animation timeline for hiding the label.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		hideLabel() {
			return this.$.label.hide();
		}

		setMainContent(tl, elements) {
			tl.to({}, 0.03, {}); // Safety buffer to avoid issues where GSAP might skip our `call`.
			tl.call(() => {
				tl.pause();
				this.$['main-content'].innerHTML = '';
				elements.forEach(element => {
					this.$['main-content'].appendChild(element);
				});
				Polymer.flush(); // Might not be necessary, but better safe than sorry.
				Polymer.RenderStatus.afterNextRender(this, () => {
					Polymer.flush(); // Might not be necessary, but better safe than sorry.
					requestAnimationFrame(() => {
						tl.resume(null, false);
					});
				});
			});
		}

		showMainContent(tl, elements) {
			let contentOverflowAmount;
			const contentEnterLabel = `contentEnter${contentEnterCounter}`;
			const afterContentEnterLabel = `afterContentEnter${contentEnterCounter}`;
			contentEnterCounter++;

			const occludedElements = new Set();
			const observerMap = new Map();
			const observers = elements.map(element => {
				TweenLite.set(element, {opacity: OCCLUDED_OPACITY});
				const observer = new IntersectionObserver(entries => {
					if (!entries || entries.length < 1) {
						return;
					}

					const entry = entries[0];
					const occluded = entry.intersectionRatio < 1;
					if (occluded) {
						occludedElements.add(element);
					} else {
						occludedElements.delete(element);
					}

					TweenLite.to(element, 0.224, {
						opacity: occluded ? OCCLUDED_OPACITY : 1,
						ease: Sine.easeInout
					});
				}, {
					root: this.$.main,
					rootMargin: '0px',
					threshold: [0, 1]
				});

				observer.observe(element);
				observerMap.set(element, observer);
				return observer;
			});

			tl.addLabel(contentEnterLabel);
			tl.call(() => {
				const mainWidth = this.$.main.clientWidth;
				const mainContentWidth = this.$['main-content'].clientWidth;
				contentOverflowAmount = mainContentWidth - mainWidth;

				if (contentOverflowAmount < MIN_CONTENT_SCROLL_DISTANCE) {
					TweenLite.set(Array.from(occludedElements), {opacity: 1});
					occludedElements.clear();
				}

				const contentEnterAnim = new TimelineLite();
				elements.forEach((element, index) => {
					contentEnterAnim.add(element.enter(), index * 0.1134);
				});
				tl.shiftChildren(contentEnterAnim.duration(), true, tl.getLabelTime(afterContentEnterLabel));
				tl.add(contentEnterAnim, contentEnterLabel);
			}, null, null, contentEnterLabel);
			tl.addLabel(afterContentEnterLabel, '+=0.03');

			// Display the content cards long enough for people to read.
			// Scroll the list of cards if necessary to show them all.
			tl.call(() => {
				tl.pause();

				if (contentOverflowAmount < MIN_CONTENT_SCROLL_DISTANCE || occludedElements.length <= 0) {
					setTimeout(() => {
						continueTimeline();
					}, DISPLAY_DURATION * 1000);
					return;
				}

				const removeLeadingItem = () => {
					if (occludedElements.size <= 0) {
						continueTimeline();
						return;
					}

					const firstElement = this.$['main-content'].firstChild;
					const remainderElements = Array.from(this.$['main-content'].childNodes).slice(1);
					const tl = new TimelineLite();
					tl.add(firstElement.exit());
					tl.to(remainderElements, firstElement.clientWidth * CONTENT_SCROLL_TIME_PER_PIXEL, {
						x: -firstElement.clientWidth - 6, // This "6" is the list item margin.
						ease: Power2.easeInOut
					});
					tl.call(() => {
						this.$['main-content'].removeChild(firstElement);
						observerMap.get(firstElement).disconnect();
						occludedElements.delete(firstElement);
						TweenLite.set(remainderElements, {x: 0});
					});
					tl.call(removeLeadingItem, null, null, SCROLL_HOLD_DURATION);
				};

				setTimeout(() => {
					removeLeadingItem();
				}, SCROLL_HOLD_DURATION * 1000);
			}, null, null, afterContentEnterLabel);

			function continueTimeline() {
				observers.forEach(observer => observer.disconnect());
				tl.resume(null, false);
			}
		}

		hideMainContent(tl, elements) {
			const contentExitLabel = `contentExit${contentExitCounter}`;
			const afterContentExitLabel = `afterContentExit${contentExitCounter}`;
			contentExitCounter++;

			// Exit the content cards.
			tl.add(contentExitLabel, '+=0.03');
			tl.call(() => {
				const contentExitAnim = new TimelineLite();
				elements.slice(0).reverse().forEach((element, index) => {
					contentExitAnim.add(element.exit(), index * 0.3134);
				});
				tl.shiftChildren(contentExitAnim.duration(), true, tl.getLabelTime(afterContentExitLabel));
				tl.add(contentExitAnim, contentExitLabel);
			}, null, null, contentExitLabel);
			tl.add(afterContentExitLabel, '+=0.03');
			tl.set(this.$['main-content'], {x: 0}, afterContentExitLabel);
		}

		showRecordTracker() {
			const tl = new TimelineLite();

			// If we have manually disabled this feature, return.
			if (!recordTrackerEnabled.value) {
				return tl;
			}

			// If we have passed the previous event's donation total, return.
			if (total.value.raw > AGDQ17_TOTAL) {
				return tl;
			}

			/* Disabled for now.
			const elements = [document.createElement('gdq-omnibar-record')];

			this.setMainContent(tl, elements);

			tl.add(this.showLabel('RECORD TRACKER', '20px', {
				startColor: '#76ca7c',
				endColor: '#26952d'
			}), '+=0.03');

			this.showMainContent(tl, elements);
			this.hideMainContent(tl, elements); */

			return tl;
		}

		showCTA() {
			const tl = new TimelineLite();
			tl.add(this.hideLabel());
			tl.add(this.$.cta.show(DISPLAY_DURATION));
			return tl;
		}

		showUpNext() {
			const tl = new TimelineLite();

			let upNextRun = nextRun.value;
			if (currentLayout.value === 'break' || currentLayout.value === 'interview') {
				upNextRun = currentRun.value;
			}

			// If we're at the final run, bail out and just skip straight to showing the next item in the rotation.
			if (!upNextRun) {
				return tl;
			}

			const upcomingRuns = [upNextRun];
			schedule.value.some(item => {
				if (item.type !== 'run') {
					return false;
				}

				if (item.order <= upNextRun.order) {
					return false;
				}

				upcomingRuns.push(item);
				return upcomingRuns.length >= 3;
			});

			const elements = upcomingRuns.map(run => {
				const element = document.createElement('gdq-omnibar-run');
				element.run = run;
				return element;
			});

			this.setMainContent(tl, elements);

			tl.add(this.showLabel('Up Next', {
				avatarIconName: 'upnext',
				flagColor: '#7EF860',
				ringColor: '#50A914'
			}), '+=0.03');

			this.showMainContent(tl, elements);
			this.hideMainContent(tl, elements);

			return tl;
		}

		showChallenges() {
			const tl = new TimelineLite();

			// If there's no bids whatsoever, bail out.
			if (currentBids.value.length < 0) {
				return tl;
			}

			// Figure out what bids to display in this batch
			const bidsToDisplay = [];
			currentBids.value.forEach(bid => {
				// Don't show closed bids in the automatic rotation.
				if (bid.state.toLowerCase() === 'closed') {
					return;
				}

				// Only show challenges.
				if (bid.type !== 'challenge') {
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

			// If there's no challenges to display, bail out.
			if (bidsToDisplay.length <= 0) {
				return tl;
			}

			const elements = bidsToDisplay.map(bid => {
				const element = document.createElement('gdq-omnibar-bid');
				element.bid = bid;
				return element;
			});

			this.setMainContent(tl, elements);

			tl.add(this.showLabel('Challenges', {
				avatarIconName: 'challenges',
				flagColor: '#82EFFF',
				ringColor: '#FFFFFF'
			}), '+=0.03');

			this.showMainContent(tl, elements);
			this.hideMainContent(tl, elements);

			return tl;
		}

		showChoices() {
			const tl = new TimelineLite();

			// If there's no bids whatsoever, bail out.
			if (currentBids.value.length < 0) {
				return tl;
			}

			// Figure out what bids to display in this batch
			const bidsToDisplay = [];

			currentBids.value.forEach(bid => {
				// Don't show closed bids in the automatic rotation.
				if (bid.state.toLowerCase() === 'closed') {
					return;
				}

				// Only show choices.
				if (bid.type !== 'choice-binary' && bid.type !== 'choice-many') {
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

			// If there's no challenges to display, bail out.
			if (bidsToDisplay.length <= 0) {
				return tl;
			}

			// Loop over each bid and queue it up on the timeline
			bidsToDisplay.forEach((bid, index) => {
				// Show at most 4 options.
				const elements = bid.options.slice(0, 4).map((option, index) => {
					const element = document.createElement('gdq-omnibar-bid');
					element.bid = option;
					element.index = index;

					// Options that aren't the first option show their delta to the leader options.
					if (index > 0 && bid.options[0].rawTotal > option.rawTotal) {
						element.delta = '-$' + (bid.options[0].rawTotal - option.rawTotal).toLocaleString('en-US');
					}

					return element;
				});

				if (elements.length <= 0) {
					const placeholder = document.createElement('gdq-omnibar-bid');
					placeholder.bid = {};
					elements.push(placeholder);
				}

				this.setMainContent(tl, elements);

				// First bid shows the label.
				if (index === 0) {
					tl.add(this.showLabel('Bid Wars', {
						avatarIconName: 'bidwars',
						flagColor: '#FF4D4A',
						ringColor: '#FF4D4D'
					}), '+=0.03');
				}

				this.showMainContent(tl, elements);
				this.hideMainContent(tl, elements);
			});

			return tl;
		}

		showCurrentPrizes() {
			const tl = new TimelineLite();

			// No prizes to show? Bail out.
			if (currentPrizes.value.length <= 0) {
				return tl;
			}

			const specialPrizesToDisplayLast = [];
			const prizesToDisplay = currentPrizes.value.filter(prize => {
				if (prize.id === 1668 || // Custom Built Corsair PC
					prize.id === 1669) { // Eighth Generation Console Bundle
					specialPrizesToDisplayLast.push(prize);
					return false;
				}

				return true;
			}).concat(specialPrizesToDisplayLast);

			const elements = prizesToDisplay.map(prize => {
				const element = document.createElement('gdq-omnibar-prize');
				element.prize = prize;
				return element;
			});

			this.setMainContent(tl, elements);

			tl.add(this.showLabel('Prizes', {
				avatarIconName: 'prizes',
				flagColor: '#FF70C8',
				ringColor: '#EC0793'
			}), '+=0.03');

			this.showMainContent(tl, elements);
			this.hideMainContent(tl, elements);

			return tl;
		}
	}

	customElements.define(GdqOmnibar.is, GdqOmnibar);
})();
