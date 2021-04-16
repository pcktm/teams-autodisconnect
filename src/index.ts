import {Command, flags} from '@oclif/command';
import * as puppeteer from 'puppeteer-core';
import {Signale} from 'signale';

class Autodisconnect extends Command {
  static description = 'describe the command here';

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    threshold: flags.integer({char: 't', description: 'Max amount of people left in call for you to leave', default: 10}),
    timeout: flags.integer({char: 'o', description: 'For how long to wait before activating (in minutes)', default: 10}),
    port: flags.integer({char: 'p', description: 'Chromium debugging port of Teams instance', default: 56874}),
  };

  async run() {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const {flags} = this.parse(Autodisconnect);
    const signale = new Signale({config: {displayTimestamp: true}});
    signale.info('Teams autodisconnect by @pcktm');

    const teamsInstance = await puppeteer.connect({browserURL: `http://127.0.0.1:${flags.port}`, defaultViewport: null})
      .catch(() => {
        signale.fatal('Could not connect to Teams instance, make sure you started teams with the debugging flag and that the port is correct.');
        process.exit(-1);
      });

    signale.success('Connected to Teams instance');

    const pages = await teamsInstance.pages();

    let meeting: puppeteer.Page | undefined;

    for (const page of pages) {
      if (await page.$('[data-tid="hangup-main-btn"]') !== null) {
        meeting = page;
      }
    }

    if (!meeting) {
      signale.fatal("You're not in a meeting!");
      process.exit(-1);
    }

    signale.success(`Found meeting: ${(await meeting.title()).split(' | ')[0]}`);

    let participants:puppeteer.ElementHandle[];
    do {
      const peristentLogger = new Signale({interactive: true, config: {displayTimestamp: true}});
      participants = await meeting.$$('li[data-tid^=participantsInCall]');

      // for (const p of participants) {
      //   const name = await meeting.evaluate((element) => element.textContent, await p.$('span.ui-text'));
      //   signale.debug(name);
      // }

      peristentLogger.watch(`There are currently ${participants.length} people in the meeting`);

      // Wait for 2 seconds since I don't want to flood the channel
      await new Promise((r) => setTimeout(r, 2000));
    } while (participants.length > -2);

    signale.info('Gracefully shutting down...');
    await teamsInstance.disconnect();
  }
}

export = Autodisconnect;
