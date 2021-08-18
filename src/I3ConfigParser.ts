import debug from 'debug';

import {
  IntermediateParserToken, ConfigParserToken, ParserContext, ParsedToken,
} from './models/Parser';
import { Configuration, ConfigurationItem, WindowCriteria } from './models/Configuration';

const dbg = debug('configulator:i3ConfigParser');

export default class I3ConfigParser {
  parserSpecLines: Array<string> = [];

  currentPreparserState = '';

  configParserStates: { [index: string]: Array<IntermediateParserToken> } = {};

  configParserTokens: { [index: string]: ConfigParserToken[] } = {};

  context: ParserContext = new ParserContext();

  configuration?: Configuration;

  variables: Record<string, string> = {};

  /**
   * Opens the spec file, and reads the contents a line at a time, passing each
   * line to `handleTokenLine`.
   *
   * @param tokenFile
   */
  /* async readTokens(tokenFile: string = this.specFile) {
    const tokenDataStream = readline.createInterface({
      input: fs.createReadStream(tokenFile),
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self: ConfigParser = this;

    return new Promise<void>((resolve, reject) => {
      tokenDataStream.on('line', (line: string) => {
        self.preprocessParserSpec(line);
      }).on('close', () => {
        this.processParserSpec();
        resolve();
      }).on('error', (error) => {
        reject(error);
      });
    });
  } */

  loadParserSpec(lines: Array<string>) {
    for (const line of lines) {
      this.preprocessParserSpec(line);
    }

    this.processParserSpec();
    this.generateParserTokens();
  }

  /**
   * Handles parsing the config spec file, a line at a time, skipping comments and empty lines, and joining
   * continued lines into into single lines, pushing them into the `lines` array.
   *
   * @param line
   */
  preprocessParserSpec(line: string) {
    // Ignore comments and empty lines.
    if ((/^\s*#/.exec(line)) || (/^\s*$/.exec(line))) {
      return;
    }

    if (/^\s+->/.exec(line)) {
      // Continuation line.
      const count = this.parserSpecLines?.length;
      if (this.parserSpecLines && count) {
        this.parserSpecLines[count - 1] = `${this.parserSpecLines[count - 1]}${line}`;
      }
    } else {
      this.parserSpecLines?.push(line);
    }
  }

  /**
   * Parses through the lines from the parser spec and distills it down to
   * intermediateParserTokens, and places them in `this.states.  Each state may have
   * multiple tokens.
   */
  processParserSpec() {
    // Loop through the lines one at a time.
    for (const line of this.parserSpecLines) {
      // If the line matches `state [NEWSTATE]`, then we're starting reading the spec for a different
      // state than the one we have been reading.
      const state: string | undefined = /^state ([A-Z0-9_]+):$/.exec(line)?.[1];

      if (state) {
        this.currentPreparserState = state;
        continue;
      }

      // This must be a new token definition.
      const tokenDefinition: RegExpExecArray | null = /^\s*([a-z_]+\s*=\s*|)(.*?)->\s*(.*)$/.exec(line);

      if (tokenDefinition) {
        // We should have parsed out two or three values - the identifier, the string of tokens/parameters, and the action.
        let identifier = tokenDefinition[1];
        const tokensStr = tokenDefinition[2];
        let action = tokenDefinition[3];

        // Get rid of white space in the identifier.
        if (identifier) {
          identifier = identifier.replace(/^\s*(\S+)\s*=\s*$/, '$1');
        }

        // If there was not an action parsed, then we're just returning to the current state after we've
        // parsed this token.
        if (!action || action.length === 0) {
          action = this.currentPreparserState ?? '';
        }

        // The tokens will be a comma-separated list; split them into an array.
        const tokens = tokensStr.split(',');

        // Then we'll create an intermediateParserToken with the same identifier and action for each token
        // specified.
        for (let token of tokens) {
          // Remove leading and following whitespace.
          token = token.replace(/^\s*/, '');
          token = token.replace(/\s*$/, '');

          // Create the token.
          const intermediateToken = new IntermediateParserToken(identifier, token, action);

          if (!this.configParserStates[this.currentPreparserState]) {
            this.configParserStates[this.currentPreparserState] = [];
          }
          this.configParserStates[this.currentPreparserState].push(intermediateToken);
        }
      }
    }
  }

  // state DEFAULT_BORDER_PIXELS:
  //   end
  //       -> call cfg_default_border($windowtype, $border, 2)
  //   width = number
  //       -> DEFAULT_BORDER_PIXELS_PX

  // state FLOATING_MODIFIER:
  //   modifiers = 'Mod1', 'Mod2', 'Mod3', 'Mod4', 'Mod5', 'Shift', 'Control', 'Ctrl'
  //       ->
  //   '+'
  //       ->
  //   end
  //       -> call cfg_floating_modifier($modifiers)

  // This should exist in this.states as a set of IntermediateToken:

  // {
  //   DEFAULT_BORDER_PIXELS: [
  //     IntermediateParserToken{
  //       identifier: ''
  //       tokens: "end"
  //       action: call cfg_default_border($windowtype, $border, 2)
  //     }
  //     IntermediateParserToken{
  //       identifier: width
  //       tokens: "number"
  //       action: DEFAULT_BORDER_PIXELS_PX
  //     }
  //   ],
  //   FLOATING_MODIFIER: [
  //     IntermediateParserToken{
  //       identifier: modifiers,
  //       tokens: "'Mod1', 'Mod2', 'Mod3', 'Mod4', 'Mod5', 'Shift', 'Control', 'Ctrl'",
  //       action: FLOATING_MODIFIER
  //     }
  //     IntermediateParserToken{
  //       identifier: "",
  //       tokens: "+",
  //       action: FLOATING_MODIFIER,
  //     }
  //     IntermediateParserToken{
  //       identifier: "",
  //       tokens: "end",
  //       action: __CALL,
  //     }
  //   ]
  // }

  // This should then become an entry in the configVarMap:
  // {
  //   DEFAULT_BORDER_PIXELS: [
  //     CallEntry{
  //       name: "end",
  //       identifier: "",
  //       nextState: "__CALL",
  //       configVar: "CFG_DEFAULT_BORDER"
  //     },
  //     CallEntry{
  //       name: "number",
  //       identifier: "width",
  //       nextState: "DEFAULT_BORDER_PIXELS_PX",
  //       configVar: undefined
  //     }
  //   ],
  //   FLOATING_MODIFIER: [
  //     CallEntry{
  //       name: "'Mod1",
  //       identifier: "modifiers",
  //       nextState: "FLOATING_MODIFIER",
  //       configVar: undefined,
  //     },
  //     ...
  //     CallEntry{
  //       name: "'Ctrl",
  //       identifier: "modifiers",
  //       nextState: "FLOATING_MODIFIER",
  //       configVar: undefined,
  //     },
  //     CallEntry{
  //       name: "'+",
  //       identifier: "",
  //       nextState: "FLOATING_MODIFIER",
  //       configVar: "",
  //     },
  //     CallEntry{
  //       name: "end",
  //       identifier: "",
  //       nextState: "__CALL",
  //       configVar: "FLOATING_MODIFIER",
  //     }
  //   ]
  // }

  // This converts the intermediateParserTokens in `this.state` into configParserTokens
  // and puts them in the map in configParserTokens.
  generateParserTokens() {
    for (const state of Object.keys(this.configParserStates).sort((a, b) => b.length - a.length || a.localeCompare(b))) {
      const intermediateTokens = this.configParserStates[state];
      const parserTokens = [];

      for (const token of intermediateTokens) {
        // Is it a 'call'?
        if (/^call /.exec(token.action)) {
          const command = /^call (.*)/.exec(token.action)?.[1];
          if (command) {
            // A 'call' can have `; NEXTSTATE` appended which means go to that state instead of 'INITIAL'.
            const nextState = /; ([A-Z_]+)$/.exec(command)?.[1] ?? 'INITIAL';

            // Remove the nextState from the command.
            command.replace(/; ([A-Z_]+)$/, '');

            const functionName = /([^(]+)\(/.exec(command)?.[1];
            let argStr = /[^(]+\(([^)]+)\)/.exec(command)?.[1];
            let args: Array<string> = [];

            let argsWithTypes: Array<{ arg: string, type: 'long' | 'string' | 'state' }> = [];
            if (argStr) {
              while (/\s+/.exec(argStr)) {
                argStr = argStr.replace(/\s+/, '');
              }
              args = argStr.split(',');
              argsWithTypes = args.map((arg) => {
                if (arg[0] === '&') {
                  return { arg: arg.substr(1), type: 'long' };
                } if (arg[0] === '$') {
                  return { arg: arg.substr(1), type: 'string' };
                }
                return { arg, type: 'state' };
              });
            }

            if (functionName) {
              const cpt = new ConfigParserToken(token.tokens, token.identifier, nextState, functionName.toUpperCase(), argsWithTypes);
              parserTokens.push(cpt);
            }
          }
        } else {
          parserTokens.push(new ConfigParserToken(token.tokens, token.identifier, token.action, undefined));
        }
      }

      this.configParserTokens[state] = parserTokens;
    }
  }

  /**
   * Pre-processor for config file, that parses the file looking for `set $foo bar`, and extracts the variable to
   * `this.variables[$foo] = bar`.
   *
   * @param ctx
   * @param input
   */
  extractVariables(input: string) {
    for (let i = 0; i < input.length; i++) {
      let j = i;
      while (input[j] !== '\n' && input[j] !== '\r') {
        j += 1;
      }
      if (input[j + 1] === '\r' || input[j + 1] === '\n') {
        j += 1;
      }

      const line = input.substring(i, j);

      i = j;

      // Ignore comments.
      if (/^#/.exec(line)) {
        continue;
      }

      const match = /^\s*set\s+(\$\w+)\s+(.*)\s*$/.exec(line);
      if (match) {
        this.variables[match[1]] = match[2];
      }
    }
  }

  /**
   * Pre-processor for config file that searches the config file for instances of each
   * key in `this.variables` and replaces it with the value for that key.
   *
   * @param input
   */
  substituteVariables(input: string) {
    for (const variable of Object.keys(this.variables).sort((a, b) => b.length - a.length || a.localeCompare(b))) {
      while (input.includes(variable)) {
        input = input.replace(variable, this.variables[variable]);
      }
    }

    return input;
  }

  pushState(token: ConfigParserToken) {
    const criteriaNextState = token.args?.find((a) => a.type === 'state');

    if (criteriaNextState) {
      this.context.state = criteriaNextState.arg;
      dbg('Overrode next state with criteriaNextState.');
    }
    const ctxCopy: ParserContext = JSON.parse(JSON.stringify(this.context)) as ParserContext;
    this.context.savedContexts.push(ctxCopy);
    this.context.state = token.nextState;
  }

  popState() {
    const restoredContext = this.context.savedContexts.pop();
    Object.assign(this.context, restoredContext ?? new ParserContext(), { criteria: this.context.criteria });
  }

  nextState(token: ConfigParserToken) {
    if (!this.context) {
      throw new Error('ParserContext not initialized.');
    }

    if (!this.configuration) {
      throw new Error('Configuration not initialized.');
    }

    const parsedItem: ParsedToken | undefined = this.context.stack?.find((x) => x.identifier === token.identifier);

    if (token.configVar) {
      if (token.configVar === 'CFG_CRITERIA_INIT') {
        dbg('Shelving state - current: ', this.context.state, '  new: ', token.nextState, '   tokname: ', token.name, '   tokval: ', parsedItem?.val);
        this.pushState(token);
      } else if (token.configVar === 'CFG_CRITERIA_POP_STATE') {
        const currentState = this.context.state;
        this.popState(); '';
        dbg('Unshelving state - current: ', currentState, '   new: ', this.context.state, '   tokname: ', token.name, '   tokval: ', parsedItem?.val);
      } else if (token.configVar === 'CFG_CRITERIA_ADD') {
        dbg('Adding criteria - currentState: ', this.context.state, '   new state: ', token.nextState, '   tokname: ', token.name, '   tokval: ', parsedItem?.val);
        const criterion: WindowCriteria = {};
        for (const arg of token.args ?? []) {
          criterion[arg.arg] = this.getArgValue(arg.arg, arg.type);
        }

        dbg('Found criterion: ', criterion);
        if (!this.context.criteria) {
          this.context.criteria = {};
        }
        if (criterion.ctype && criterion.cvalue) {
          this.context.criteria[criterion.ctype] = criterion.cvalue;
        } else {
          console.warn('Found non-conforming criterion: ', criterion);
        }

        this.context.state = token.nextState;
      } else {
        // Set the configurationValue with the parsed value from the stack.
        // const parsedItem: ParsedToken | undefined = ctx.stack.find(x => x.identifier === token.identifier);

        dbg('Setting configVar', token.configVar);

        if (parsedItem) {
          const configItem = new ConfigurationItem(token.configVar);

          if (parsedItem.type === 'string') {
            configItem.itemValue = parsedItem.val.str;
          } else {
            configItem.itemValue = parsedItem.val.num;
          }

          if (this.context.criteria) {
            configItem.itemCriteria = this.context.criteria;
            this.context.criteria = {};
          }

          if (token.args) {
            for (const arg of token.args) {
              configItem.itemArguments[arg.arg] = this.getArgValue(arg.arg, arg.type);
            }
          }

          this.configuration.items.push(configItem);
        }
        dbg('State change after token save: ', this.context.state, '->', token.nextState, '   tokname: ', token.name, '   tokval: ', parsedItem?.val);
        this.context.state = token.nextState;
      }
    } else {
      dbg('State Change with no action: ', this.context.state, '->', token.nextState, '  tokname: ', token.name, '   tokval: ', parsedItem?.val);
      this.context.state = token.nextState;
    }

    if (this.context.state === 'INITIAL') {
      this.context.stack = [];
    }
  }

  /**
   * Searches the context stack for the value of the specified argument and type.
   *
   * @param argName
   * @param argType
   */
  getArgValue(argName: string, argType: string): string | number | undefined {
    const stackEntry = this.context?.stack?.find((p) => p.identifier === argName);
    if (stackEntry) {
      if (argType === 'string') {
        return stackEntry.val.str;
      } if (argType === 'long') {
        return stackEntry.val.num;
      }
      console.error('Unknown argument type: ', argType);
    }
  }

  /**
   * This does the work of actually parsing the configuration file.  Takes the contents
   * of the file as a string, and sets the result in `this.configuration`.
   * @param input
   */

  doParseConfig(input: string): boolean {
    let tokenHandled = false;
    let lineCount = 1;

    this.context.state = 'INITIAL';

    for (let c = 0; c < input.length; c++) {
      // Skip whitespace before tokens
      if (input[c] === ' ' || input[c] === '\t') {
        continue;
      }

      for (const token of this.configParserTokens[this.context.state] ?? []) {
        // What kind of token are we dealing with?

        // If it starts with a single quote, it's a string literal.
        if (token.name[0] === '\'') {
          let unquotedTokenName = token.name;
          // Remove the quotes from the name.   TODO: Move this to pre-processor time.
          while (/\'/.exec(unquotedTokenName)) {
            unquotedTokenName = unquotedTokenName.replace(/\'/, '');
          }

          const str = input.substr(c, unquotedTokenName.length);

          if (str.toUpperCase() === unquotedTokenName.toUpperCase()) {
            if (token.identifier) {
              this.context.stack.push(new ParsedToken(token.identifier, { str }, 'string'));
            }

            // const currentToken = ctx.stack.pop();
            c = c + str.length - 1;

            this.nextState(token);

            tokenHandled = true;

            break;
          }
        } else if (token.name === 'number') {
          // It's a number.
          const start = c;

          while (/[0-9]/.exec(input[c])) {
            c += 1;
          }

          if (c > start) {
            const numStr = input.substring(start, c);
            const numVal = parseInt(numStr);

            if (token.identifier) {
              this.context.stack.push(new ParsedToken(token.identifier, { num: numVal }, 'long'));
            }
          } else {
            // No valid number found

          }
          // It's a word or a string.
        } else if (token.name === 'word' || token.name === 'string') {
          let start = c;
          // If the first character is a double quote, search until we find the matching closing
          // quotes.
          if (input[c] === '"') {
            c += 1;
            start = c;

            while (input[c] !== null && input[c] !== '"' && !(input[c] === '"' && input[c - 1] === '\\')) {
              c += 1;
            }

            // c = c + 1;
          } else if (token.name === 'string') {
            // Not a quoted string, so search until we find EOL.
            while (input[c] !== null && input[c] !== '\r' && input[c] !== '\n') {
              c += 1;
            }
          } else {
            // Otherwise it's a word, so search for whitespace, bracket, comma, semicolon, or newline.
            while (![' ', '\t', ']', ',', ';', '\r', '\n', null].includes(input[c])) {
              c += 1;
            }
          }

          // Replace escaped double quotes.
          let str;

          if (c > start) {
            str = input.substring(start, c);
            while (/\\"/.exec(str)) {
              str = str.replace(/\\"/, '"');
            }
          }

          if (token.identifier) {
            this.context.stack.push(new ParsedToken(token.identifier, { str }, 'string'));
          }

          // if (input[c] === '"') {
          //   c = c + 1;
          // }

          this.nextState(token);
          tokenHandled = true;
        } else if (token.name === 'line') {
          // It's a line.  Find the end of it.
          while (![null, '\n', '\r'].includes(input[c])) {
            c += 1;
          }

          this.nextState(token);
          tokenHandled = true;
          lineCount += 1;
          break;
        } else if (token.name === 'end') {
          // If it's a newline or the end of the input, then
          if ([null, '\n', '\r'].includes(input[c])) {
            this.nextState(token);
            tokenHandled = true;

            lineCount += 1;
            break;
          }
        }
      }

      if (!tokenHandled) {
        console.log('Parser error.'); // TODO
        this.context.hasErrors = true;
        this.context.stack = [];
      }
    }
    return true;
  }

  initializeParserContext(): boolean {
    this.context = new ParserContext();
    this.context.stack = [];
    this.context.state = 'INITIAL';

    return true;
  }

  parseConfig(configData: string): boolean {
    if (!this.configuration) {
      this.configuration = new Configuration();
    }

    if (!this.initializeParserContext()) {
      throw new Error('Context failed to initialize.');
    }

    this.extractVariables(configData);

    const substitutedConfigData = this.substituteVariables(configData);

    return this.doParseConfig(substitutedConfigData);
  }
}
