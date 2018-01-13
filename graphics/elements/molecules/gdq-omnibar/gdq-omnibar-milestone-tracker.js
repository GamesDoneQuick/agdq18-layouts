class GdqOmnibarMilestoneTracker extends Polymer.Element {
	static get is() {
		return 'gdq-omnibar-milestone-tracker';
	}

	static get properties() {
		return {
			currentTotal: Number,
			milestone: Object
		};
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
		TweenLite.set(this.$.nextGoalLabel, {x: '101%'});
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
			availableSpace,
			currentPointBodyRect
		});

		tl.to([
			this.$.start.$.line,
			this.$.end.$.line
		], 0.25, {
			scaleY: 1,
			ease: Power2.easeInOut
		});

		tl.to([
			this.$.start.$['body-content'],
			this.$.end.$['body-content'],
			this.$.nextGoalLabel
		], 0.75, {
			x: '0%',
			ease: Power2.easeInOut
		});

		tl.to(this.$.current.$.line, 0.25, {
			scaleY: 1,
			ease: Power2.easeInOut
		}, '+=0.08');

		tl.to(this.$.current.$['body-content'], 0.25, {
			x: '0%',
			ease: Power2.easeInOut
		});

		const fooTween = TweenLite.to([
			this.$.current,
			this.$.fill
		], 0.5 + (3 * percentCompleted), {
			x: `${percentCompleted * availableSpace}px`,
			ease: Power1.easeInOut,
			callbackScope: this,
			onUpdate(self) {
				this._updateCurrentBody({
					percent: self.progress(),
					startValue: this.milestone.precedingMilestone.total,
					endValue: this.currentTotal,
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

		tl.add(MaybeRandom.createTween({
			target: this.style,
			propName: 'opacity',
			duration: 0.465,
			start: {probability: 1, normalValue: 0},
			end: {probability: 0, normalValue: 0}
		}));

		return tl;
	}

	_updateCurrentBody({percent = 0, startValue = 0, endValue = 0, availableSpace, currentPointBodyRect}) {
		const availableLeftSpace = this.$.current._gsTransform.x;
		const availableRightSpace = availableSpace - this.$.current._gsTransform.x;
		const centeredOverhang = (currentPointBodyRect.width / 2) - 1.5;
		const leftDefecit = Math.max(centeredOverhang - availableLeftSpace, 0);
		const rightDefecit = Math.max(centeredOverhang - availableRightSpace, 0);
		const finalTransform = leftDefecit - rightDefecit;
		TweenLite.set(this.$.current.$.body, {x: finalTransform});

		const delta = endValue - startValue;
		this.$.current.amount = startValue + (delta * percent);
	}
}

customElements.define(GdqOmnibarMilestoneTracker.is, GdqOmnibarMilestoneTracker);
