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
				category: String
			};
		}

		ready() {
			super.ready();
			currentRun.on('change', this.currentRunChanged.bind(this));
		}

		currentRunChanged(newVal) {
			this.name = newVal.name.replace('\\n', this.forceSingleLineName ? ' ' : '<br/>');
			this.category = newVal.category;
			this.console = newVal.console;
			this.releaseYear = newVal.releaseYear;
			this.estimate = newVal.estimate;

			this.$.name.innerHTML = this.name;

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
		}

		calcReleaseYearDisplay(releaseYear) {
			if (releaseYear) {
				return ` - ${releaseYear}`;
			}
		}
	}

	customElements.define(GdqRuninfo.is, GdqRuninfo);
})();
