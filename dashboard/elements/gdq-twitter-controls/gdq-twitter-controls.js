(function () {
	'use strict';

	const currentLayout = nodecg.Replicant('gdq:currentLayout');
	const tweets = nodecg.Replicant('tweets');

	class GdqTwitterControls extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-twitter-controls';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();

			currentLayout.on('change', newVal => {
				switch (newVal) {
					case 'interview':
					case 'standard_4':
					case 'gameboy_4':
					case 'ds':
						this.$.cover.style.display = 'flex';
						break;
					default:
						this.$.cover.style.display = 'none';
				}
			});

			tweets.on('change', newVal => {
				this.$.empty.style.display = newVal.length > 0 ? 'none' : 'flex';
				this.tweets = newVal;
			});
		}

		_sortTweets(a, b) {
			return new Date(b.created_at) - new Date(a.created_at);
		}
	}

	customElements.define(GdqTwitterControls.is, GdqTwitterControls);
})();
