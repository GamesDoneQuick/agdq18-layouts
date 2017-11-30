class GdqTweet extends Polymer.Element {
	static get is() {
		return 'gdq-tweet';
	}

	static get properties() {
		return {
			tweet: {
				type: Object,
				observer: 'populateBody'
			},
			profileUrl: {
				type: String,
				computed: 'computeProfileUrl(tweet)'
			},
			tweetUrl: {
				type: String,
				computed: 'computeTweetUrl(profileUrl, tweet)'
			}
		};
	}

	computeProfileUrl(tweet) {
		if (!tweet || !tweet.user) {
			return;
		}

		return `https://twitter.com/${tweet.user.screen_name}`;
	}

	computeTweetUrl(profileUrl, tweet) {
		if (!profileUrl || !tweet) {
			return;
		}

		return `${profileUrl}/status/${tweet.id_str}`;
	}

	populateBody() {
		if (!this.tweet) {
			return;
		}

		this.$.body.innerHTML = this.tweet.text;
	}
}

customElements.define(GdqTweet.is, GdqTweet);
