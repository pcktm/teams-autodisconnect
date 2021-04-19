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
        signale.fatal("Couldn't connect to Teams. Make sure you followed setup (https://github.com/pcktm/teams-autodisconnect#setup).");
        process.exit(-1);
      });

    if (teamsInstance) {
      signale.success('Connected!');

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
      let participants = 0;
      do {
        const peristentLogger = new Signale({interactive: true, config: {displayTimestamp: true}});
        await new Promise((r) => setTimeout(r, 2000));

        // This WILL most likely fail sometime, help needed, see issue #1
        const uibox = await meeting.$('div[data-tid="virtualized-tree-list"]');
        if (!uibox) {
          const btn = await meeting.$('button#roster-button');
          if (btn) btn.click();
          continue;
        }
        const title = await meeting.evaluate((element) => element.textContent, await uibox.$('span.ui-tree__title:last-of-type > div.ui-flex > span.ui-text')) as string;
        const num = title.match(/\((\d+)\)$/gi);
        if (!num || num.length === 0) {
          signale.error('Could not get attendee count');
          continue;
        }
        participants = Number(num[0].substring(1, num[0].length - 1));

        if (!participants) {
          throw new Error('Participant count was falsy which should never happen??');
        }

        peristentLogger.watch(`Detected ${participants} person(s) in the meeting. (threshold: ${flags.threshold})`);
      } while (participants > flags.threshold || participants === 0);

      signale.warn('Threshold reached, leaving call...');

      for (const selector of HANGUP_BUTTON_SELECTORS) {
        const leaveBtn = await meeting.$(selector);

        if (leaveBtn) {
          await leaveBtn.click();
        }
      }

      signale.success('Left successfully!');
      await teamsInstance.disconnect();
    }
  }
}
