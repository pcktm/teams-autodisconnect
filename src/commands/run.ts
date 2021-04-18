import {Command, flags} from '@oclif/command';
import * as puppeteer from 'puppeteer-core';
import {Signale} from 'signale';

const HANGUP_BUTTON_SELECTORS = ['[data-tid="hangup-main-btn"]', '[data-tid="hangup-button"]', '#hangup-main-btn', '#hangup-button'];

export class Run extends Command {
  static description = 'wait for a meeting and attach to it';

  static flags = {
    meetingPollingInterval: flags.integer({default: 5, description: 'How often to check for a new meeting (in seconds)'}),
    threshold: flags.integer({char: 't', description: 'Max amount of people left in call for you to leave', default: 10}),
    timeout: flags.integer({char: 'o', description: 'For how long to wait before activating (in minutes)', default: 10}),
    port: flags.integer({char: 'p', description: 'Custom debugging port of Teams instance', default: 56874}),
  };

  async run() {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const {flags} = this.parse(Run);
    const signale = new Signale({config: {displayTimestamp: true}});

    const teamsInstance = await puppeteer.connect({browserURL: `http://127.0.0.1:${flags.port}`, defaultViewport: null})
      .catch(() => {
        signale.error("Couldn't connect to Teams. Make sure you run 'autodisconnect launch' first.");
        process.exit(-1);
      });

    if (teamsInstance) {
      signale.success('Connected to Teams instance');

      let meeting: puppeteer.Page | undefined;

      while (!meeting) {
        const pages = await teamsInstance.pages();
        const peristentLogger = new Signale({interactive: true, config: {displayTimestamp: true}});
        for (const page of pages) {
          for (const selector of HANGUP_BUTTON_SELECTORS) {
            if (await page.$(selector) !== null) {
              meeting = page;
              break;
            }
          }
        }
        peristentLogger.await('Awaiting a meeting...');
        await new Promise((r) => setTimeout(r, flags.meetingPollingInterval * 1000));
      }

      signale.success(`Found meeting: ${(await meeting.title()).split(' | ')[0]}`);
      let participants: puppeteer.ElementHandle[];
      do {
        const peristentLogger = new Signale({interactive: true, config: {displayTimestamp: true}});
        participants = await meeting.$$('li[data-tid^=participantsInCall]');
        if (participants.length === 0) {
          const btn = await meeting.$('button#roster-button');
          if (btn) btn.click();
        }

        peristentLogger.watch(`Detected ${participants.length} person(s) in the meeting`);

        await new Promise((r) => setTimeout(r, 2000));
      } while (participants.length > flags.threshold || participants.length === 0);

      signale.warn('Threshold reached, leaving call...');

      for (const selector of HANGUP_BUTTON_SELECTORS) {
        const leaveBtn = await meeting.$(selector);

        if (leaveBtn) {
          await leaveBtn.click();
          break;
        }
      }

      signale.success('Left successfully!');
      if (await teamsInstance.isConnected()) await teamsInstance.disconnect();
    }
  }
}
