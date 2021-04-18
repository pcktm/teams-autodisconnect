import {Command, flags} from '@oclif/command';
import * as puppeteer from 'puppeteer-core';
import {Signale} from 'signale';
import {sync as commandExistsSync} from 'command-exists';
import {spawn} from 'child_process';
import {Socket} from 'net';
import {lookup as psLookup, kill as psKill} from 'ps-node';

const FREE_PORTS_RESOLUTION_THRESHOLD: number = 60;
const TEAMS_SUBPROCESS_STARTUP_DELAY_MS: number = 6000;
const MEETING_STATUS_POLL_DELAY_MS: number = 5000;

const HANGUP_BUTTON_SELECTORS: string[] = ['[data-tid="hangup-main-btn"]', '[data-tid="hangup-button"]', '#hangup-main-btn', '#hangup-button'];

const findFreePortBelow = async (port: number, call: number = 0):Promise<number> => new Promise((resolve, reject) => {
  if (call <= FREE_PORTS_RESOLUTION_THRESHOLD) {
    const socket = new Socket();

    const timeout = () => {
      resolve(port);
      socket.destroy();
    };

    const next = () => {
      socket.destroy();
      resolve(findFreePortBelow(port - 1, call + 1));
    };

    setTimeout(timeout, 200);
    socket.on('timeout', timeout);

    socket.on('connect', () => {
      next();
    });

    socket.on('error', (exception:any) => {
      if (exception.code === 'ECONNREFUSED') {
        resolve(port);
      } else {
        next();
      }
    });

    socket.connect(port, '0.0.0.0');
  } else {
    reject(new Error('Maximum free port resolution attempts achieved'));
  }
});

class Autodisconnect extends Command {
  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    threshold: flags.integer({char: 't', description: 'Max amount of people left in call for you to leave', default: 10}),
    timeout: flags.integer({char: 'o', description: 'For how long to wait before activating (in minutes)', default: 10}),
    port: flags.integer({char: 'p', description: 'Chromium debugging port of Teams instance', default: 56874}),
  };

  async run(overridePort?:number) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const {flags} = this.parse(Autodisconnect);
    const signale = new Signale({config: {displayTimestamp: true}});

    // show branding only once per run
    if (overridePort === undefined) { signale.info('Teams autodisconnect by @pcktm'); }

    const teamsInstance = await puppeteer.connect({browserURL: `http://127.0.0.1:${overridePort ?? flags.port}`, defaultViewport: null})
      .catch(() => {
        if (overridePort === undefined && commandExistsSync('teams')) {
          signale.info('Teams are not running in debug mode, but the binary is on PATH. Attempting to re/start them in debug mode');

          (new Promise((resolve, reject) => {
            findFreePortBelow(flags.port).then((port) => {
              new Promise<void>((resolvePS, rejectPS) => {
                psLookup({command: 'teams'}, (err, resultList) => {
                  if (err) {
                    rejectPS(err);
                  }

                  const process = resultList[0];

                  if (process) {
                    signale.info(`Teams process already running. Attempting to kill its process with PID ${process.pid} & start in debug mode`);

                    psKill(process.pid, (killErr) => {
                      if (killErr) {
                        rejectPS(killErr);
                      } else {
                        resolvePS();
                      }
                    });
                  } else {
                    resolvePS();
                  }
                });
              }).then(() => {
                const prc = spawn('teams', [`--remote-debugging-port=${port}`]);

                signale.info(`Teams subprocess spawned automatically in debug mode, on automatically-resolved port ${port}, now waiting ${TEAMS_SUBPROCESS_STARTUP_DELAY_MS} milliseconds for them to get ready...`);

                let isOk: boolean = true;

                prc.on('exit', (code) => {
                  if (code !== 0) isOk = false;
                });

                prc.on('error', () => isOk = false);

                setTimeout(() => {
                  if (isOk) {
                    resolve(this.run(port));
                  } else {
                    reject(new Error('Teams subprocess has crashed'));
                  }
                }, TEAMS_SUBPROCESS_STARTUP_DELAY_MS);
              }).catch((err) => reject(err));
            }).catch((err) => reject(err));
          })).catch((err) => {
            signale.fatal('Could not start Teams automatically, start them with debugging flag manually', err);
            process.exit(-1);
          });
        } else {
          signale.fatal('Could not connect to Teams instance & could not find Teams executable on PATH, make sure you started teams'
            + ' with the debugging flag and that the port is correct or put them on PATH for this program to start them automatically.');
          process.exit(-1);
        }
      });

    if (teamsInstance) {
      signale.success('Connected to Teams instance');

      const pollForMeeting = async () => {
        const pages = await teamsInstance.pages();

        let meeting: puppeteer.Page | undefined;

        for (const page of pages) {
          for (const selector of HANGUP_BUTTON_SELECTORS) {
            if (await page.$(selector) !== null) {
              meeting = page;

              break;
            }
          }
        }

        if (meeting) {
          signale.success(`Found meeting: ${(await meeting.title()).split(' | ')[0]}`);

          let participants: puppeteer.ElementHandle[];
          do {
            const peristentLogger = new Signale({interactive: true, config: {displayTimestamp: true}});
            participants = await meeting.$$('li[data-tid^=participantsInCall]');
            if (participants.length === 0) {
              const btn = await meeting.$('button#roster-button');
              if (btn) btn.click();
            }

            // for (const p of participants) {
            //   const name = await meeting.evaluate((element) => element.textContent, await p.$('span.ui-text'));
            //   signale.debug(name);
            // }

            peristentLogger.watch(`There are currently ${participants.length} people in the meeting`);

            // Wait 2 seconds
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

          signale.info('Gracefully shutting down...');

          if (await teamsInstance.isConnected()) await teamsInstance.disconnect();
        } else {
          signale.warn(`You're not in a meeting at the moment. Re-checking that in ${MEETING_STATUS_POLL_DELAY_MS} milliseconds...`);

          setTimeout(async () => {
            await pollForMeeting();
          }, MEETING_STATUS_POLL_DELAY_MS);
        }
      };

      await pollForMeeting();
    }
  }
}

export = Autodisconnect;
