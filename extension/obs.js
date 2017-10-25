'use strict';

// Native
const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

// Packages
const OBSUtility = require('nodecg-utility-obs');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

// We track what _layout_ is active, not necessarily what _scene_ is active.
// A given layout can be on multiple scenes.
const currentLayout = nodecg.Replicant('gdq:currentLayout');
const autoCycleRecordings = nodecg.Replicant('autoCycleRecordings');
const autoUploadRecordings = nodecg.Replicant('autoUploadRecordings');
const streamingOBS = new OBSUtility(nodecg, {namespace: 'streamingOBS'});
const recordingOBS = new OBSUtility(nodecg, {namespace: 'recordingOBS'});
const uploadScriptPath = nodecg.bundleConfig.youtubeUploadScriptPath;
let uploadScriptRunning = false;

if (uploadScriptPath) {
	let stats;
	try {
		stats = fs.lstatSync(uploadScriptPath);
	} catch (e) {
		if (e.code === 'ENOENT') {
			throw new Error(`Configured youtubeUploadScriptPath (${uploadScriptPath}) does not exist.`);
		} else {
			throw e;
		}
	}

	if (!stats.isFile()) {
		throw new Error(`Configured youtubeUploadScriptPath (${uploadScriptPath}) is not a file.`);
	}

	nodecg.log.info('Automatic VOD uploading enabled.');
} else {
	autoCycleRecordings.value = false;
}

autoCycleRecordings.on('change', newVal => {
	nodecg.log.info('Automatic cycling of recordings %s.', newVal ? 'ENABLED' : 'DISABLED');
	if (!newVal) {
		autoUploadRecordings.value = false;
	}
});

autoUploadRecordings.on('change', newVal => {
	nodecg.log.info('Automatic uploading of recordings %s.', newVal ? 'ENABLED' : 'DISABLED');
});

streamingOBS.replicants.programScene.on('change', newVal => {
	if (!newVal) {
		return;
	}

	newVal.sources.some(source => {
		if (!source.name) {
			return false;
		}

		const lowercaseSourceName = source.name.toLowerCase();
		if (lowercaseSourceName.indexOf('layout') === 0) {
			currentLayout.value = lowercaseSourceName.replace(/ /g, '_').replace('layout_', '');
			return true;
		}

		return false;
	});
});

function cycleRecording(obs) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(`Timed out waiting for ${obs.namespace} to stop recording.`));
		}, 10000);

		const recordingStoppedListener = () => {
			obs.log.info('Recording stopped.');
			clearTimeout(timeout);

			setTimeout(() => {
				resolve();
			}, 2500);
		};

		obs.once('RecordingStopped', recordingStoppedListener);
		obs.stopRecording().catch(error => {
			if (error.error === 'recording not active') {
				obs.removeListener('RecordingStopped', recordingStoppedListener);
				resolve();
			} else {
				obs.log.error(error);
				reject(error);
			}
		});
	}).then(() => {
		return obs.startRecording();
	});
}

module.exports = {
	resetCropping() {
		return streamingOBS.send('ResetCropping').catch(error => {
			nodecg.log.error('resetCropping error:', error);
		});
	},

	setCurrentScene(sceneName) {
		return streamingOBS.setCurrentScene({
			'scene-name': sceneName
		});
	},

	async cycleRecordings() {
		nodecg.log.info('Cycling recordings...');

		const cycleRecordingPromises = [];
		if (recordingOBS._connected) {
			cycleRecordingPromises.push(cycleRecording(recordingOBS));
		} else {
			nodecg.log.error('Recording OBS is disconnected! Not cycling its recording.');
		}

		if (streamingOBS._connected) {
			cycleRecordingPromises.push(cycleRecording(streamingOBS));
		} else {
			nodecg.log.error('Streaming OBS is disconnected! Not cycling its recording.');
		}

		if (cycleRecordingPromises.length <= 0) {
			nodecg.log.warn('Neither instance of OBS is connected, aborting cycleRecordings.');
			return;
		}

		await Promise.all(cycleRecordingPromises);

		nodecg.log.info('Recordings successfully cycled.');

		if (uploadScriptPath && autoUploadRecordings.value && !uploadScriptRunning) {
			uploadScriptRunning = true;
			nodecg.log.info('Executing upload script...');
			exec(`python "${uploadScriptPath}"`, {
				cwd: path.parse(uploadScriptPath).dir
			}, (error, stdout, stderr) => {
				uploadScriptRunning = false;

				if (error) {
					nodecg.log.error('Upload script failed:', error);
					return;
				}

				if (stderr) {
					nodecg.log.error('Upload script failed:', stderr);
					return;
				}

				if (stdout.trim().length > 0) {
					nodecg.log.info('Upload script ran successfully:', stdout.trim());
				} else {
					nodecg.log.info('Upload script ran successfully.');
				}
			});
		}
	},

	get streamingOBSConnected() {
		return streamingOBS._connected;
	}
};
