class GdqOmnibarMilestoneTracker extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-milestone-tracker';
	}

	static get properties() {
		return {};
	}

	ready() {
		super.ready();

		TweenLite.set([
			this.$.start.$.line,
			this.$.current.$.line,
			this.$.end.$.line
		], {
			scaleY: 0
		});

		TweenLite.set(this.$.current, {x: 0});
		TweenLite.set(this.$.start.$['body-content'], {x: '100%'});
		TweenLite.set(this.$.current.$['body-content'], {x: '-105%'});
		TweenLite.set(this.$.end.$['body-content'], {x: '-100%'});
		TweenLite.set(this.$.nextGoalLabel, {x: '100%'});
	}

	enter(displayDuration) {
		const tl = new TimelineLite();

		const milestoneStart = this.milestone.precedingMilestone.total;
		const percentCompleted = (this.currentTotal - milestoneStart) / (this.milestone.total - milestoneStart);
		const availableSpace =
			this.$.body.getBoundingClientRect().width -
			this.$.current.$.line.clientWidth;
		const currentPointBodyRect = this.$.current.$.body.getBoundingClientRect();
		this._updateCurrentBody({
			percent: 0,
			currentTotal: this.currentTotal,
			availableSpace,
			currentPointBodyRect
		});

		tl.to([
			this.$.start.$.line,
			this.$.end.$.line
		], 0.25, {
			scaleY: 1,
			ease: Linear.easeNone
		});

		tl.to([
			this.$.start.$['body-content'],
			this.$.end.$['body-content'],
			this.$.nextGoalLabel
		], 0.25, {
			x: '0%',
			ease: Linear.easeNone
		});

		tl.to(this.$.current.$.line, 0.25, {
			scaleY: 1,
			ease: Linear.easeNone
		}, '+=0.08');

		tl.to(this.$.current.$['body-content'], 0.25, {
			x: '0%',
			ease: Linear.easeNone
		});

		const fooTween = TweenLite.to(this.$.current, 2.5, {
			x: `${percentCompleted * availableSpace}px`,
			ease: Linear.easeNone,
			callbackScope: this,
			onUpdate(self) {
				this._updateCurrentBody({
					percent: self.progress(),
					currentTotal: this.currentTotal,
					availableSpace,
					currentPointBodyRect
				});
			},
			onUpdateParams: ['{self}']
		});
		tl.add(fooTween);

		tl.to({}, displayDuration, {});

		return tl;
	}

	exit() {
		const tl = new TimelineLite();

		tl.to({}, 1, {});

		return tl;
	}

	_updateCurrentBody({percent = 0, currentTotal, availableSpace, currentPointBodyRect}) {
		const availableLeftSpace = this.$.current._gsTransform.x;
		const availableRightSpace = availableSpace - this.$.current._gsTransform.x;
		const centeredOverhang = (currentPointBodyRect.width / 2) - 1.5;
		const leftDefecit = Math.max(centeredOverhang - availableLeftSpace, 0);
		const rightDefecit = Math.max(centeredOverhang - availableRightSpace, 0);
		const finalTransform = leftDefecit - rightDefecit;
		TweenLite.set(this.$.current.$.body, {x: finalTransform});
		//this.$.current.amount = currentTotal * percent;
	}
}

customElements.define(GdqOmnibarMilestoneTracker.is, GdqOmnibarMilestoneTracker);
