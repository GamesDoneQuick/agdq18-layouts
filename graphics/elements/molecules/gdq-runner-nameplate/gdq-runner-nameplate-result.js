/**
 * @customElement
 * @polymer
 */
class GdqNameplateResult extends Polymer.Element {
	static get is() {
		return 'gdq-runner-nameplate-result';
	}

	static get properties() {
		return {
			showing: {
				type: Boolean,
				observer: '_showingChanged'
			},
			side: {
				type: String,
				reflectToAttribute: true
			},
			place: Number,
			time: String,
			firstPlace: {
				type: Boolean,
				reflectToAttribute: true
			},
			lastPlace: {
				type: Boolean,
				reflectToAttribute: true
			},
			_tl: {
				type: TimelineLite,
				value() {
					return new TimelineLite({autoRemoveChildren: true});
				}
			}
		};
	}

	ready() {
		super.ready();
		TweenLite.set(this, {x: 0});
		TweenLite.set(this.$.cover, {scaleX: 1});
		TweenLite.set(this.$.place, {scaleX: 0});
	}

	show() {
		const anim = new TimelineLite();
		anim.to(this, 0.5, {
			x: this.side === 'left' ? '-100%' : '100%',
			ease: Power3.easeIn
		});

		anim.to(this.$.cover, 0.5, {
			scaleX: 0,
			ease: Power3.easeOut
		});

		anim.to(this.$.place, 0.182, {
			scaleX: 1,
			ease: Sine.easeOut
		});

		return anim;
	}

	hide() {
		const anim = new TimelineLite();
		anim.to(this.$.place, 0.182, {
			scaleX: 0,
			ease: Sine.easeIn
		});

		anim.to(this.$.cover, 0.5, {
			scaleX: 1,
			ease: Power3.easeIn
		});

		anim.to(this, 0.5, {
			x: '0%',
			ease: Power3.easeOut
		});

		return anim;
	}

	_showingChanged(newVal) {
		const anim = newVal ? this.show() : this.hide();
		this._tl.add(anim);
	}
}

customElements.define(GdqNameplateResult.is, GdqNameplateResult);
