(function () {
	'use strict';

	const RIGHT_TIME_PER_PIXEL = 0.00157;
	const LEFT_TIME_PER_PIXEL = 0.00157;
	const TAIL_CHEVRON_WIDTH = 6;

	CustomEase.create('BidwarOptionReveal', 'M0,0 C0.166,0.166 0.234,1 1,1');

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqOmnibarBidwarOption extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-bidwar-option';
		}

		static get properties() {
			return {
				bid: Object,
				placeholder: {
					type: Boolean,
					reflectToAttribute: true
				},
				winning: {
					type: Boolean,
					reflectToAttribute: true
				}
			};
		}

		ready() {
			super.ready();
			TweenLite.set(this.$.tailChevron, {opacity: 0});
			TweenLite.set(this.$.body, {opacity: 0});
			TweenLite.set(this.$.total, {opacity: 0});
		}

		enter() {
			const tl = new TimelineLite();
			const revealTweenWidth = this.$.body.clientWidth - this.$.tailChevron.clientWidth + TAIL_CHEVRON_WIDTH;
			this._revealTweenWidth = revealTweenWidth;

			tl.set(this.$.tailChevron, {opacity: 1});
			tl.call(() => {
				this.$.totalBlock.arrowBlock.attr({'fill-opacity': 0});
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

			tl.addLabel('reveal', '+=0.1167');
			tl.to(this.$.tailChevron, revealTweenWidth * LEFT_TIME_PER_PIXEL, {
				x: 0,
				ease: 'BidwarOptionReveal'
			}, 'reveal');
			tl.to(this.$.body, revealTweenWidth * LEFT_TIME_PER_PIXEL, {
				clipPath: 'inset(0 -13px 0 0px)',
				ease: 'BidwarOptionReveal'
			}, 'reveal');

			tl.addLabel('flickerTotal', '-=0.667');
			tl.add(MaybeRandom.createTween({
				target: {},
				propName: 'placeholder',
				duration: 0.465,
				ease: Power4.easeIn,
				start: {probability: 1, normalValue: 0},
				end: {probability: 0, normalValue: 1},
				onUpdate: randomValue => {
					this.$.total.style.opacity = randomValue;
					this.$.totalBlock.arrowBlock.attr({'fill-opacity': randomValue});
				}
			}), 'flickerTotal');

			return tl;
		}

		exit() {
			const tl = new TimelineLite();

			// The total seems to ignore the clip path when it has a will-change style.
			tl.set(this.$.total, {willChange: 'unset'});

			tl.addLabel('conceal', '+=0.1');
			tl.to(this.$.tailChevron, this._revealTweenWidth * RIGHT_TIME_PER_PIXEL, {
				x: this._revealTweenWidth,
				ease: Sine.easeInOut
			}, 'conceal');
			tl.to(this.$.body, this._revealTweenWidth * RIGHT_TIME_PER_PIXEL, {
				clipPath: `inset(0 -13px 0 ${this._revealTweenWidth}px)`,
				ease: Sine.easeInOut
			}, 'conceal');

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
			this.$.tailChevron.render();
			this.$.labelBlock.render();
			this.$.totalBlock.render();
		}

		formatOptionDescription(bid) {
			const fallback = `Be the first to bid!`;
			if (bid && !(bid.description || bid.name)) {
				nodecg.log.error('Got weird bid war option:', JSON.stringify(bid, null, 2));
				return fallback;
			}

			return bid ? (bid.description || bid.name) : fallback;
		}
	}

	customElements.define(GdqOmnibarBidwarOption.is, GdqOmnibarBidwarOption);
})();
