(function () {
	const memoizedYardstickWidths = new Map();
	const memoizedBodyTweenDurations = new Map();
	const MAX_MEMOIZATION_MAP_SIZE = 150;
	const ANCHOR_TWEEN_DURATION = 0.3;
	const BODY_TWEEN_DURATION_PER_PX = 0.002;

	/**
	 * @customElement
	 * @polymer
	 */
	class GdqOmnibarContentLabel extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-content-label';
		}

		static get properties() {
			return {};
		}

		enter(labelHtml) {
			labelHtml = this.processLabelHtml(labelHtml);

			const tl = new TimelineLite();
			const yardstickWidth = this.calcBodyWidth(labelHtml);

			tl.fromTo(this.$.anchor, ANCHOR_TWEEN_DURATION, {
				scaleY: 0
			}, {
				scaleY: 1,
				ease: Power3.easeInOut
			});

			tl.fromTo(this.$.body, this.calcBodyTweenDuration(labelHtml), {
				x: '-100%'
			}, {
				x: '0%',
				ease: Power2.easeOut,
				callbackScope: this,
				onStart() {
					this.$.text.innerHTML = labelHtml;
					this.$.text.style.width = `${Math.ceil(yardstickWidth)}px`;
				}
			});

			return tl;
		}

		change(labelHtml) {
			labelHtml = this.processLabelHtml(labelHtml);

			const tl = new TimelineLite();
			const yardstickWidth = this.calcBodyWidth(labelHtml);

			tl.to(this.$.body, this.calcBodyTweenDuration(labelHtml), {
				x: '-100%',
				ease: Power2.easeIn,
				callbackScope: this,
				onComplete() {
					this.$.text.innerHTML = labelHtml;
					this.$.text.style.width = `${Math.ceil(yardstickWidth)}px`;
				}
			});

			tl.to(this.$.body, this.calcBodyTweenDuration(labelHtml), {
				x: '0%',
				ease: Power2.easeOut,
				delay: 0.2
			});

			return tl;
		}

		exit() {
			const tl = new TimelineLite();

			tl.to(this.$.body, this.calcBodyTweenDuration(), {
				x: '-100%',
				ease: Power2.easeIn
			});

			tl.to(this, ANCHOR_TWEEN_DURATION, {
				scaleY: 0,
				ease: Power3.easeInOut
			});

			return tl;
		}

		processLabelHtml(labelHtml) {
			return labelHtml.replace(/\\n/g, '<br/>');
		}

		calcBodyWidth(labelHtml) {
			if (memoizedYardstickWidths.has(labelHtml)) {
				return memoizedYardstickWidths.get(labelHtml);
			}

			if (memoizedYardstickWidths.size > MAX_MEMOIZATION_MAP_SIZE) {
				memoizedYardstickWidths.clear();
			}

			this.$.yardstick.innerHTML = labelHtml;
			const width = this.$.yardstick.clientWidth;
			memoizedYardstickWidths.set(labelHtml, width);
			return width;
		}

		calcBodyTweenDuration(labelHtml) {
			if (memoizedBodyTweenDurations.has(labelHtml)) {
				return memoizedBodyTweenDurations.get(labelHtml);
			}

			if (memoizedBodyTweenDurations.size > MAX_MEMOIZATION_MAP_SIZE) {
				memoizedYardstickWidths.clear();
			}

			let duration;
			if (labelHtml) {
				const yardstickWidth = this.calcBodyWidth(labelHtml);
				duration = BODY_TWEEN_DURATION_PER_PX * (yardstickWidth + 30); // 30 = width added by chevrons
			} else {
				duration = BODY_TWEEN_DURATION_PER_PX * this.$.body.clientWidth;
			}

			memoizedBodyTweenDurations.set(labelHtml, duration);
			return duration;
		}
	}

	customElements.define(GdqOmnibarContentLabel.is, GdqOmnibarContentLabel);
})();
