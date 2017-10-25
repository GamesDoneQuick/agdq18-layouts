(function () {
	const timeSince = nodecg.Replicant('twitch:timeSinceLastAd');
	const timeLeft = nodecg.Replicant('twitch:timeLeftInAd');

	class GdqHostDashboardTwitchAds extends Polymer.Element {
		static get is() {
			return 'gdq-hostdash-twitch-ads';
		}

		static get properties() {
			return {
				timeLeft: {
					type: String,
					value: '8:88'
				},
				timeSince: {
					type: String,
					value: '8:88:88'
				}
			};
		}

		ready() {
			super.ready();

			timeSince.on('change', newVal => {
				this.timeSince = newVal.formatted;
				this.updatePlayDisabled();
			});

			timeLeft.on('change', newVal => {
				this.timeLeft = newVal.formatted;
				this.updatePlayDisabled();
			});
		}

		play() {
			this.$.confirmDialog.open();
		}

		updatePlayDisabled() {
			if (timeSince.status !== 'declared' || timeLeft.status !== 'declared') {
				this.$.play.setAttribute('disabled', 'true');
				return;
			}

			if ((timeSince.value.raw > 0 && timeSince.value.raw < 480) || timeLeft.value.raw > 0) {
				this.$.play.setAttribute('disabled', 'true');
			} else {
				this.$.play.removeAttribute('disabled');
			}
		}

		_handleConfirmDialogClosed(e) {
			if (e.detail.confirmed === true) {
				const duration = parseInt(this.$.listbox.selectedItem.getAttribute('data-value'), 10);
				nodecg.sendMessage('twitch:playAd', duration);
			}
		}
	}

	customElements.define(GdqHostDashboardTwitchAds.is, GdqHostDashboardTwitchAds);
})();
