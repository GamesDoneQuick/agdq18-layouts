(function () {
	'use strict';

	const $screenHeaderText = document.querySelector('#screenHeader .shadow');
	const $screenTransition = document.getElementById('screen-transition');
	const $bids = document.querySelector('gdq-break-bids');
	const $prizes = document.querySelector('gdq-break-prizes');
	const currentPrizes = nodecg.Replicant('currentPrizes');
	const currentBids = nodecg.Replicant('currentBids');
	const NUM_TO_DECLARE = 2;
	const STATIC_HOLD_DURATION = 667;
	const STATIC_FADE_DURATION = 333;
	let declaredCounter = 0;
	let loopStarted = false;
	let lastShown;

	currentPrizes.once('change', checkDeclared);
	currentBids.once('change', checkDeclared);

	/**
	 * Starts the loop once NUM_TO_DECLARE replicants have been declared.
	 * @returns {undefined}
	 */
	function checkDeclared() {
		if (loopStarted) {
			return;
		}

		declaredCounter++;
		if (declaredCounter >= NUM_TO_DECLARE) {
			loopStarted = true;
			loop();
		}
	}

	/**
	 * The main bids and prizes loop. Only call it once, it will call itself after that.
	 * @returns {undefined}
	 */
	function loop() {
		let numToShow = 2;
		if (!$bids.hasContent()) {
			numToShow--;
		}

		if (!$prizes.hasContent()) {
			numToShow--;
		}

		switch (numToShow) {
			case 2: {
				if (lastShown === $bids) {
					$screenTransition.style.opacity = 0;
				} else {
					promiseStatic().then(() => {
						setScreenHeader($bids.screenHeader);
						$bids.removeAttribute('hidden');
						$prizes.setAttribute('hidden', 'true');
					});
				}

				lastShown = $bids;
				$bids.showContent().then(() => {
					if ($prizes.hasContent()) {
						$prizes.preloadFirstImage();
						return promiseStatic().then(() => {
							setScreenHeader($prizes.screenHeader);
							$bids.setAttribute('hidden', 'true');
							$prizes.removeAttribute('hidden');
							lastShown = $prizes;
							return $prizes.showContent();
						});
					}
				}).then(loop);

				break;
			}

			case 1: {
				let $el = $bids;
				if (!$bids.hasContent()) {
					$el = $prizes;
				}

				if (lastShown === $el) {
					$screenTransition.style.opacity = 0;
					lastShown = $el;
					$el.showContent().then(loop);
				} else {
					$prizes.preloadFirstImage();
					promiseStatic().then(() => {
						setScreenHeader($el.screenHeader);
						$el.removeAttribute('hidden');

						if (lastShown) {
							lastShown.setAttribute('hidden', 'true');
						}

						lastShown = $el;
						$el.showContent().then(loop);
					});
				}

				break;
			}

			default: {
				// If nothing to show, show static.
				// Then, check if there are any bids or prizes to show once every second.
				// Once there are, fade out the static and restart the loop.
				$screenTransition.style.opacity = 1;
				const interval = setInterval(() => {
					if ($bids.hasContent() || $prizes.hasContent()) {
						clearInterval(interval);
						loop();
					}
				}, 1000);
			}
		}
	}

	/**
	 * Changes the text content of the header above the main screen, where bids and prizes are shown.
	 * Fades the text out, changes it, then fades it back in.
	 * @param {string} newText - The text to put in the header.
	 * @returns {TweenLite} - A TweenLite animation.
	 */
	function setScreenHeader(newText) {
		return TweenLite.to($screenHeaderText, 0.333, {
			opacity: 0,
			ease: Power1.easeIn,
			onComplete() {
				$screenHeaderText.innerText = newText;
				TweenLite.to($screenHeaderText, 0.333, {
					opacity: 1,
					ease: Power1.easeOut
				});
			}
		});
	}

	/**
	 * Shows the static transition, holds it, then hides it.
	 * @returns {Promise} - A promise that resolves as soon as the static has finished entering,
	 * so that you can do work while the static hides the jank. The static will begin exiting
	 * STATIC_HOLD_DURATION milliseconds after the promise is resolved, and the exit itself
	 * takes STATIC_FADE_DURATION milliseconds.
	 */
	function promiseStatic() {
		return new Promise(resolve => {
			$screenTransition.style.opacity = 1;

			setTimeout(resolve, STATIC_FADE_DURATION);

			setTimeout(() => {
				$screenTransition.style.opacity = 0;
			}, STATIC_HOLD_DURATION);
		});
	}

	// Logo anim
	const LOGO_FADE_INTERVAL = 20;
	const LOGO_FADE_DURATION = 1;
	const LOGO_FADE_OUT_EASE = Power1.easeIn;
	const LOGO_FADE_IN_EASE = Power1.easeOut;
	const $gdqLogo = document.getElementById('gdqLogo');
	const $charityLogo = document.getElementById('charityLogo');
	const logoTL = new TimelineMax({repeat: -1});

	logoTL.to($gdqLogo, LOGO_FADE_DURATION, {
		opacity: 1,
		ease: LOGO_FADE_IN_EASE
	});

	logoTL.to($gdqLogo, LOGO_FADE_DURATION, {
		opacity: 0,
		ease: LOGO_FADE_OUT_EASE
	}, `+=${LOGO_FADE_INTERVAL}`);

	logoTL.to($charityLogo, LOGO_FADE_DURATION, {
		opacity: 1,
		ease: LOGO_FADE_IN_EASE
	});

	logoTL.to($charityLogo, LOGO_FADE_DURATION, {
		opacity: 0,
		ease: LOGO_FADE_OUT_EASE
	}, `+=${LOGO_FADE_INTERVAL}`);

	window.addEventListener('DOMContentLoaded', () => {
		TweenLite.to(document.body, 0.333, {
			opacity: 1,
			ease: Power1.easeOut
		});
	});
})();
