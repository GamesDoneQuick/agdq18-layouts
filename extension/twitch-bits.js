// Packages
const TwitchPubSub = require('twitchps');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const DEBUG = nodecg.bundleConfig.twitch.debug;
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
	bitsTotal.value = 0;
}
