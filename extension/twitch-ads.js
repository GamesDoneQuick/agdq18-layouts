'use strict';

// Packages
const NanoTimer = require('nanotimer');
const request = require('request-promise');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const TimeUtils = require('./lib/time');

const log = new nodecg.Logger(`${nodecg.bundleName}:twitch`);
const timeSince = nodecg.Replicant('twitch:timeSinceLastAd', {defaultValue: TimeUtils.createTimeStruct()});
const timeLeft = nodecg.Replicant('twitch:timeLeftInAd', {defaultValue: TimeUtils.createTimeStruct()});
const timeSinceTimer = new NanoTimer();
const timeLeftTimer = new NanoTimer();

// Load the existing timeSince and timeLeft and resume at the appropriate time.
if (timeSince.value.raw > 0) {
	const missedSeconds = Math.round((Date.now() - timeSince.value.timestamp) / 1000);
	resetTimeSinceTicker(timeSince.value.raw + missedSeconds);
}

if (timeLeft.value.raw > 0) {
	const missedSeconds = Math.round((Date.now() - timeLeft.value.timestamp) / 1000);
	resetTimeLeftTicker(timeLeft.value.raw - missedSeconds);
}

nodecg.listenFor('twitch:playAd', duration => {
	if (timeLeft.value > 0) {
		log.error('Requested Twitch ad before last ad had finished playing.');
		return;
	}

	if (timeSince.value.raw > 0 && timeSince.value.raw < 480) {
		log.error('Requested Twitch ad before the mandatory 8 minute cooldown expired.');
		return;
	}

	log.info('Requesting %d second Twitch ad...', duration);
	request({
		method: 'post',
		uri: `https://api.twitch.tv/kraken/channels/${nodecg.bundleConfig.twitch.channelId}/commercial`,
		headers: {
			Accept: 'application/vnd.twitchtv.v5+json',
			Authorization: `OAuth ${nodecg.bundleConfig.twitch.oauthToken}`,
			'Client-ID': nodecg.bundleConfig.twitch.clientId,
			'Content-Type': 'application/json'
		},
		body: {duration},
		json: true
	}).then(res => {
		resetTimeSinceTicker();
		resetTimeLeftTicker(duration + 15);
		if (res.Length === duration) {
			log.info('Successfully started %d second Twitch Ad.', res.Length);
		} else {
			log.info('Successfully started %d second Twitch Ad, but we requested %d seconds.', res.Length, duration);
		}
	}).catch(err => {
		log.error('Failed to start %d second Twitch Ad:\n\t', duration, err);
	});
});

function resetTimeSinceTicker(startingSeconds = 0) {
	timeSinceTimer.clearInterval();
	timeSince.value = TimeUtils.createTimeStruct(startingSeconds * 1000);
	timeSinceTimer.setInterval(() => {
		timeSince.value = TimeUtils.createTimeStruct(timeSince.value.raw + 1000);
	}, '', '1s');
}

function resetTimeLeftTicker(duration) {
	timeLeftTimer.clearInterval();
	timeLeft.value = TimeUtils.createTimeStruct(duration * 1000);

	if (duration < 0) {
		return;
	}

	timeLeftTimer.setInterval(() => {
		timeLeft.value = TimeUtils.createTimeStruct(timeLeft.value.raw - 1000);
		if (timeLeft.value.raw <= 0) {
			timeLeftTimer.clearInterval();
		}
	}, '', '1s');
}
