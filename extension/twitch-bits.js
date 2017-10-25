// Packages
const request = require('request-promise');
const TwitchPubSub = require('twitchps');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const DEBUG = nodecg.bundleConfig.twitch.debug;
const BITS_OFFSET = nodecg.bundleConfig.twitch.bitsOffset;
const BITS_TOTAL_UPDATE_INTERVAL = 10 * 1000;
const log = new nodecg.Logger(`${nodecg.bundleName}:twitch-bits`);
const autoUpdateTotal = nodecg.Replicant('autoUpdateTotal');
const bitsTotal = nodecg.Replicant('bits:total');

autoUpdateTotal.on('change', newVal => {
	if (newVal) {
		updateBitsTotal();
	}
});

// Optional reconnect, debug options (Defaults: reconnect: true, debug: false)
// var ps = new TwitchPS({init_topics: init_topics});
const pubsub = new TwitchPubSub({
	init_topics: [{ // eslint-disable-line camelcase
		topic: `channel-bits-events-v1.${nodecg.bundleConfig.twitch.channelId}`,
		token: nodecg.bundleConfig.twitch.oauthToken
	}],
	reconnect: true,
	debug: DEBUG
});

pubsub.on('connected', () => {
	log.info('Connected to PubSub.');
});

pubsub.on('disconnected', () => {
	log.warn('Disconnected from PubSub.');
});

pubsub.on('reconnect', () => {
	log.info('Reconnecting to PubSub...');
});

pubsub.on('bits', cheer => {
	if (DEBUG) {
		log.info('Received cheer:', cheer);
	} else {
		log.debug('Received cheer:', cheer);
	}
	nodecg.sendMessage('cheer', cheer);
});

updateBitsTotal();
setInterval(updateBitsTotal, BITS_TOTAL_UPDATE_INTERVAL);

function updateBitsTotal() {
	request({
		method: 'get',
		uri: `https://api.twitch.tv/bits/channels/${nodecg.bundleConfig.twitch.channelId}?event=agdq2018`,
		headers: {
			Accept: 'application/vnd.twitchtv.v5+json',
			Authorization: `OAuth ${nodecg.bundleConfig.twitch.oauthToken}`,
			'Client-ID': nodecg.bundleConfig.twitch.clientId,
			'Content-Type': 'application/json'
		},
		json: true
	}).then(res => {
		if (!autoUpdateTotal.value) {
			return;
		}

		const total = res.total;
		if (typeof res.total !== 'number' || Number.isNaN(total)) {
			log.error('Total was an unexpected value:', res);
			return;
		}

		bitsTotal.value = total - BITS_OFFSET;
	}).catch(err => {
		log.error('Failed to update bits total:\n\t', err);
	});
}
