class GdqOmnibarMilestoneTracker extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-milestone-tracker';
	}

	static get properties() {
		return {};
	}

	enter() {
		const tl = new TimelineLite();

		const milestoneStart = this.milestone.precedingMilestone.total;
		const percentCompleted = (this.currentTotal - milestoneStart) / (this.milestone.total - milestoneStart);
		const availableSpace =
			this.$.body.getBoundingClientRect().width -
			this.$.current.$.line.clientWidth;

		console.log('percentCompleted: %f, availableSpace: %f', percentCompleted, availableSpace);

		tl.set(this.$.current, {
			left: `${percentCompleted * availableSpace}px`
		});

		tl.call(() => {
			this.$.current._alignChanged('auto');
		});

		tl.to({}, 1000, {});

		return tl;
	}

	exit() {
		const tl = new TimelineLite();

		tl.to({}, 100, {});

		return tl;
	}
}

customElements.define(GdqOmnibarMilestoneTracker.is, GdqOmnibarMilestoneTracker);
