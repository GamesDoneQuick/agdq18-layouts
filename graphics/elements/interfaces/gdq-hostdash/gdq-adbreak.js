class GdqAdbreak extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-adbreak';
	}

	static get properties() {
		return {
			adBreak: {
				type: Object
			}
		};
	}

	start() {
		this.dispatchEvent(new CustomEvent('start', {
			detail: {
				adBreakId: this.adBreak.id
			},
			bubbles: true,
			composed: true
		}));
	}

	cancel() {
		this.dispatchEvent(new CustomEvent('cancel', {
			detail: {
				adBreakId: this.adBreak.id
			},
			bubbles: true,
			composed: true
		}));
	}

	complete() {
		this.dispatchEvent(new CustomEvent('complete', {
			detail: {
				adBreakId: this.adBreak.id
			},
			bubbles: true,
			composed: true
		}));
	}

	_calcCompleteButtonHidden(adBreak) {
		const lastAd = adBreak.ads[adBreak.ads.length - 1];
		return lastAd.adType.toLowerCase() !== 'image';
	}

	any(...args) {
		return args.find(arg => Boolean(arg));
	}
}

customElements.define(GdqAdbreak.is, GdqAdbreak);
