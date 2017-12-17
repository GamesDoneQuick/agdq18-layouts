(function () {
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
				}
			});

			return tl;
		}

		change(labelHtml) {
			labelHtml = this.processLabelHtml(labelHtml);

			const tl = new TimelineLite();

			tl.to(this.$.body, this.calcBodyTweenDuration(labelHtml), {
				x: '-100%',
				ease: Power2.easeIn,
				callbackScope: this,
				onComplete() {
					this.$.text.innerHTML = labelHtml;
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

		calcBodyTweenDuration(labelHtml) {
			let res;
			if (labelHtml) {
				this.$.yardstick.innerHTML = labelHtml;
				res = BODY_TWEEN_DURATION_PER_PX * (this.$.yardstick.clientWidth + 30); // 30 = width added by chevrons
			} else {
				res = BODY_TWEEN_DURATION_PER_PX * this.$.body.clientWidth;
			}
			return res;
		}
	}

	customElements.define(GdqOmnibarContentLabel.is, GdqOmnibarContentLabel);
})();
