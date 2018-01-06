class GdqTimekeeperRunner extends Polymer.Element {
	static get is() {
		return 'gdq-timekeeper-runner';
	}

	static get properties() {
		return {
			importPath: String, // https://github.com/Polymer/polymer-linter/issues/71
			index: {
				type: Number
			},
			runner: {
				type: Object
			},
			results: Array
		};
	}

	calcRunnerStatus(results, index) {
		if (!results) {
			return;
		}

		if (results[index] && results[index].time) {
			return results[index].time.formatted;
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
