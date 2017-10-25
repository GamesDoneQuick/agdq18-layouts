'use strict';

// Native
const EventEmitter = require('events');
const fs = require('fs');
const format = require('util').format;
const path = require('path');

// Packages
const equals = require('deep-equal');
const osc = require('osc');
const {CasparCG, Enum: CasparEnum} = require('casparcg-connection');
const debounce = require('lodash.debounce');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

let foregroundFileName = '';
let currentFrame = 0;
let durationFrames = 0;
let fileMayHaveRestarted = false;
let updateFilesInterval;

const log = new nodecg.Logger(`${nodecg.bundleName}:caspar`);
const currentRun = nodecg.Replicant('currentRun');
const files = nodecg.Replicant('caspar:files', {persistent: false});
const connected = nodecg.Replicant('caspar:connected');
const connection = new CasparCG({
	host: nodecg.bundleConfig.casparcg.host,
	port: nodecg.bundleConfig.casparcg.port,
	onConnected() {
		connected.value = true;
		log.info('Connected.');
		clearInterval(updateFilesInterval);
		updateFiles();
		updateFilesInterval = setInterval(updateFiles, 60000);

		connection.lock(1, CasparEnum.Lock.ACQUIRE, nodecg.bundleConfig.casparcg.lockSecret).then(() => {
			log.info('Lock acquired.');
		}).catch(e => {
			log.error('Failed to acquire lock:', e);
			connected.value = false;
		});
	},
	onDisconnected() {
		connected.value = false;
		log.warn('Disconnected.');
	},
	onLog(str) {
		log.debug(str);
	},
	onError(error) {
		log.error(error);
	}
});

connection.clear(1);
setInterval(checkConnection, 1000);

module.exports = {
	play(filename) {
		log.info('Playing %s...', filename);
		return connection.play(1, undefined, filename);
	},
	info() {
		return connection.info(1);
	},
	loadbgAuto(filename) {
		return connection.loadbgAuto(1, undefined, filename, false, CasparEnum.Transition.CUT);
	},
	clear() {
		return connection.clear(1).then(resetState);
	},
	stop() {
		return connection.stop(1).then(resetState);
	},
	resetState,
	replicants: {
		files
	},
	osc: new EventEmitter()
};

function resetState() {
	foregroundFileName = '';
	currentFrame = 0;
	durationFrames = 0;
	fileMayHaveRestarted = false;
}

nodecg.listenFor('caspar:play', module.exports.play);

const udpPort = new osc.UDPPort({
	localAddress: '0.0.0.0',
	localPort: nodecg.bundleConfig.casparcg.localOscPort,
	metadata: true
});

const emitForegroundChanged = debounce(() => {
	const logStr = format('%s, %s, %s\n',
		new Date().toISOString(), foregroundFileName, currentRun.value.name);

	log.info('Ad play:', logStr.replace('\n', ''));
	fs.appendFile('logs/ad_log.csv', logStr, err => {
		if (err) {
			nodecg.log.error('[advertisements] Error appending to log:', err.stack);
		}
	});

	module.exports.osc.emit('foregroundChanged', foregroundFileName);
}, 250);

udpPort.on('message', message => {
	if (message.address === '/channel/1/stage/layer/0/file/frame') {
		const newCurrentFrame = message.args[0].value.low;
		const newDurationFrames = message.args[1].value.low;
		if (currentFrame !== newCurrentFrame || durationFrames !== newDurationFrames) {
			if (newCurrentFrame < currentFrame) {
				process.nextTick(() => {
					fileMayHaveRestarted = true;
				});
			}
			currentFrame = newCurrentFrame;
			durationFrames = newDurationFrames;
			module.exports.osc.emit('frameChanged', currentFrame, durationFrames);
		}
	} else if (message.address === '/channel/1/stage/layer/0/file/path') {
		const fileChanged = message.args[0].value !== foregroundFileName;
		if (fileChanged || fileMayHaveRestarted) {
			foregroundFileName = message.args[0].value;
			emitForegroundChanged();
		}

		fileMayHaveRestarted = false;
	}
});

udpPort.on('error', error => {
	log.warn('[osc] Error:', error.stack);
});

udpPort.on('open', () => {
	log.info('[osc] Port open, can now receive events from CasparCG.');
});

udpPort.on('close', () => {
	log.warn('[osc] Port closed.');
});

// Open the socket.
udpPort.open();

let isFirstFilesUpdate = true;
/**
 * Updates the caspar:files replicant.
 * @returns {undefined}
 */
function updateFiles() {
	if (!connected.value) {
		return;
	}

	fs.readdir(nodecg.bundleConfig.adsPath, (err, items) => {
		if (err) {
			log.error('Error updating files:', err);
			return;
		}

		let hadError = false;
		const foundFiles = [];
		items.forEach(item => {
			const fullPath = path.join(nodecg.bundleConfig.adsPath, item);
			const stats = fs.lstatSync(fullPath);

			// If this isn't a file, we don't care.
			if (!stats.isFile()) {
				return;
			}

			// If another file with the same name already exists, something is wrong.
			const foundAnotherFileWithSameName = foundFiles.find(foundFile => {
				return path.parse(foundFile).name === path.parse(item).name;
			});
			if (foundAnotherFileWithSameName) {
				log.error('Found two files with the same name (%s) in the adsPath!', path.parse(item).name);
				return;
			}

			foundFiles.push(item);
		});

		if (hadError) {
			return;
		}

		connection.cls().then(reply => {
			const remapped = reply.response.data.map(data => {
				const nameWithExt = foundFiles.find(foundFile => {
					return path.parse(foundFile).name.toLowerCase() === data.name.toLowerCase();
				});

				if (!nameWithExt) {
					log.error('A file reported by Caspar was not found in adsPath:', data.name);
					hadError = true;
					return null;
				}

				data.nameWithExt = nameWithExt;
				return data;
			});

			if (!hadError) {
				if (equals(remapped, files.value)) {
					return;
				}
				files.value = remapped;
				if (isFirstFilesUpdate) {
					module.exports.osc.emit('initialized');
					isFirstFilesUpdate = false;
				}
			}
		}).catch(e => {
			log.error('Error updating files:', e);
		});
	});
}

function checkConnection() {
	if (connected.value) {
		return;
	}

	connection.info().catch(e => {
		log.error('Error checking connection:', e);
	});
}
