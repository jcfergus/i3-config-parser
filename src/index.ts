import ConfigParser from './I3ConfigParser';
import { Configuration, ConfigurationItem, WindowCriteria } from './models/Configuration';

const CURRENT_I3_CONFIG_SPEC_VERSION = '4.19.2';
const SPECFILE_PATH = `${__dirname}/parser-spec/${CURRENT_I3_CONFIG_SPEC_VERSION}/config.spec`;

export {
  CURRENT_I3_CONFIG_SPEC_VERSION,
  SPECFILE_PATH,
  ConfigParser,
  Configuration,
  ConfigurationItem,
  WindowCriteria,
};
