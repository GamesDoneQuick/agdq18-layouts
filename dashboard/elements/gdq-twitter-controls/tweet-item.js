class TweetItem extends Polymer.Element {
	static get is() {
		return 'tweet-item';
	}

	static get properties() {
		return {
			value: {
				type: Object,
				observer: '_valueChanged'
			},
			profileUrl: {
				type: String,
				computed: 'computeProfileUrl(value)'
			},
			tweetUrl: {
				type: String,
				computed: 'computeTweetUrl(profileUrl, value)'
			}
		};
	}

	_valueChanged(newValue) {
		Polymer.dom(this.$.body).innerHTML = newValue.text;
	}

	computeProfileUrl(value) {
		return `https://twitter.com/${value.user.screen_name}`;
	}

	computeTweetUrl(profileUrl, value) {
		return `${profileUrl}/status/${value.id_str}`;
	}

	computePhotoOrPhotos(numPhotos) {
		return numPhotos > 1 ? 'photos' : 'photo';
	}

	computeIndexPlusOne(index) {
		return index + 1;
	}

	accept() {
		nodecg.sendMessage('acceptTweet', this.value);
	}

	reject() {
		nodecg.sendMessage('rejectTweet', this.value.id_str);
	}
}

customElements.define(TweetItem.is, TweetItem);
