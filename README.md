# agdq18-layouts [![CircleCI](https://circleci.com/gh/GamesDoneQuick/agdq18-layouts.svg?style=svg&circle-token=f69384637611ff362b50e9023c57a6728ee20900)](https://circleci.com/gh/GamesDoneQuick/agdq18-layouts)
The on-stream graphics used during Summer Games Done Quick 2017.

This is a [NodeCG](http://github.com/nodecg/nodecg) v0.9 bundle. You will need to have NodeCG v0.9 installed to run it.

## Video Breakdown
We unfortunately do not have time to make a video breakdown for this event's bundle. 
However, [we did make one for the last event](https://www.youtube.com/watch?v=vBAZXchbI3U&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx), which still has a lot of similarities with this one,

## Requirements
- [NodeCG v0.9.x](https://github.com/nodecg/nodecg/releases)
- [Node.js v7 or greater](https://nodejs.org/)

## Installation
1. Install to `nodecg/bundles/agdq18-layouts`.
2. Install `bower` if you have not already (`npm install -g bower`)
3. Install a compiler toolchain:
	- **WINDOWS**: Install [`windows-build-tools`](https://www.npmjs.com/package/windows-build-tools) to install the tools necessary to compile `agdq18-layouts`' dependencies.
	- **LINUX**: Install `build-essential` and Python 2.7, which are needed to compile `agdq18-layouts`' dependencies.
4. `cd nodecg/bundles/agdq18-layouts` and run `npm install --production`, then `bower install`
5. Create the configuration file (see the [configuration][id] section below for more details)
6. Run the nodecg server: `nodecg start` (or `node index.js` if you don't have nodecg-cli) from the `nodecg` root directory.

Please note that you **must manually run `npm install` for this bundle**. NodeCG currently cannot reliably compile this bundle's npm dependencies. This is an issue we hope to address in the future.

**Please note that by default, the break screen graphic will not work.** This is because this graphic uses
a paid library called [SplitText](https://greensock.com/SplitText), which we cannot redistribute. If you wish to use the break screen with its current implementation, you will need to pay for access to SplitText and save a copy to `graphics/imports/SplitText.min.js`.

## Usage
This bundle is not intended to be used verbatim. Some of the assets have been replaced with placeholders, and most of the data sources are hardcoded. We are open-sourcing this bundle in hopes that people will use it as a learning tool and base to build from, rather than just taking and using it wholesale in their own productions.

To reiterate, please don't just download and use this bundle as-is. Build something new from it.

### Running a mock donation server
`agdq18-layouts` breaks from previous GDQ layout bundles in that it listens for donations in realtime,
rather than polling the donation tracker for a new donation total once a minute. To facilitate testing,
we provide a small script that sends mock donations:

1. Add `"donationSocketUrl": "http://localhost:22341"` to your `nodecg/cfg/agdq18-layouts.json`
2. From the `nodecg/bundles/agdq18-layouts` folder, run `npm run mock-donations`
3. Run NodeCG (`nodecg start` or `node index.js` from the `nodecg` folder)

In production, you'd use [TipoftheHats/donation-socket-repeater](https://github.com/TipoftheHats/donation-socket-repeater) along with the "Postback URL" feature of [GamesDoneQuick/donation-tracker](https://github.com/GamesDoneQuick/donation-tracker).

### Lightning Round
[Lightning Round](https://github.com/GamesDoneQuick/lightning-round) is a new system we made for AGDQ 2018 for gathering interview questions from Twitter. It exists in two parts: one part running "in the cloud" as a Firebase app, and one part running locally as part of this NodeCG bundle. 

Lightning Round is pretty weird and kind of difficult to set up. You can watch these videos for more information but please bear in mind that they are outdated, as they were made for AGDQ 2017, not AGDQ 2018:
- [Lightning Round Overview](https://www.youtube.com/watch?v=-qzIfS7KxCQ&index=4&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)
- [Lightning Round Setup Guide](https://www.youtube.com/watch?v=Uz_99-bJzyc&index=12&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)

## Configuration
To configure this bundle, create and edit `nodecg/cfg/agdq18-layouts.json`.  
Refer to [configschema.json](configschema.json) for the structure of this file.

Example config:
```json
{
	"useMockData": true,
	"displayDuration": 10,
	"osc": {
		"address": "192.168.1.10",
		"gameAudioChannels": [
			{
				"sd": 17,
				"hd": 25
			},
			{
				"sd": 19,
				"hd": 27
			},
			{
				"sd": 21,
				"hd": null
			},
			{
				"sd": 23,
				"hd": null
			}
		]
	},
	"twitter": {
		"enabled": true,
		"debug": false,
		"userId": "1234",
		"consumerKey": "aaa",
		"consumerSecret": "bbb",
		"accessTokenKey": "ccc",
		"accessTokenSecret": "ddd"
	},
	"twitch": {
		"debug": false,
		"channelId": "1234",
		"oauthToken": "aaaa",
		"titleTemplate": "EVENT NAME - ${gameName}",
		"clientId": "bbbb",
		"bitsOffset": "cccc"
	},
	"streamTitle": "",
	"footpedal": {
		"enabled": false,
		"buttonId": 31
	},
	"firebase": {
		"paste": "your",
		"firebase": "credentials",
		"into": "here"
	},
	"tracker": {
		"username": "aaa",
		"password": "bbb"
	},
	"adsPath": "just set this to any valid filepath unless you're actually using CasparCG"
}
```

## Troubleshooting
### I hear crackling in my USB audio devices when running agdq18-layouts
This can happen when `footpedal.enabled` is set to `true` in your `nodecg/cfg/agdq18-layouts`. The underlying code polls USB devices every 500ms, and on some devices this polling can cause crackling. To fix the crackling, set `footpedal.enabled` back to `false`. This unfortunately does mean that you will be unable to use the footpedal functionality.

### The break screen graphic doesn't work, and throws errors in the console.
This is because the break screen graphic uses a paid library called [SplitText](https://greensock.com/SplitText), which we cannot redistribute. If you wish to use the break screen, you will need to pay for access to SplitText and save a copy to `graphics/imports/SplitText.min.js`.

### I don't understand this CasparCG system
It's... pretty complex and was made in a very short amount of time. You're going to have to tough it out for now. It might be smoother after AGDQ2018.

## License
agdq18-layouts is provided under the Apache v2 license, which is available to read in the [LICENSE](LICENSE) file.

### Credits
Designed & developed by [Support Class](http://supportclass.net/)
 - [Alex "Lange" Van Camp](https://twitter.com/VanCamp/)  
 - [Chris Hanel](https://twitter.com/ChrisHanel)
