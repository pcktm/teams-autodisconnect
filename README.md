teams-autodisconnect
==============



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/autodisconnect.svg)](https://npmjs.org/package/autodisconnect)
[![Downloads/week](https://img.shields.io/npm/dw/autodisconnect.svg)](https://npmjs.org/package/autodisconnect)
[![License](https://img.shields.io/npm/l/autodisconnect.svg)](https://github.com/pcktm/teams-autodisconnect/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g autodisconnect
$ autodisconnect
[22:58:29] » i  info      Teams autodisconnect by @pcktm
[22:58:29] » √  success   Connected to Teams instance
[22:58:33] » ...  watching  There are currently 3 people in the meeting
[22:58:35] » ‼  warning   Threshold reached, leaving call...
[22:58:35] » √  success   Left successfully!

$ autodisconnect --help [COMMAND]
USAGE
  $ autodisconnect

OPTIONS
  -h, --help                 show CLI help
  -o, --timeout=timeout      [default: 10] For how long to wait before activating (in minutes)
  -p, --port=port            [default: 56874] Chromium debugging port of Teams instance
  -t, --threshold=threshold  [default: 10] Max amount of people left in call for you to leave
  -v, --version              show CLI version
```
<!-- usagestop -->
