# agdq18-layouts [![CircleCI](https://circleci.com/gh/GamesDoneQuick/agdq18-layouts.svg?style=svg&circle-token=b8e5c287d234a540e20ce7950ddaa4dff4474de4)](https://circleci.com/gh/GamesDoneQuick/agdq18-layouts)

> The on-stream graphics used during Awesome Games Done Quick 2018.

This is a [NodeCG](http://github.com/nodecg/nodecg) v0.9 bundle. You will need to have NodeCG v0.9 installed to run it.

## Video Breakdown
We unfortunately do not have time to make a video breakdown for this event's bundle. However, [we did make one for the last year's AGDQ](https://www.youtube.com/watch?v=vBAZXchbI3U&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx), which still has a few similarities with this one.

## Requirements
- [Node.js v7 or greater (v8 recommended)](https://nodejs.org/)
- [NodeCG v0.9.x](https://github.com/nodecg/nodecg/releases)

## Installation
1. Install to `nodecg/bundles/agdq18-layouts`.
2. Install `bower` if you have not already (`npm install -g bower`)
3. Install a compiler toolchain:
	- **WINDOWS**: Install [`windows-build-tools`](https://www.npmjs.com/package/windows-build-tools) to install the tools necessary to compile `agdq18-layouts`' dependencies.
	- **LINUX**: Install `build-essential` and Python 2.7, which are needed to compile `agdq18-layouts`' dependencies.
4. `cd nodecg/bundles/agdq18-layouts` and run `npm install --production`, then `bower install`
5. Create the configuration file (see the [configuration](#configuration) section below for more details)
6. Run the nodecg server: `node index.js` (or `nodecg start` if you have [`nodecg-cli`](https://github.com/nodecg/nodecg-cli) installed) from the `nodecg` root directory.

**Please note that by default, not all graphics will not work.** This is because `agdq18-layouts` makes use of several non-free plugins for [GSAP](https://greensock.com), which we cannot redistribute. If you wish to use all graphics in their current implementations, you will need to pay for access to [Club GreenSock](https://greensock.com/club) and save the following plugins to the following directories:
- [SplitText](https://greensock.com/SplitText): `shared/lib/vendor/SplitText.min.js`
- [CustomEase](https://greensock.com/customease): `shared/lib/vendor/CustomEase.min.js`
- [DrawSVGPlugin](https://greensock.com/drawSVG): `shared/lib/vendor/DrawSVGPlugin.min.js`

## Usage
This bundle is not intended to be used verbatim. Some of the assets have been replaced with placeholders, and most of the data sources are hardcoded. We are open-sourcing this bundle in hopes that people will use it as a learning tool and base to build from, rather than just taking and using it wholesale in their own productions.

To reiterate, please don't just download and use this bundle as-is. Build something new from it.

### Running a mock donation server
`agdq18-layouts` listens for donations in realtime, rather than polling the donation tracker for a new donation total. To facilitate testing,
we provide a small script that sends mock donations:

1. Add `"donationSocketUrl": "http://localhost:22341"` to your `nodecg/cfg/agdq18-layouts.json`
2. From the `nodecg/bundles/agdq18-layouts` folder, run `npm run mock-donations`
3. Run NodeCG (`nodecg start` or `node index.js` from the `nodecg` folder)

In production, you'd use [TipoftheHats/donation-socket-repeater](https://github.com/TipoftheHats/donation-socket-repeater) along with the "Postback URL" feature of [GamesDoneQuick/donation-tracker](https://github.com/GamesDoneQuick/donation-tracker).

### Lightning Round
[Lightning Round](https://github.com/GamesDoneQuick/lightning-round) is GDQ's system for gathering interview questions from Twitter. It exists in two parts: one part running "in the cloud" as a Firebase app, and one part running locally as part of this NodeCG bundle. 

Lightning Round is pretty weird and kind of difficult to set up. You can watch these videos for more information but please bear in mind that they are outdated, as they were made for AGDQ 2017, not AGDQ 2018:
- [Lightning Round Overview](https://www.youtube.com/watch?v=-qzIfS7KxCQ&index=4&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)
- [Lightning Round Setup Guide](https://www.youtube.com/watch?v=Uz_99-bJzyc&index=12&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)

## Configuration
To configure this bundle, create and edit `nodecg/cfg/agdq18-layouts.json`.  
Refer to [configschema.json](configschema.json) for the structure of this file.

## License
agdq18-layouts is provided under the Apache v2 license, which is available to read in the [LICENSE](LICENSE) file.

### Credits
Designed & developed by [Support Class](http://supportclass.net/)
 - [Alex "Lange" Van Camp](https://twitter.com/VanCamp/)  
 - [Chris Hanel](https://twitter.com/ChrisHanel)
