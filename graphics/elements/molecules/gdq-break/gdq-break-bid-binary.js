/**
 * @customElement
 * @polymer
 */
class GdqBreakBidBinary extends Polymer.Element {
	static get is() {
		return 'gdq-break-bid-binary';
	}

	static get properties() {
		return {};
	}

	ready() {
		super.ready();
		this._initPieChartSVG();
		TweenLite.set(this.$.winningOptionAmount, {opacity: 0, x: -36, color: 'transparent'});
		TweenLite.set(this.$.losingOptionAmount, {opacity: 0, x: 36, color: 'transparent'});
		TweenLite.set(this._svgDoc.node, {opacity: 0});
	}

	enter() {
		const tl = new TimelineLite();
		const winningPercent = this.bid.options[0].rawTotal / this.bid.rawTotal;
		const proxy = {percent: 0};

		tl.call(() => {
			this.$.winningOptionAmount.innerText = '$' + this.bid.options[0].rawTotal.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				useGrouping: false
			});
			this.$.losingOptionAmount.innerText = '$' + this.bid.options[1].rawTotal.toLocaleString('en-US', {
				maximumFractionDigits: 0,
				useGrouping: false
			});
		}, null, null, '+=0.03');

		tl.to([this.$.winningOptionAmount, this.$.losingOptionAmount], 0.384, {
			opacity: 1,
			x: 0,
			ease: Sine.easeOut
		});

		tl.call(() => {
			this.$.winningOptionAmount.style.color = '';
			this.$.losingOptionAmount.style.color = '';
			TypeAnims.type(this.$.winningOptionAmount);
			TypeAnims.type(this.$.losingOptionAmount);
		});

		tl.add(MaybeRandom.createTween({
			target: this._svgDoc.node.style,
			propName: 'opacity',
			duration: 0.465,
			ease: Power4.easeIn,
			start: {probability: 1, normalValue: 0},
			end: {probability: 0, normalValue: 1}
		}), '+=0.1');

		tl.to(proxy, 1, {
			percent: winningPercent,
			ease: Power3.easeInOut,
			callbackScope: this,
			onStart() {
				this._svgDoc.style({transform: `rotate(0.65turn)`});

				this.$.winningOptionName.innerText = this.bid.options[0].name || this.bid.options[0].description;
				this.$.losingOptionName.innerText = this.bid.options[1].name || this.bid.options[1].description;
				TypeAnims.type(this.$.winningOptionName);
				TypeAnims.type(this.$.losingOptionName);
			},
			onUpdate() {
				this.drawMagentaSlice(proxy.percent);
			}
		});

		return tl;
	}

	exit() {
		const tl = new TimelineLite();

		tl.add(MaybeRandom.createTween({
			target: this.style,
			propName: 'opacity',
			duration: 0.2,
			ease: Power4.easeIn,
			start: {probability: 1, normalValue: 1},
			end: {probability: 0, normalValue: 0}
		}));

		return tl;
	}

	_initPieChartSVG() {
		const svgDoc = SVG(this.$.chart);
		svgDoc.viewbox(-1, -1, 2, 2);
		this._svgDoc = svgDoc;

		svgDoc.circle(2).fill({color: '#03F0FF'}).move(-1, -1);
		this._magentaSlice = svgDoc.path().fill({color: '#FF0388'});
	}

	drawMagentaSlice(percent) {
		// Note the svg viewBox is offset so the center of the SVG is 0,0.
		const arcLength = 2 * Math.PI * percent;

		const startX = Math.cos(arcLength / -2);
		const startY = Math.sin(arcLength / -2);
		const endX = Math.cos(arcLength / 2);
		const endY = Math.sin(arcLength / 2);
		const largeArcFlag = percent > 0.5 ? 1 : 0;

		const d = [
			`M ${startX} ${startY}`,
			`A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
			'L 0 0'
		].join(` `);

		this._magentaSlice.plot(d);
	}
}

customElements.define(GdqBreakBidBinary.is, GdqBreakBidBinary);
