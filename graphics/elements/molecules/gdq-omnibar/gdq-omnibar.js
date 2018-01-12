(function () {
	'use strict';

	const MILESTONES = [
		{name: 'AGDQ 2014', total: 1031665.50},
		{name: 'AGDQ 2015', total: 1576085.00},
		{name: 'AGDQ 2016', total: 1216309.02},
		{name: 'SGDQ 2016', total: 1294139.50},
		{name: 'AGDQ 2017', total: 2222790.52},
		{name: 'SGDQ 2017', total: 1792342.37}
	].sort((a, b) => {
		return a.total - b.total;
	}).map((milestone, index, array) => {
		const precedingMilestone = index > 0 ?
			array[index - 1] :
			{name: 'none', total: 1000000};

		const succeedingMilestone = array[index + 1];

		// Can't use spread operator in this method because of https://github.com/Polymer/polymer-cli/issues/888
		const modifiedMilestone = Object.assign({}, milestone, {
			precedingMilestone,
			succeedingMilestone
		});
		Object.freeze(modifiedMilestone);
		return modifiedMilestone;
	});
	Object.freeze(MILESTONES);

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

	class GdqOmnibar extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar';
		}

		static get properties() {
			return {
				importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
				milestones: {
					type: Array,
					readOnly: true,
					value: MILESTONES
				}
			};
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
					}
				});
			});
		}

		run() {
			const self = this;

			// For development, comment out whichever parts you don't want to see right now.
			const parts = [
				this.showCTA,
				this.showUpNext,
				this.showChallenges,
				this.showChoices,
				this.showCurrentPrizes,
				this.showMilestoneProgress
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

		/**
		 * Creates an animation timeline for showing the label.
		 * @param {String} text - The text to show.
		 * @param {LabelShowAndChangeOptions} [options={}] - Options for this animation.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		showLabel(text, options = {}) {
			const tl = new TimelineLite();
			options.flagHoldDuration = Math.max(DISPLAY_DURATION / 2, 5);
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

		setContent(tl, element) {
			tl.to({}, 0.03, {}); // Safety buffer to avoid issues where GSAP might skip our `call`.
			tl.call(() => {
				tl.pause();
				this.$.content.innerHTML = '';
				this.$.content.appendChild(element);
				Polymer.flush(); // Might not be necessary, but better safe than sorry.
				Polymer.RenderStatus.afterNextRender(this, () => {
					Polymer.flush(); // Might not be necessary, but better safe than sorry.
					requestAnimationFrame(() => {
						tl.resume(null, false);
					});
				});
			});
		}

		showContent(tl, element) {
			tl.to({}, 0.03, {}); // Safety buffer to avoid issues where GSAP might skip our `call`.
			tl.call(() => {
				tl.pause();
				const elementEntranceAnim = element.enter(DISPLAY_DURATION, SCROLL_HOLD_DURATION);
				elementEntranceAnim.call(tl.resume, null, tl);
			});
		}

		hideContent(tl, element) {
			tl.to({}, 0.03, {}); // Safety buffer to avoid issues where GSAP might skip our `call`.
			tl.call(() => {
				tl.pause();
				const elementExitAnim = element.exit();
				elementExitAnim.call(tl.resume, null, tl);
			});
		}

		showCTA() {
			const tl = new TimelineLite();
			tl.add(this.hideLabel());
			tl.call(() => {
				this.$.content.innerHTML = '';
			});
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
				return upcomingRuns.length >= 4;
			});

			const listElement = document.createElement('gdq-omnibar-list');
			upcomingRuns.forEach((run, index) => {
				const element = document.createElement('gdq-omnibar-run');
				element.run = run;
				if (index === 0) {
					element.first = true;
				}
				listElement.appendChild(element);
			});

			this.setContent(tl, listElement);

			tl.add(this.showLabel('Up Next', {
				avatarIconName: 'upnext',
				flagColor: '#7EF860',
				ringColor: '#50A914'
			}), '+=0.03');

			this.showContent(tl, listElement);
			this.hideContent(tl, listElement);

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

			const containerElement = document.createElement('gdq-omnibar-challenges');
			containerElement.challenges = bidsToDisplay;

			this.setContent(tl, containerElement);

			tl.add(this.showLabel('Challenges', {
				avatarIconName: 'challenges',
				flagColor: '#82EFFF',
				ringColor: '#FFFFFF'
			}), '+=0.03');

			this.showContent(tl, containerElement);
			this.hideContent(tl, containerElement);

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

			// If there's no choices to display, bail out.
			if (bidsToDisplay.length <= 0) {
				return tl;
			}

			const containerElement = document.createElement('gdq-omnibar-bidwars');
			containerElement.bidWars = bidsToDisplay;

			this.setContent(tl, containerElement);

			tl.add(this.showLabel('Bid Wars', {
				avatarIconName: 'bidwars',
				flagColor: '#FF4D4A',
				ringColor: '#FF4D4D'
			}), '+=0.03');

			this.showContent(tl, containerElement);
			this.hideContent(tl, containerElement);

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
				if (prize.id === 1892) {
					specialPrizesToDisplayLast.push(prize);
					return false;
				}

				return true;
			}).concat(specialPrizesToDisplayLast);

			const listElement = document.createElement('gdq-omnibar-list');
			prizesToDisplay.forEach(prize => {
				const element = document.createElement('gdq-omnibar-prize');
				element.prize = prize;
				listElement.appendChild(element);
			});

			this.setContent(tl, listElement);

			tl.add(this.showLabel('Prizes', {
				avatarIconName: 'prizes',
				flagColor: '#FF70C8',
				ringColor: '#EC0793'
			}), '+=0.03');

			this.showContent(tl, listElement);
			this.hideContent(tl, listElement);

			return tl;
		}

		showMilestoneProgress() {
			const tl = new TimelineLite();

			// If we have manually disabled this feature, return.
			if (!recordTrackerEnabled.value) {
				return tl;
			}

			// If the current total is < $1M, return.
			if (total.value.raw < 1000000) {
				return tl;
			}

			const currentMilestone = MILESTONES.find(milestone => {
				return total.value.raw < milestone.total;
			});

			// If we are out of milestones to show, return.
			if (!currentMilestone) {
				return tl;
			}

			const milestoneTrackerElement = document.createElement('gdq-omnibar-milestone-tracker');
			milestoneTrackerElement.milestone = currentMilestone;
			milestoneTrackerElement.currentTotal = total.value.raw;

			this.setContent(tl, milestoneTrackerElement);

			tl.add(this.showLabel('Milestone Progress', {
				avatarIconName: 'milestones',
				flagColor: '#FFB800',
				ringColor: '#E7EC07'
			}), '+=0.03');

			this.showContent(tl, milestoneTrackerElement);
			this.hideContent(tl, milestoneTrackerElement);

			return tl;
		}
	}

	customElements.define(GdqOmnibar.is, GdqOmnibar);
})();
