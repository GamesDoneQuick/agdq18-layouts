(function () {
	'use strict';

	const allPrizesRep = nodecg.Replicant('allPrizes');
	const prizePlaylistRep = nodecg.Replicant('interview:prizePlaylist');
	const prizePlaylistSortMapRep = nodecg.Replicant('interview:prizePlaylistSortMap');

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin window.MapSortMixin
	 */
	class DashInterviewMonitorPrizes extends window.MapSortMixin(Polymer.MutableData(Polymer.Element)) {
		static get is() {
			return 'dash-interview-monitor-prizes';
		}

		static get properties() {
			return {
				allPrizes: Array,
				prizePlaylist: Array,
				playlistPrizes: {
					type: Array,
					computed: '_computePlaylistPrizes(allPrizes, prizePlaylist)'
				},
				noPlaylistPrizes: {
					type: Boolean,
					computed: '_computeNoPlaylistPrizes(playlistPrizes)'
				}
			};
		}

		ready() {
			super.ready();

			allPrizesRep.on('change', newVal => {
				if (!newVal || newVal.length === 0) {
					this.allPrizes = [];
					return;
				}

				this.allPrizes = newVal;
			});

			prizePlaylistRep.on('change', newVal => {
				if (!newVal || newVal.length === 0) {
					this.prizePlaylist = [];
					return;
				}

				this.prizePlaylist = newVal;
			});

			prizePlaylistSortMapRep.on('change', (newVal, oldVal, operations) => {
				this._sortMapVal = newVal;
				this.$.repeat.render();

				if (newVal.length > 0 && this._shouldFlash(operations)) {
					this._flashElementBackground(this);
				}
			});
		}

		_computePlaylistPrizes(allPrizes, prizePlaylist) {
			if (!allPrizes || allPrizes.length === 0 ||
				!prizePlaylist || prizePlaylist.length === 0) {
				return [];
			}

			return prizePlaylist.filter(playlistEntry => {
				return !playlistEntry.complete;
			}).map(playlistEntry => {
				return allPrizes.find(prize => {
					return prize.id === playlistEntry.id;
				});
			});
		}

		_computeNoPlaylistPrizes(playlistPrizes) {
			return !playlistPrizes || playlistPrizes.length <= 0;
		}
	}

	customElements.define(DashInterviewMonitorPrizes.is, DashInterviewMonitorPrizes);
})();
