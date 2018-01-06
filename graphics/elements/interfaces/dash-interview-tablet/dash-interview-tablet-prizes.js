(function () {
	'use strict';

	const allPrizesRep = nodecg.Replicant('allPrizes');
	const prizePlaylistRep = nodecg.Replicant('interview:prizePlaylist');
	const showPrizesOnMonitorRep = nodecg.Replicant('interview:showPrizesOnMonitor');
	const prizePlaylistSortMapRep = nodecg.Replicant('interview:prizePlaylistSortMap');

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin window.MapSortMixin
	 * @appliesMixin Polymer.MutableData
	 * @appliesMixin Polymer.GestureEventListeners
	 */
	class DashInterviewTabletPrizes extends
		window.MapSortMixin(Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element))) {
		static get is() {
			return 'dash-interview-tablet-prizes';
		}

		static get properties() {
			return {
				allPrizes: Array,
				prizePlaylist: Array,
				prizesShowingOnMonitor: {
					type: Boolean,
					value: false
				},
				searchString: {
					type: String,
					value: ''
				}
			};
		}

		ready() {
			super.ready();

			allPrizesRep.on('change', newVal => {
				this.allPrizes = newVal;
			});

			prizePlaylistRep.on('change', newVal => {
				this.prizePlaylist = newVal;
			});

			showPrizesOnMonitorRep.on('change', newVal => {
				this.prizesShowingOnMonitor = newVal;
			});

			prizePlaylistSortMapRep.on('change', (newVal, oldVal, operations) => {
				// If the new sortMap is equal to the currently rendered sort order, do nothing.
				if (JSON.stringify(newVal) === JSON.stringify(this._dragListOrder)) {
					return;
				}

				this._sortMapVal = newVal;
				this.notifyPath('prizePlaylist');

				if (newVal.length > 0 && this._shouldFlash(operations)) {
					this._flashElementBackground(this.$.playlist);
				}

				this._dragListOrder = newVal.slice(0);
			});

			if (isMobileSafari()) {
				let start;
				Polymer.Gestures.addListener(this.$['list-container'], 'track', e => {
					if (e.detail.state === 'start') {
						start = this.$.playlist.scrollTop;
						return;
					}

					if (this._dragging) {
						return;
					}

					this.$.playlist.scrollTop = Math.max(start - e.detail.dy, 0);
				});
			} else {
				// Hack to get around https://github.com/bevacqua/crossvent/issues/8
				// I dunno why but this prevents the "auto passive listener" thing.
				Polymer.Gestures.addListener(this.$['list-container'], 'track', () => {});
			}

			// Fades new prize nodes from purple to white when added.
			this._flashAddedNodes(this.$.playlist, '.playlistPrize'); // TODO: not working
		}

		clearFilter() {
			this.searchString = '';
		}

		addPrizeToPlayList(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:addPrizeToPlaylist', prizeId);
		}

		removePrizeFromPlaylist(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:removePrizeFromPlaylist', prizeId);
		}

		markPrizeAsDone(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:markPrizeAsDone', prizeId);
		}

		markPrizeAsNotDone(prizeOrPrizeId) {
			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			nodecg.sendMessage('interview:markPrizeAsNotDone', prizeId);
		}

		clearPlaylist() {
			nodecg.sendMessage('interview:clearPrizePlaylist');
		}

		showPlaylist() {
			nodecg.sendMessage('interview:showPrizePlaylistOnMonitor');
		}

		hidePlaylist() {
			nodecg.sendMessage('interview:hidePrizePlaylistOnMonitor');
		}

		_calcClearIconHidden(searchString) {
			return !searchString || searchString.length <= 0;
		}

		_calcPrizesToList(allPrizes, searchString) {
			if (!allPrizes || allPrizes.length <= 0) {
				return [];
			}

			if (!searchString || searchString.trim().length === 0) {
				return allPrizes;
			}

			return allPrizes.filter(prize => {
				return prize.description.toLowerCase().includes(searchString.toLowerCase());
			});
		}

		_isPrizeInPlaylist(prizeOrPrizeId, prizePlaylist) {
			if (!prizePlaylist) {
				return false;
			}

			const prizeId = disambiguatePrizeId(prizeOrPrizeId);
			return prizePlaylist.findIndex(({id}) => id === prizeId) >= 0;
		}

		_calcClearPlaylistDisabled(prizePlaylist) {
			return !prizePlaylist || prizePlaylist.length <= 0;
		}

		_handlePrizeListingAddTap(e) {
			this.addPrizeToPlayList(e.model.prize);
		}

		_handlePrizeListingRemoveTap(e) {
			this.removePrizeFromPlaylist(e.model.prize);
		}

		_calcPrizesInPlaylist(allPrizes, prizePlaylist) {
			if (!allPrizes || allPrizes.length === 0 ||
				!prizePlaylist || prizePlaylist.length === 0) {
				return [];
			}

			return prizePlaylist.map(playlistEntry => {
				return allPrizes.find(prize => {
					return prize.id === playlistEntry.id;
				});
			});
		}

		_calcPlaylistPrizeChecked(prize, prizePlaylist) {
			if (!prize || !prizePlaylist || prizePlaylist.length <= 0) {
				return false;
			}

			const playlistEntry = prizePlaylist.find(pe => pe.id === prize.id);
			if (!playlistEntry) {
				return false;
			}

			return playlistEntry.complete;
		}

		_handlePlaylistPrizeCheckboxChanged(e) {
			if (e.detail.value) {
				this.markPrizeAsDone(e.model.prize);
			} else {
				this.markPrizeAsNotDone(e.model.prize);
			}
		}

		_handleDrag() {
			this._dragging = true;
		}

		_handleDragEnd() {
			this._dragging = false;
			const items = Array.from(this.$.playlist.querySelectorAll('.playlistPrize'));
			const newSortOrder = items.map(item => item.prizeId);
			this._dragListOrder = newSortOrder;
			this.$['playlist-repeat'].__instances.sort((a, b) => {
				const aMapIndex = newSortOrder.indexOf(a.__data.id);
				const bMapIndex = newSortOrder.indexOf(b.__data.id);

				if (aMapIndex >= 0 && bMapIndex < 0) {
					return -1;
				}

				if (aMapIndex < 0 && bMapIndex >= 0) {
					return 1;
				}

				// If neither of these prizes are in the sort map, just leave them where they are.
				if (aMapIndex < 0 && bMapIndex < 0) {
					return 0;
				}

				return aMapIndex - bMapIndex;
			});
			prizePlaylistSortMapRep.value = newSortOrder;
		}
	}

	customElements.define(DashInterviewTabletPrizes.is, DashInterviewTabletPrizes);

	/**
	 * Given a prize Object or prize ID Number, will always return a prize ID Number.
	 * @param {Number|Object} prizeOrPrizeId - Either a prize Object or a prize ID Number.
	 * @returns {Number} - A prize ID Number.
	 */
	function disambiguatePrizeId(prizeOrPrizeId) {
		return typeof prizeOrPrizeId === 'object' ?
			prizeOrPrizeId.id :
			prizeOrPrizeId;
	}

	/**
	 * Checks if the page is running in mobile Safari.
	 * @returns {boolean} - True if running in mobile Safari.
	 */
	function isMobileSafari() {
		return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
	}
})();
