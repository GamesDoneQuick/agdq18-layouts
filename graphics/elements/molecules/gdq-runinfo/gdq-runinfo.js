(function () {
	'use strict';

	const currentRun = nodecg.Replicant('currentRun');

	class GdqRuninfo extends Polymer.Element {
		static get is() {
			return 'gdq-runinfo';
		}

		static get properties() {
			return {
				maxNameSize: {
					type: Number,
					value: 45
				},
				forceSingleLineName: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				},
				estimate: String,
				releaseYear: String,
				console: String,
				category: String,
				name: {
					type: String,
					value: '?'
				}
			};
		}

		ready() {
			super.ready();
			Polymer.RenderStatus.afterNextRender(this, () => {
				currentRun.on('change', this.currentRunChanged.bind(this));
			});
		}

		currentRunChanged(newVal) {
			this.name = newVal.name;
			this.category = newVal.category;
			this.console = newVal.console;
			this.releaseYear = newVal.releaseYear || '20XX';
			this.estimate = newVal.estimate;

			// Avoids some issues that can arise on the first time that fitText is run.
			// Currently unsure why these issues happen.
			if (this.initialized) {
				this.fitText();
			} else {
				Polymer.RenderStatus.afterNextRender(this, this.fitText);
				this.initialized = true;
			}
		}

		fitText() {
			Polymer.flush();
			textFit(this.$.name, {maxFontSize: this.maxNameSize});
			this.$.category.maxTextWidth = this.clientWidth - 76;
			this.$.misc.maxTextWidth = (this.clientWidth - 124) / 3;
		}

		_processName(name) {
			if (!name) {
				return '&nbsp;';
			}

			if (this.forceSingleLineName) {
				return `<div class="name-line">${name.replace('\\n', ' ')}</div>`;
			}

			return name.split('\\n')
				.map(lineText => `<div class="name-line">${lineText}</div>`)
				.join('\n');
		}
	}

	customElements.define(GdqRuninfo.is, GdqRuninfo);
})();
