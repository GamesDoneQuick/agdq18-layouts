class GdqTimekeeperRunner extends Polymer.Element {
	static get is() {
		return 'gdq-timekeeper-runner';
	}

	static get properties() {
		return {
			index: {
				type: Number
			},
			runner: {
				type: Object
			}
		};
	}

	calcRunnerStatus(results, index) {
		if (!results) {
			return;
		}

		if (results[index]) {
			return results[index].formatted;
		}

		return 'Running';
	}

	calcRunnerStatusClass(results, index) {
		if (!results) {
			return;
		}

		if (results[index] && !results[index].forfeit) {
			return 'finished';
		}

		return '';
	}

	calcFinishHidden(results, index) {
		if (!results) {
			return;
		}

		return results[index] && !results[index].forfeit;
	}

	calcResumeHidden(results, index) {
		if (!results) {
			return;
		}

		return !results[index];
	}

	calcForfeitHidden(results, index) {
		if (!results) {
			return;
		}

		return results[index] && results[index].forfeit;
	}

	calcEditDisabled(results, runnerIndex) {
		if (!results) {
			return;
		}

		return !results[runnerIndex];
	}

	finish() {
		nodecg.sendMessage('completeRunner', {index: this.index, forfeit: false});
	}

	forfeit() {
		nodecg.sendMessage('completeRunner', {index: this.index, forfeit: true});
	}

	resume() {
		nodecg.sendMessage('resumeRunner', this.index);
	}

	editTime() {
		this.dispatchEvent(new CustomEvent(`edit-time`, {bubbles: true, composed: true}));
	}
}

customElements.define(GdqTimekeeperRunner.is, GdqTimekeeperRunner);
