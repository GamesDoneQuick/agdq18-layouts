/* global TimeObject */
class GdqAdbreakAd extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-adbreak-ad';
	}

	static get properties() {
		return {
			adBreak: {
				type: Object
			},
			ad: {
				type: Object
			},
			completed: {
				type: Boolean,
				reflectToAttribute: true,
				computed: '_computeCompleted(ad.state.completed)'
			}
		};
	}

	static get observers() {
		return [
			'_updateProgressBar(ad.state.*)'
		];
	}

	frameNumberToTimeString(fps, frameNumber) {
		if (typeof fps !== 'number' || Number.isNaN(fps) ||
			typeof frameNumber !== 'number' || Number.isNaN(frameNumber)) {
			return ':??';
		}
		return TimeObject.formatSeconds(frameNumber / fps);
	}

	completeImageAd() {
		nodecg.sendMessage('intermissions:completeImageAd', this.ad.id);
	}

	_computeCompleted(adStateCompleted) {
		return adStateCompleted;
	}

	_updateProgressBar() {
		if (!this.ad) {
			this.$['progress-fill'].style.transform = 'scaleX(0)';
			return;
		}

		let percent = this.ad.state.frameNumber / this.ad.state.durationFrames;
		percent = Math.max(percent, 0); // Clamp to minimum 0.
		percent = Math.min(percent, 1); // Clamp to maximum 1.
		this.$['progress-fill'].style.transform = `scaleX(${percent})`;
	}

	_calcAdvanceHidden(ad, adBreak) {
		if (!ad || !adBreak) {
			return true;
		}

		const lastAd = adBreak.ads[adBreak.ads.length - 1];
		return ad.adType.toLowerCase() !== 'image' || ad === lastAd;
	}
}

customElements.define(GdqAdbreakAd.is, GdqAdbreakAd);
