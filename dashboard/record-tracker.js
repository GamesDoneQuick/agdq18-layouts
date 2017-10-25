(function () {
	'use strict';

	const $toggle = document.getElementById('toggle');
	const recordTrackerEnabled = nodecg.Replicant('recordTrackerEnabled');

	recordTrackerEnabled.on('change', newVal => {
		$toggle.checked = newVal;
	});

	$toggle.addEventListener('change', e => {
		recordTrackerEnabled.value = e.target.checked;
	});
})();
