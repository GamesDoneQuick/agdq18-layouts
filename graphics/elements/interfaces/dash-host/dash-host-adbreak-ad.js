class DashHostAdbreakAd extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'dash-host-adbreak-ad';
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
		return this.formatSeconds(frameNumber / fps);
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

	// TODO: Make this not have to be copy/pasted from extension/lib/time.js
	/**
	 * Formats a number of seconds into a string ([hh:]mm:ss).
	 * @param {number} seconds - The number of seconds to format.
	 * @returns {string} - The formatted time sting.
	 */
	formatSeconds(seconds) {
		const hms = {
			h: Math.floor(seconds / 3600),
			m: Math.floor(seconds % 3600 / 60),
			s: Math.floor(seconds % 3600 % 60)
		};

		let str = '';
		if (hms.h) {
			str += `${hms.h}:`;
		}

		str += `${(hms.m < 10 ? `0${hms.m}` : hms.m)}:${(hms.s < 10 ? `0${hms.s}` : hms.s)}`;
		return str;
	}
}

customElements.define(DashHostAdbreakAd.is, DashHostAdbreakAd);
