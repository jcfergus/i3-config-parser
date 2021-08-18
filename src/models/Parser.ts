import { WindowCriteria } from './Configuration';

/**
 * Represents an intermediate token created after the first pass through the spec file.
 */
export class IntermediateParserToken {
  constructor(
    public identifier: string,
    public tokens: string,
    public action: string
  ) {
  };
}

/**
 * Represents a token which will be parsed by the ConfigParser.  These are created based on the
 * config spec file.
 */
export class ConfigParserToken {
  constructor(
    public name: string,
    public identifier: string,
    public nextState: string,
    public configVar?: string,
    public args?: Array<{ arg: string, type: 'string' | 'long' | 'state' }>
  ) {
  };
}

/**
 * Holds a value which has been parsed from the config file - either a number or a string.  Tied to
 * a ConfigParserToken by 'identifier'.
 */
export class ParsedToken {
  constructor(public identifier: string,
              public val: { num?: number, str?: string },
              public type: 'string' | 'long') {
  };
}

/**
 * Holds the current state of the config parser.
 */
export class ParserContext {
  currentMatch?: string;
  stack!: Array<ParsedToken>;
  state!: string;
  hasErrors = false;
  savedContexts: Array<ParserContext> = [];
  criteria: WindowCriteria = {};
}
