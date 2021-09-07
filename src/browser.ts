import ConfigParser from './I3ConfigParser';
import { Configuration, ConfigurationItem, WindowCriteria } from './models/Configuration';
import specFile from './parser-spec/4.19.2/config.spec';

const CURRENT_I3_CONFIG_SPEC_VERSION = '4.19.2';
const SPECFILE_PATH = specFile;

export {
  SPECFILE_PATH,
  CURRENT_I3_CONFIG_SPEC_VERSION,
  ConfigParser,
  Configuration,
  ConfigurationItem,
  WindowCriteria,
};
