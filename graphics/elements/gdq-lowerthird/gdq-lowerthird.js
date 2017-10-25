(function () {
	'use strict';

	const interviewNames = nodecg.Replicant('interview:names');
	const lowerthirdShowing = nodecg.Replicant('interview:lowerthirdShowing');

	class GdqLowerthird extends Polymer.Element {
		static get is() {
			return 'gdq-lowerthird';
		}

		static get properties() {
			return {
				tl: {
					type: TimelineLite,
					value() {
						return new TimelineLite({autoRemoveChildren: true});
					},
					readOnly: true
				},
				numNames: {
					type: Number,
					reflectToAttribute: true
				}
			};
		}

		ready() {
			super.ready();
			lowerthirdShowing.on('change', newVal => {
				if (newVal) {
					this.show();
				} else {
					this.hide();
				}
			});
		}

		show() {
			const tl = this.tl;

			// Set names
			tl.call(() => {
				let hostName;
				let intervieweeNames = interviewNames.value.slice(0);
				if (intervieweeNames.length === 5) {
					hostName = intervieweeNames.shift();
				}
				intervieweeNames = intervieweeNames.filter(name => Boolean(name));

				this.style.willChange = 'height';
				this.$.names.style.willChange = 'height';
				this.$.dropdown.style.willChange = 'transform';
				this.names = intervieweeNames;
				this.numNames = this.names.length;

				const greebles = [];
				const numGreebles = Math.max(2, this.numNames);
				for (let i = 0; i < numGreebles; i++) {
					greebles.push(true);
				}
				this.greebles = greebles;

				if (hostName) {
					this.$['dropdown-middle-text'].innerHTML =
						`Interviewer:&nbsp;<span style="color: white;">${hostName}</span>`;
				} else {
					this.$['dropdown-middle-text'].innerHTML = '#AGDQ2018';
				}

				Polymer.flush();
			}, null, null, '+=0.3'); // Give time for interviewNames replicant to update.

			// Fit names
			tl.call(() => {
				const padding = this.numNames === 4 ? 24 : 36;
				const nameDivs = Array.from(this.querySelectorAll('.name'));
				if (nameDivs.length > 0) {
					const maxNameWidth = nameDivs[0].parentNode.clientWidth - padding;
					nameDivs.forEach(nameDiv => {
						const nameWidth = nameDiv.scrollWidth;
						if (nameWidth > maxNameWidth) {
							TweenLite.set(nameDiv, {scaleX: maxNameWidth / nameWidth});
						} else {
							TweenLite.set(nameDiv, {scaleX: 1});
						}
					});
				}
			});

			tl.to(this, 1, {
				height: 153,
				ease: Power3.easeInOut
			});

			tl.call(() => {
				TweenLite.to(this.$.names, 0.65, {
					height: this.numNames === 4 ? 48 : 65,
					ease: Power3.easeInOut
				});
			}, null, this, '-=0.8');

			tl.call(() => {
				TweenLite.to(this.$.dropdown, 0.65, {
					y: this.numNames === 4 ? 41 : 58,
					ease: Power3.easeOut
				});
			}, null, this, '-=0.4');
		}

		hide() {
			const tl = this.tl;
			tl.to(this, 0.9, {
				height: 0,
				ease: Power3.easeIn
			});

			tl.set([this, this.$.names, this.$.dropdown], {clearProps: 'all'});
		}
	}

	customElements.define(GdqLowerthird.is, GdqLowerthird);
})();
