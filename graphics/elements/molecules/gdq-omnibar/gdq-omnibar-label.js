(function () {
	class GdqOmnibarLabel extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-label';
		}

		ready() {
			super.ready();
			this.show = this.show.bind(this);
			this.changeText = this.changeText.bind(this);
			this.hide = this.hide.bind(this);
		}

		/**
		 * Creates an animation timeline for showing the label.
		 * @param {String} text - The text to show.
		 * @param {String} fontSize - The font size to use.
		 * @param {Object} backgroundOpts - The startColor and endColor to use for the stepped gradient background.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		show(text, fontSize, {startColor, endColor} = {}) {
			const showTL = new TimelineLite({
				onStart() {
					this.$.background.startColor = startColor;
					this.$.background.endColor = endColor;
					this.$.text.textContent = text;
					this.$.text.style.fontSize = fontSize;
				},
				callbackScope: this
			});

			showTL.set(this.$.text, {y: '-100%'});
			showTL.add(this.$.background.enter('above'));
			showTL.to(this.$.text, 0.334, {
				y: '0%',
				ease: Power1.easeInOut
			}, 0.2);

			return showTL;
		}

		/**
		 * Fades the text of the label without doing an entrance/exit anim.
		 * @param {String} text - The new text string to display.
		 * @param {Number} [fontSize] - The new font size, in pixels.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		changeText(text, fontSize) {
			const changeTextTL = new TimelineLite();

			changeTextTL.to(this.$.text, 0.25, {
				opacity: 0,
				ease: Power1.easeInOut,
				onComplete() {
					this.$.text.textContent = text;

					// Only update the fontSize if specified.
					if (fontSize) {
						this.$.text.style.fontSize = fontSize;
					}
				},
				callbackScope: this
			});

			changeTextTL.to(this.$.text, 0.25, {
				opacity: 1,
				ease: Power1.easeInOut
			});

			return changeTextTL;
		}

		/**
		 * Creates an animation timeline for hiding the label.
		 * @returns {TimelineLite} - An animation timeline.
		 */
		hide() {
			const hideTL = new TimelineLite();
			hideTL.add(this.$.background.exit('below'));
			hideTL.to(this.$.text, 0.334, {
				y: '100%',
				ease: Power1.easeInOut
			}, 0.2);
			return hideTL;
		}
	}

	customElements.define(GdqOmnibarLabel.is, GdqOmnibarLabel);
})();
