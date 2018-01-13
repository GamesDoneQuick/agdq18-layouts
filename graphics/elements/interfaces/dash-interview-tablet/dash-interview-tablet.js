(function () {
	'use strict';

	const currentIntermissionRep = nodecg.Replicant('currentIntermission');
	const currentRunRep = nodecg.Replicant('currentRun');
	const scheduleRep = nodecg.Replicant('schedule');

	class DashInterviewTablet extends Polymer.MutableData(Polymer.GestureEventListeners(Polymer.Element)) {
		static get is() {
			return 'dash-interview-tablet';
		}

		static get properties() {
			return {
				lowerthirdShowing: {
					type: Boolean,
					reflectToAttribute: true
				},
				questionShowing: {
					type: Boolean,
					reflectToAttribute: true
				},
				selectedContentTab: {
					type: Number,
					value: 0
				},
				_connectedToNodeCG: {
					type: Boolean,
					value: true
				},
				_reconnectingToNodeCG: {
					type: Boolean,
					value: false
				}
			};
		}

		static get observers() {
			return [
				'_updateConnectionStatusIndicator(_connectedToNodeCG, _reconnectingToNodeCG)'
			];
		}

		ready() {
			super.ready();

			this.$.hotbar.addEventListener('auto-fill-names-clicked', () => {
				this.openLowerthirdRefillDialog();
			});

			this.$.hotbar.addEventListener('show-lowerthird-clicked', () => {
				this.$.lowerthirdControls.autoLowerthird();
			});

			this.$.hotbar.addEventListener('hide-lowerthird-clicked', () => {
				this.$.lowerthirdControls.hideLowerthird();
			});

			this.$.hotbar.addEventListener('open-lowerthird-preview-clicked', () => {
				this.$.lowerthirdPreview.updatePreview(this.$.lowerthirdControls.getNames());
				this.$.lowerthirdPreviewDialog.open();
			});

			window.socket.on('disconnect', () => {
				this._connectedToNodeCG = false;
				this._reconnectingToNodeCG = false;
			});

			window.socket.on('reconnect', () => {
				this._connectedToNodeCG = true;
				this._reconnectingToNodeCG = false;
			});

			window.socket.on('reconnecting', () => {
				this._reconnectingToNodeCG = true;
			});
		}

		openLowerthirdRefillDialog() {
			const currentInterview = currentIntermissionRep.value.content.find(item => item.type === 'interview');
			const nextInterview = scheduleRep.value.find(scheduleItem => {
				// Ignore items which are not interviews.
				if (scheduleItem.type !== 'interview') {
					return false;
				}

				// If we have a currentInterview, return the first interview after it.
				if (currentInterview) {
					return scheduleItem.order > currentInterview.order;
				}

				// If we don't have a currentInterview, return the first interview after the currentRun.
				// Ignore items before the currentRun.
				return scheduleItem.order >= currentRunRep.value.order;
			});

			let currentInterviewNames = [];
			let nextInterviewNames = [];

			if (currentInterview) {
				currentInterviewNames = currentInterview.interviewers.concat(currentInterview.interviewees);
			}

			if (nextInterview) {
				nextInterviewNames = nextInterview.interviewers.concat(nextInterview.interviewees);
			}

			while (currentInterviewNames.length < 5) {
				currentInterviewNames.push('(none)');
			}

			while (nextInterviewNames.length < 5) {
				nextInterviewNames.push('(none)');
			}

			this.$.currentLowerthirdRefillOption.names = currentInterviewNames;
			this.$.nextLowerthirdRefillOption.names = nextInterviewNames;
			this.$.lowerthirdRefillDialog.open();

			nodecg.log.info('currentInterview:', currentInterview);
			nodecg.log.info('currentInterviewNames:', currentInterviewNames);
			nodecg.log.info('nextInterview:', nextInterview);
			nodecg.log.info('nextInterviewNames:', nextInterviewNames);
		}

		closeLowerthirdRefillDialog() {
			this.$.lowerthirdRefillDialog.close();
		}

		_handleLowerthirdRefillOptionAccepted(e) {
			this.$.lowerthirdControls.setNames(e.detail.names);
			this.closeLowerthirdRefillDialog();
		}

		_updateConnectionStatusIndicator(connectedToNodeCG, reconnectingToNodeCG) {
			if (reconnectingToNodeCG) {
				this.$.contentTabs.style.borderColor = '#dfd334';
			} else if (connectedToNodeCG) {
				this.$.contentTabs.style.borderColor = '';
			} else {
				this.$.contentTabs.style.borderColor = '#A62724';
			}
		}
	}

	customElements.define(DashInterviewTablet.is, DashInterviewTablet);
})();
