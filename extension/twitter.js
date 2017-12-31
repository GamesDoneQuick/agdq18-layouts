/* eslint-disable camelcase */
'use strict';

// Packages
const twemoji = require('twemoji');
const TwitterStream = require('twitter-stream-api');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const TARGET_USER_ID = nodecg.bundleConfig.twitter.userId;
const tweets = nodecg.Replicant('tweets', {defaultValue: []});
let userStream;

// Clear queue of tweets when currentRun changes
nodecg.Replicant('currentRun').on('change', (newVal, oldVal) => {
	if (oldVal && newVal.pk !== oldVal.pk) {
		tweets.value = [];
	}
});

buildUserStream();

// Close and re-open the twitter connection every 90 minutes
setInterval(() => {
	nodecg.log.info('[twitter] Restarting Twitter connection (done every 90 minutes).');
	userStream.close();
	buildUserStream();
}, 90 * 60 * 1000);

nodecg.listenFor('acceptTweet', tweet => {
	if (!nodecg.bundleConfig.twitter.debug) {
		removeTweetById(tweet.id_str);
	}

	nodecg.sendMessage('showTweet', tweet);
});

nodecg.listenFor('rejectTweet', removeTweetById);

/**
 * Builds the stream. Called once every 90 minutes because sometimes the stream just dies silently.
 * @returns {undefined}
 */
function buildUserStream() {
	userStream = new TwitterStream({
		consumer_key: nodecg.bundleConfig.twitter.consumerKey,
		consumer_secret: nodecg.bundleConfig.twitter.consumerSecret,
		token: nodecg.bundleConfig.twitter.accessTokenKey,
		token_secret: nodecg.bundleConfig.twitter.accessTokenSecret
	});

	userStream.on('data', data => {
		// We discard quoted statuses because we can't show them.
		if (data.quoted_status) {
			return;
		}

		if (data.event) {
			switch (data.event) {
				case 'favorite':
					if (data.source.id_str !== TARGET_USER_ID) {
						return;
					}

					addTweet(data.target_object);
					break;
				case 'unfavorite':
					if (data.source.id_str !== TARGET_USER_ID) {
						return;
					}

					removeTweetById(data.target_object.id_str);
					break;
				default:
				// do nothing
			}
		} else if (data.delete) {
			removeTweetById(data.delete.status.id_str);
		} else if (data.retweeted_status) {
			if (data.user.id_str !== TARGET_USER_ID) {
				return;
			}

			const retweetedStatus = data.retweeted_status;
			retweetedStatus.gdqRetweetId = data.id_str;
			addTweet(retweetedStatus);
		} else if (data.text) {
			if (data.user.id_str !== TARGET_USER_ID) {
				return;
			}

			// Filter out @ replies
			if (data.text.charAt(0) === '@') {
				return;
			}

			addTweet(data);
		}
	});

	userStream.on('error', error => {
		nodecg.log.error('[twitter]', error.stack);
	});

	userStream.on('connection success', () => {
		nodecg.log.info('[twitter] Connection success.');
	});

	userStream.on('connection aborted', () => {
		nodecg.log.warn('[twitter] Connection aborted!');
	});

	userStream.on('connection error network', error => {
		nodecg.log.error('[twitter] Connection error network:', error.stack);
	});

	userStream.on('connection error stall', () => {
		nodecg.log.error('[twitter] Connection error stall!');
	});

	userStream.on('connection error http', httpStatusCode => {
		nodecg.log.error('[twitter] Connection error HTTP:', httpStatusCode);
	});

	userStream.on('connection rate limit', httpStatusCode => {
		nodecg.log.error('[twitter] Connection rate limit:', httpStatusCode);
	});

	userStream.on('connection error unknown', error => {
		nodecg.log.error('[twitter] Connection error unknown:', error.stack);
		userStream.close();
		userStream = new TwitterStream({
			consumer_key: nodecg.bundleConfig.twitter.consumerKey,
			consumer_secret: nodecg.bundleConfig.twitter.consumerSecret,
			token: nodecg.bundleConfig.twitter.accessTokenKey,
			token_secret: nodecg.bundleConfig.twitter.accessTokenSecret
		});
		userStream.stream('user', {tweet_mode: 'extended'});
	});

	userStream.stream('user', {tweet_mode: 'extended'});
}

/**
 * Adds a Tweet to the queue.
 * @param {Object} tweet - The tweet to add.
 * @returns {undefined}
 */
function addTweet(tweet) {
	// Reject tweets with media.
	if (tweet.extended_entities && tweet.extended_entities.media.length > 0) {
		return;
	}

	// Don't add the tweet if we already have it
	const isDupe = tweets.value.find(t => t.id_str === tweet.id_str);
	if (isDupe) {
		return;
	}

	if (tweet.truncated) {
		nodecg.log.warn('Tweet is truncated:', tweet);
	}

	// Parse emoji.
	tweet.text = twemoji.parse(tweet.full_text || tweet.text);

	// Replace newlines with spaces
	tweet.text = tweet.text.replace(/\n/ig, ' ');

	// Highlight the #AGDQ2018 hashtag.
	tweet.text = tweet.text.replace(/#agdq2018/ig, '<span class="hashtag">#AGDQ2018</span>');

	// Add the tweet to the list
	tweets.value.push(tweet);
}

/**
 * Removes a Tweet (by id) from the queue.
 * @param {String} idToRemove - The ID string of the Tweet to remove.
 * @returns {Object} - The removed tweet. "Undefined" if tweet not found.
 */
function removeTweetById(idToRemove) {
	if (typeof idToRemove !== 'string') {
		throw new Error(`[twitter] Must provide a string ID when removing a tweet. ID provided was: ${idToRemove}`);
	}

	let didRemoveTweet = false;
	tweets.value.some((tweet, index) => {
		if (tweet.id_str === idToRemove || tweet.gdqRetweetId === idToRemove) {
			tweets.value.splice(index, 1);
			didRemoveTweet = true;
			return true;
		}

		return false;
	});
	return didRemoveTweet;
}
