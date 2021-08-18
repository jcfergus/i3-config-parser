import fs from 'fs';
import I3ConfigParser from './I3ConfigParser';
import { Configuration } from './models/Configuration';

export default class I3ConfigFileParser {
  public configParser?: I3ConfigParser;

  get configuration(): Configuration | undefined {
    return this.configParser?.configuration;
  }

  public async parseConfigFromFile(configFile: string) {
    if (!this.configParser) {
      throw new Error('Parser not initialized.');
    }

    const configFileData = await fs.promises.readFile(configFile);
    const configData = configFileData.toString();

    this.configParser.parseConfig(configData);
  }

  public async loadConfigSpecFromFile(specFile: string): Promise<I3ConfigFileParser> {
    const specFileData = await fs.promises.readFile(specFile);
    const lines = specFileData.toString().split('\n');

    this.configParser = new I3ConfigParser();
    this.configParser.loadParserSpec(lines);

    return this;
  }
}
