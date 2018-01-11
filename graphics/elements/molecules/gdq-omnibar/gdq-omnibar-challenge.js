(function () {
	'use strict';

	const RIGHT_TIME_PER_PIXEL = 0.00107;
	const LEFT_TIME_PER_PIXEL = 0.00107;
	const PROGRESS_FILL_OFFSET = 10;
	const TAIL_CHEVRON_WIDTH = 6;
	const DIRECTION_CHANGE_DELAY = 0.1167;

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqOmnibarChallenge extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-challenge';
		}

		static get properties() {
			return {
				bid: Object
			};
		}

		ready() {
			super.ready();
			TweenLite.set(this.$.tailChevron, {opacity: 0});
			TweenLite.set(this.$.body, {opacity: 0});
			TweenLite.set(this.$.total, {opacity: 0});
			TweenLite.set(this.$.goal, {opacity: 0});
		}

		enter() {
			let progressPercentage = this.bid.rawTotal / this.bid.rawGoal;
			progressPercentage = Math.min(progressPercentage, 1); // Clamp to 1 max.
			progressPercentage = Math.max(progressPercentage, 0); // Clamp to 0 min.

			const revealTweenWidth = this.$.body.clientWidth - this.$.tailChevron.clientWidth + PROGRESS_FILL_OFFSET;
			this._revealTweenWidth = revealTweenWidth;
			const progressBlockWidth = this.$.progressBlock.clientWidth;
			const tl = new TimelineLite();
			let didFlickerGoalBlock = false;

			/* This mess of bullshit is how we get the animated fill to be clipped how we want. */
			const progressFillGroup = this.$.progressFill.svgDoc.group();
			const progressFillClip = this.$.progressBlock.arrowBlock.clone();
			progressFillClip.attr({filter: 'none'});
			TweenLite.set(this.$.progressFill.arrowBlock.node, {x: '-100%'});
			this.$.progressFill.arrowBlock.before(progressFillClip);
			this.$.progressFill.arrowBlock.before(progressFillGroup);
			this.$.progressFill.arrowBlock.addTo(progressFillGroup);
			progressFillGroup.clipWith(progressFillClip);
			/* End mess of bullshit. */

			tl.set(this.$.tailChevron, {opacity: 1});
			tl.call(() => {
				this.$.goalBlock.arrowBlock.attr({'fill-opacity': 0});
			});

			tl.fromTo(this.$.tailChevron.chevron.node, 0.334, {
				drawSVG: '0%'
			}, {
				drawSVG: '100%',
				ease: Linear.easeNone
			});

			tl.from(this.$.tailChevron.chevron.node, 0.2167, {
				fill: 'transparent'
			});

			tl.addLabel('slideRight', `-=${1 / 60}`);
			tl.to(this.$.tailChevron, revealTweenWidth * RIGHT_TIME_PER_PIXEL, {
				x: revealTweenWidth,
				ease: Sine.easeIn
			}, 'slideRight');

			tl.set(this.$.body, {
				clipPath: `inset(0 -13px 0 ${revealTweenWidth}px)`,
				opacity: 1
			});

			tl.addLabel('reveal', `+=${DIRECTION_CHANGE_DELAY}`);
			tl.to(this.$.tailChevron, revealTweenWidth * LEFT_TIME_PER_PIXEL, {
				x: 0,
				ease: 'BidwarOptionReveal',
				callbackScope: this,
				onUpdate() {
					// Flicker the goal block shortly after it has been fully revealed.
					if (!didFlickerGoalBlock && this.$.tailChevron._gsTransform.x <= progressBlockWidth) {
						didFlickerGoalBlock = true;
						MaybeRandom.createTween({
							target: {},
							propName: 'placeholder',
							duration: 0.465,
							delay: 0.1,
							ease: Power4.easeIn,
							start: {probability: 1, normalValue: 0},
							end: {probability: 0, normalValue: 1},
							onUpdate: randomValue => {
								this.$.goal.style.opacity = randomValue;
								this.$.goalBlock.arrowBlock.attr({'fill-opacity': randomValue});
							}
						});
					}
				}
			}, 'reveal');
			tl.to(this.$.body, revealTweenWidth * LEFT_TIME_PER_PIXEL, {
				clipPath: 'inset(0 -13px 0 0px)',
				ease: 'BidwarOptionReveal',
				callbackScope: this,
				onComplete() {
					TweenLite.to(this.$.body, 0.18, {
						clipPath: 'inset(0 -13px)'
					});
				}
			}, 'reveal');

			tl.set(this.$.tailChevron, {'--atom-chevron-background': 'transparent'});

			const progressFillWidth = this.$.progressFill.arrowBlock.node.getBoundingClientRect().width - PROGRESS_FILL_OFFSET;
			const tailChevronEndX = progressFillWidth * progressPercentage;
			this._progressTweenDuration = progressFillWidth * progressPercentage * RIGHT_TIME_PER_PIXEL;
			tl.addLabel('fillProgress');
			tl.to(this.$.tailChevron, this._progressTweenDuration, {
				x: tailChevronEndX,
				ease: Power2.easeInOut,
				callbackScope: this,
				onUpdate() {
					if (this.$.tailChevron._gsTransform.x >= PROGRESS_FILL_OFFSET) {
						TweenLite.set(this.$.progressFill.arrowBlock.node, {
							x: this.$.tailChevron._gsTransform.x + PROGRESS_FILL_OFFSET
						});
					}
				}
			}, 'fillProgress');

			const totalTextCanFitOnLeft = (tailChevronEndX - 7) >= (this.$.total.$.gradientFill.clientWidth + 24);
			if (totalTextCanFitOnLeft) {
				this.$.total.align = 'right';
				TweenLite.set(this.$.total, {left: tailChevronEndX - 6});
			} else {
				TweenLite.set(this.$.total, {left: tailChevronEndX + this.$.total.clientWidth + 25});
			}

			tl.add(MaybeRandom.createTween({
				target: this.$.total.style,
				propName: 'opacity',
				duration: 0.465,
				ease: Power4.easeIn,
				start: {probability: 1, normalValue: 0},
				end: {probability: 0, normalValue: 1}
			}));

			return tl;
		}

		exit() {
			const tl = new TimelineLite();

			// Things seem to ignore the clip path when they have a will-change style.
			tl.set(this.$.goal, {willChange: 'unset'});
			tl.set(this.$.total, {willChange: 'unset'});

			tl.addLabel('concealFill', '+=0.1'); // Give the will-change sets above time to apply.
			tl.to(this.$.tailChevron, this._progressTweenDuration, {
				x: TAIL_CHEVRON_WIDTH,
				ease: Power2.easeInOut,
				callbackScope: this,
				onUpdate() {
					if (this.$.tailChevron._gsTransform.x >= PROGRESS_FILL_OFFSET) {
						TweenLite.set(this.$.progressFill.arrowBlock.node, {
							x: this.$.tailChevron._gsTransform.x + PROGRESS_FILL_OFFSET
						});
					}
				}
			}, 'concealFill');

			tl.set(this.$.tailChevron, {clearProps: '--atom-chevron-background'});
			tl.set(this.$.body, {clipPath: 'inset(0 -13px 0 0px)'});

			tl.addLabel('concealAll', `+=${DIRECTION_CHANGE_DELAY}`);
			const concealTweenWidth = this._revealTweenWidth + TAIL_CHEVRON_WIDTH;
			tl.to(this.$.tailChevron, concealTweenWidth * RIGHT_TIME_PER_PIXEL, {
				x: concealTweenWidth,
				ease: Sine.easeInOut
			}, 'concealAll');
			tl.to(this.$.body, concealTweenWidth * RIGHT_TIME_PER_PIXEL, {
				clipPath: `inset(0 -13px 0 ${concealTweenWidth}px)`,
				ease: Sine.easeInOut
			}, 'concealAll');

			tl.add(MaybeRandom.createTween({
				target: this.style,
				propName: 'opacity',
				duration: 0.465,
				start: {probability: 1, normalValue: 1},
				end: {probability: 0, normalValue: 0}
			}));

			return tl;
		}

		render() {
			this.$.goalBlock.render(); // Must be rendered before #progressBlock.
			this.$.tailChevron.render();
			this.$.progressBlock.render({useContentWidth: false});
			this.$.separatorChevron.render();

			this.$.progressFill.render({useContentWidth: false}); // Must be rendered after #progressBlock.

			// Set the progressFill svgDoc to be the same size as the progressBlock svgDoc.
			this.$.progressFill.svgDoc.size(
				this.$.progressBlock.svgDoc.width(),
				this.$.progressBlock.svgDoc.height()
			);

			// Copy the points from the progressBlock shape to the progressFill shape.
			// This ensures that these shapes are identical.
			this.$.progressFill.arrowBlock.attr({
				points: this.$.progressBlock.arrowBlock.attr('points')
			});
		}
	}

	customElements.define(GdqOmnibarChallenge.is, GdqOmnibarChallenge);
})();
