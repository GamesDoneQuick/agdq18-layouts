class GdqOmnibarFireworks extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-fireworks';
	}

	static get properties() {
		return {};
	}

	ready() {
		super.ready();
		nodecg.listenFor('cheer', this.newCheer.bind(this));
	}

	testCheer(min, max) {
		const test = this.randomIntFromInterval(min, max);
		this.newCheer({bits_used: test}); // eslint-disable-line camelcase
	}

	newCheer(cheer) {
		const tl = new TimelineLite({autoRemoveChildren: true});
		const cheerDiv = document.createElement('div');
		cheerDiv.classList.add('cheer');
		switch (true) {
			case (cheer.bits_used < 100):
				cheerDiv.innerHTML = '<video src="vid/chGrey.webm" autoplay>';
				break;
			case (cheer.bits_used < 1000):
				cheerDiv.innerHTML = '<video src="vid/chPurple.webm" autoplay>';
				break;
			case (cheer.bits_used < 5000):
				cheerDiv.innerHTML = '<video src="vid/chGreen.webm" autoplay>';
				break;
			case (cheer.bits_used < 10000):
				cheerDiv.innerHTML = '<video src="vid/chBlue.webm" autoplay>';
				break;
			case (cheer.bits_used < 100000):
				cheerDiv.innerHTML = '<video src="vid/chRed.webm" autoplay>';
				break;
			default:
				nodecg.log.error('Unexpected value for bits_used:', JSON.stringify(cheer, null, 2));
		}

		// -12, 65
		cheerDiv.style.left = this.randomIntFromInterval(-14, 65) + 'px';
		// -8, 12
		cheerDiv.style.top = this.randomIntFromInterval(-8, 12) + 'px';

		tl.add('enter');

		tl.call(() => {
			this.shadowRoot.appendChild(cheerDiv);
		}, null, null, 'enter');

		tl.call(() => {
			this.shadowRoot.removeChild(cheerDiv);
		}, null, null, 'enter+=2');
	}

	randomIntFromInterval(min, max) {
		return Math.floor((Math.random() * (max - min + 1)) + min);
	}
}

customElements.define(GdqOmnibarFireworks.is, GdqOmnibarFireworks);
