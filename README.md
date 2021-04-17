teams-autodisconnect
==============



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/autodisconnect.svg)](https://npmjs.org/package/autodisconnect)
[![Downloads/week](https://img.shields.io/npm/dw/autodisconnect.svg)](https://npmjs.org/package/autodisconnect)
[![License](https://img.shields.io/npm/l/autodisconnect.svg)](https://github.com/pcktm/teams-autodisconnect/blob/master/package.json)

* [Installation](#installation)
* [Setup](#setup)
* [Usage](#usage)

# Installation
1. Install *Node.js* from [here](https://nodejs.org/en/) or from your package repository of choice.
2. Open command line and run `$ npm install -g autodisconnect`. This will download and install latest version of `autodisconnect`

# Setup
This project uses [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) to connect to Microsoft Teams app, which is based on Electron. This approach relies on a condition that Teams are launched with a specific debugging flag set, enabling that is quite straightforward though:
* ##### On Windows:
    You need to launch `Teams.exe` executable with `--remote-debugging-port=56874` flag. The port is arbitrary, but `56874` is the default. The way I have it set up is I have a shortcut on the desktop with the above flag added to `Target`.
    You can usually find `Teams.exe` binary in `C:\Users\{username}\AppData\Local\Microsoft\Teams\current\Teams.exe`
* ##### On Linux / MacOS / FreeBSD / Whatever:
    You should follow the same procedure as above for Windows, I don't have a mac and I don't want to boot into Linux, if someone wants to, they can fill this out. All this boils down to running `Teams` with `--remote-debugging-port=56874` and should work on any platform that is capable of doing so.

# Usage

```sh-session
$ autodisconnect
[22:58:29] » i  info      Teams autodisconnect by @pcktm
[22:58:29] » √  success   Connected to Teams instance
[22:58:33] » ...  watching  There are currently 3 people in the meeting
[22:58:35] » ‼  warning   Threshold reached, leaving call...
[22:58:35] » √  success   Left successfully!

$ autodisconnect --help
USAGE
  $ autodisconnect

OPTIONS
  -h, --help                 show CLI help
  -o, --timeout=timeout      [default: 10] For how long to wait before activating (in minutes)
  -p, --port=port            [default: 56874] Chromium debugging port of Teams instance
  -t, --threshold=threshold  [default: 10] Max amount of people left in call for you to leave
  -v, --version              show CLI version
```

student piwo debil
