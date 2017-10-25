/* global SteppedGradientMixin */
class GdqSteppedGradient extends SteppedGradientMixin(Polymer.Element) {
	static get is() {
		return 'gdq-stepped-gradient';
	}

	static get properties() {
		return {
			startEntered: {
				type: Boolean,
				value: false,
				reflectToAttribute: true
			},
			zIndexing: {
				type: String
			}
		};
	}

	static get observers() {
		return [
			'recalcBandStyles(palette, zIndexing)'
		];
	}

	get bands() {
		return Array.from(this.shadowRoot.querySelectorAll('.band'));
	}

	connectedCallback() {
		super.connectedCallback();
		if (this.startEntered) {
			Polymer.RenderStatus.beforeNextRender(this, () => {
				this.enter('above').progress(1);
			});
		}
	}

	enter(aboveOrBelow) {
		if (aboveOrBelow !== 'above' && aboveOrBelow !== 'below') {
			throw new Error(`Unexpected value for aboveOrBelow: ${aboveOrBelow}`);
		}

		const tl = new TimelineLite();

		tl.to({}, 0.01, {
			onComplete() {
				this.zIndexing = aboveOrBelow === 'above' ? 'frontToBack' : 'backToFront';
				this.bands.forEach((band, index) => {
					const y = this.zIndexing === 'frontToBack' ?
						-(index + 1) / this.steps :
						(this.steps - index) / this.steps;

					TweenLite.set(band, {y: `${y * 100}%`});
				});
			},
			callbackScope: this
		});

		tl.staggerTo(aboveOrBelow === 'above' ? this.bands.slice(0).reverse() : this.bands, 0.334, {
			y: '0%',
			ease: Sine.easeInOut
		}, 0.1167);

		return tl;
	}

	exit(aboveOrBelow) {
		if (aboveOrBelow !== 'above' && aboveOrBelow !== 'below') {
			throw new Error(`Unexpected value for aboveOrBelow: ${aboveOrBelow}`);
		}

		const tl = new TimelineLite();

		tl.to({}, 0.01, {
			onComplete() {
				this.zIndexing = aboveOrBelow === 'above' ? 'frontToBack' : 'backToFront';
				TweenLite.set(this.bands, {y: '0%'});
			},
			callbackScope: this
		});

		tl.add('bandsExit');
		const bands = aboveOrBelow === 'above' ? this.bands : this.bands.slice(0).reverse();
		bands.forEach((band, index) => {
			const y = aboveOrBelow === 'below' ?
				(index + 1) / this.steps :
				-(index + 1) / this.steps;

			tl.to(band, 0.334, {
				y: `${y * 100}%`,
				ease: Sine.easeInOut
			}, `bandsExit+=${index * 0.1167}`);
		});

		return tl;
	}

	recalcBandStyles(palette, zIndexing) {
		if (!zIndexing) {
			return;
		}

		this.bands.forEach((band, index) => {
			const rgb = palette[index];
			band.style.background = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

			if (zIndexing === 'backToFront') {
				band.style.top = `${(index / this.steps) * 100}%`;
				band.style.zIndex = index;
			} else if (zIndexing === 'frontToBack') {
				band.style.top = `${-((this.steps - index - 1) / this.steps) * 100}%`;
				band.style.zIndex = this.steps - index;
			} else {
				throw new Error(`Unexpected value for zIndexing: ${zIndexing}`);
			}
		});
	}
}

customElements.define(GdqSteppedGradient.is, GdqSteppedGradient);
