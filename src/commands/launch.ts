import {Command, flags} from '@oclif/command';

export default class Launch extends Command {
  static description = 'launch MS Teams in debug mode';

  static flags = {
    port: flags.integer({char: 'p', description: 'Custom debugging port of Teams instance'}),
  };

  static args = [{name: 'file'}];

  async run() {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const {args, flags} = this.parse(Launch);
  }
}
