(function () {
	'use strict';

	const MAX_NOW_PLAYING_WIDTH = 764;
	const countdown = document.getElementById('countdown');
	const countdownMinutes = document.getElementById('countdownMinutes');
	const countdownSeconds = document.getElementById('countdownSeconds');
	const countdownColon = document.getElementById('countdownColon');
	const nowPlayingDisplay = document.getElementById('nowPlaying');
	const logo = document.getElementById('logo');
	const countdownTime = nodecg.Replicant('countdown');
	const countdownRunning = nodecg.Replicant('countdownRunning');
	const nowPlaying = nodecg.Replicant('nowPlaying');

	const colonFlashAnim = new TimelineMax({repeatDelay: 0.5});
	colonFlashAnim.set(countdownColon, {visibility: 'visible'});
	colonFlashAnim.set(countdownColon, {visibility: 'hidden'}, 0.5);

	const zeroFlashAnim = new TimelineMax({repeat: -1});
	zeroFlashAnim.set(countdown, {visibility: 'visible'});
	zeroFlashAnim.set(countdown, {visibility: 'hidden'}, 1);
	zeroFlashAnim.set(countdown, {visibility: 'visible'}, 2);

	countdownTime.on('change', newVal => {
		countdownMinutes.innerText = newVal.minutes < 10 ? `0${newVal.minutes}` : newVal.minutes;
		countdownSeconds.innerText = newVal.seconds < 10 ? `0${newVal.seconds}` : newVal.seconds;
		colonFlashAnim.play(0);

		if (newVal.raw <= 10) {
			countdown.style.color = '#ff0000';
		} else {
			countdown.style.color = '#00ff00';
		}

		if (newVal.raw === 0) {
			colonFlashAnim.play(0);
			colonFlashAnim.stop();
			zeroFlashAnim.play(0);
		} else {
			zeroFlashAnim.stop();
			countdown.style.visibility = 'visible';
		}
	});

	countdownRunning.on('change', newVal => {
		if (newVal) {
			colonFlashAnim.repeat(0);
		} else {
			colonFlashAnim.play(0);
			colonFlashAnim.repeat(-1);
		}
	});

	nowPlaying.on('change', newVal => {
		TweenLite.to(nowPlayingDisplay, 0.33, {
			opacity: 0,
			ease: Power1.easeInOut,
			onComplete() {
				if (!newVal || !newVal.title || !newVal.game) {
					return;
				}

				nowPlayingDisplay.innerText = `${newVal.title} - ${newVal.game}`;

				const width = nowPlayingDisplay.scrollWidth;
				if (width > MAX_NOW_PLAYING_WIDTH) {
					TweenLite.set(nowPlayingDisplay, {scaleX: MAX_NOW_PLAYING_WIDTH / width});
				} else {
					TweenLite.set(nowPlayingDisplay, {scaleX: 1});
				}

				TweenLite.to(nowPlayingDisplay, 0.33, {
					opacity: 1,
					ease: Power1.easeInOut
				});
			}
		});
	});

	/* Logo loop anim */
	// Gentle bobbing effect, repeats forever
	TweenMax.to(logo, 7, {
		scale: 0.82,
		ease: Power1.easeInOut,
		repeat: -1,
		yoyo: true
	});

	// Gentle rotation effect, repeats forever
	TweenMax.fromTo(logo, 8, {
		rotation: '-3deg'
	}, {
		rotation: '3deg',
		ease: Power1.easeInOut,
		repeat: -1,
		yoyo: true
	});
})();
