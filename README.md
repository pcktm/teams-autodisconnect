teams-autodisconnect
==============



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/autodisconnect.svg)](https://npmjs.org/package/autodisconnect)
[![Downloads/week](https://img.shields.io/npm/dw/autodisconnect.svg)](https://npmjs.org/package/autodisconnect)
[![License](https://img.shields.io/npm/l/autodisconnect.svg)](https://github.com/pcktm/teams-autodisconnect/blob/master/package.json)

Automatically leave MS Teams call when participant count falls below a customizable threshold. Follow through installation and setup and run `autodisconnect watch`. This will connect to Teams, wait for you to join a meeting (you can start it while in a meeting already though) and disconnect when participant count falls below some threshold.

- [teams-autodisconnect](#teams-autodisconnect)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)

# Installation
1. Install *Node.js* from [here](https://nodejs.org/en/) or from your package repository of choice.
2. Open command line and run `$ npm install -g autodisconnect`. This will download and install latest version of `autodisconnect`

# Setup
This project uses [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) to connect to Microsoft Teams app, which is based on Electron. This approach relies on a condition that Teams are launched with a specific debugging flag set, enabling it is quite straightforward though:
* ##### On Windows:
    You need to launch `Teams.exe` executable with `--remote-debugging-port=56874` flag. The port is arbitrary, but `56874` is the default. The way I have it set up is I have a shortcut on the desktop with the above flag added to `Target`.
    You can usually find `Teams.exe` binary in `C:\Users\{username}\AppData\Local\Microsoft\Teams\current\Teams.exe`
* ##### On Linux / MacOS / FreeBSD / Whatever:
    You should follow the same procedure as above for Windows, I don't have a mac and I don't want to boot into Linux, if someone wants to, they can fill this out. All this boils down to running `Teams` with `--remote-debugging-port=56874` and should work on any platform that is capable of doing so.

# Usage

```sh-session
$ autodisconnect watch
[22:58:29] » i  info      Teams autodisconnect by @pcktm
[22:58:29] » √  success   Connected to Teams instance
[22:58:33] » ...  watching  There are currently 3 people in the meeting
[22:58:35] » ‼  warning   Threshold reached, leaving call...
[22:58:35] » √  success   Left successfully!

$ autodisconnect --help
📞 Automatically leave MS Teams call when participant count falls below a customizable threshold.

VERSION
  autodisconnect/1.0.4 win32-x64 node-v14.15.5

USAGE
  $ autodisconnect [COMMAND]

COMMANDS
  help    display help for autodisconnect
  launch  launch MS Teams in debug mode
  watch   wait for a meeting and attach to it

$ autodisconnect watch --help
wait for a meeting and attach to it

USAGE
  $ autodisconnect watch

OPTIONS
  -o, --timeout=timeout                            [default: 10] For how long to wait before activating (in minutes)
  -p, --port=port                                  [default: 56874] Custom debugging port of Teams instance
  -t, --threshold=threshold                        [default: 10] Max amount of people left in call for you to leave
  --meetingPollingInterval=meetingPollingInterval  [default: 5] How often to check for a new meeting (in seconds)
```

student piwo debil
