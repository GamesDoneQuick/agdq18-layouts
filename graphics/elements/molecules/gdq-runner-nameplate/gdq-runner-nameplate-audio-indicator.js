/**
 * @customElement
 * @polymer
 */
class GdqNameplateAudioIndicator extends Polymer.Element {
	static get is() {
		return 'gdq-runner-nameplate-audio-indicator';
	}

	static get properties() {
		return {
			showing: {
				type: Boolean,
				observer: '_showingChanged'
			},
			vertPos: {
				type: String,
				reflectToAttribute: true,
				value: 'top'
			},
			horizPos: {
				type: String,
				reflectToAttribute: true,
				value: 'left'
			},
			animationDuration: {
				type: Number,
				value: 0.25
			},
			_maskProxy: {
				type: Array,
				readOnly: true,
				value() {
					return [-10, -10, 0];
				}
			}
		};
	}

	ready() {
		super.ready();
		this.$.body.style.webkitMaskImage = `linear-gradient(
			to right,
			rgba(0,0,0,1) ${this._maskProxy[0]}%,
			rgba(0,0,0,1) ${this._maskProxy[1]}%,
			rgba(0,0,0,0) ${this._maskProxy[2]}%
		)`;
	}

	show() {
		return this._animateMask(100, 100, 110);
	}

	hide() {
		return this._animateMask(-10, -10, 0);
	}

	_animateMask(stopOne, stopTwo, stopThree) {
		return TweenLite.to(this._maskProxy, this.animationDuration, {
			0: stopOne,
			1: stopTwo,
			2: stopThree,
			ease: Power3.easeOut,
			callbackScope: this,
			onUpdate() {
				this.$.body.style.webkitMaskImage = `linear-gradient(
					to right,
					rgba(0,0,0,1) ${this._maskProxy[0]}%,
					rgba(0,0,0,1) ${this._maskProxy[1]}%,
					rgba(0,0,0,0) ${this._maskProxy[2]}%
				)`;
			}
		});
	}

	_showingChanged(newVal) {
		if (newVal) {
			return this.show();
		}

		return this.hide();
	}
}

customElements.define(GdqNameplateAudioIndicator.is, GdqNameplateAudioIndicator);
