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
		const currentPointBodyRect = this.$.current.$.body.getBoundingClientRect();

		tl.to(this.$.current, 5, {
			x: `${percentCompleted * availableSpace}px`,
			ease: Linear.easeNone,
			callbackScope: this,
			onUpdate() {
				const availableLeftSpace = this.$.current._gsTransform.x;
				const availableRightSpace = availableSpace - this.$.current._gsTransform.x;
				const centeredOverhang = (currentPointBodyRect.width / 2) - 1.5;
				const leftDefecit = Math.max(centeredOverhang - availableLeftSpace, 0);
				const rightDefecit = Math.max(centeredOverhang - availableRightSpace, 0);
				const finalTransform = leftDefecit - rightDefecit;
				TweenLite.set(this.$.current.$.body, {x: finalTransform});
			}
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
