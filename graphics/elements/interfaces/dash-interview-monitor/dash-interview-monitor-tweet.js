class DashInterviewMonitorTweet extends Polymer.Element {
	static get is() {
		return 'dash-interview-monitor-tweet';
	}

	static get properties() {
		return {
			tweet: {
				type: Object,
				observer: 'populateBody'
			}
		};
	}

	populateBody() {
		if (!this.tweet) {
			return;
		}

		this.$.body.innerHTML = this.tweet.text;
	}
}

customElements.define(DashInterviewMonitorTweet.is, DashInterviewMonitorTweet);
