var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fs from 'fs';
import readline from 'readline';
import debug from 'debug';
import { IntermediateParserToken, ConfigParserToken, ParserContext, ParsedToken, } from './models/Parser';
import { Configuration, ConfigurationItem } from './models/Configuration';
var dbg = debug('configulator:i3ConfigParser');
var ConfigParser = /** @class */ (function () {
    function ConfigParser(configFile, specFile) {
        if (specFile === void 0) { specFile = 'i3ConfigParser.spec'; }
        this.configFile = configFile;
        this.specFile = specFile;
        this.parserSpecLines = [];
        this.currentPreparserState = '';
        this.configParserStates = {};
        this.configParserTokens = {};
        this.context = new ParserContext();
        this.variables = {};
    }
    /**
     * Opens the spec file, and reads the contents a line at a time, passing each
     * line to `handleTokenLine`.
     *
     * @param tokenFile
     */
    ConfigParser.prototype.readTokens = function (tokenFile) {
        if (tokenFile === void 0) { tokenFile = this.specFile; }
        return __awaiter(this, void 0, void 0, function () {
            var tokenDataStream, self;
            var _this = this;
            return __generator(this, function (_a) {
                tokenDataStream = readline.createInterface({
                    input: fs.createReadStream(tokenFile),
                });
                self = this;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        tokenDataStream.on('line', function (line) {
                            self.preprocessParserSpec(line);
                        }).on('close', function () {
                            _this.processParserSpec();
                            resolve();
                        }).on('error', function (error) {
                            reject(error);
                        });
                    })];
            });
        });
    };
    /**
     * Handles parsing the config spec file, a line at a time, skipping comments and empty lines, and joining
     * continued lines into into single lines, pushing them into the `lines` array.
     *
     * @param line
     */
    ConfigParser.prototype.preprocessParserSpec = function (line) {
        var _a, _b;
        // Ignore comments and empty lines.
        if ((/^\s*#/.exec(line)) || (/^\s*$/.exec(line))) {
            return;
        }
        if (/^\s+->/.exec(line)) {
            // Continuation line.
            var count = (_a = this.parserSpecLines) === null || _a === void 0 ? void 0 : _a.length;
            if (this.parserSpecLines && count) {
                this.parserSpecLines[count - 1] = "" + this.parserSpecLines[count - 1] + line;
            }
        }
        else {
            (_b = this.parserSpecLines) === null || _b === void 0 ? void 0 : _b.push(line);
        }
    };
    /**
     * Parses through the lines from the parser spec and distills it down to
     * intermediateParserTokens, and places them in `this.states.  Each state may have
     * multiple tokens.
     */
    ConfigParser.prototype.processParserSpec = function () {
        var _a, _b;
        // Loop through the lines one at a time.
        for (var _i = 0, _c = this.parserSpecLines; _i < _c.length; _i++) {
            var line = _c[_i];
            // If the line matches `state [NEWSTATE]`, then we're starting reading the spec for a different
            // state than the one we have been reading.
            var state = (_a = /^state ([A-Z0-9_]+):$/.exec(line)) === null || _a === void 0 ? void 0 : _a[1];
            if (state) {
                this.currentPreparserState = state;
                continue;
            }
            // This must be a new token definition.
            var tokenDefinition = /^\s*([a-z_]+\s*=\s*|)(.*?)->\s*(.*)$/.exec(line);
            if (tokenDefinition) {
                // We should have parsed out two or three values - the identifier, the string of tokens/parameters, and the action.
                var identifier = tokenDefinition[1];
                var tokensStr = tokenDefinition[2];
                var action = tokenDefinition[3];
                // Get rid of white space in the identifier.
                if (identifier) {
                    identifier = identifier.replace(/^\s*(\S+)\s*=\s*$/, '$1');
                }
                // If there was not an action parsed, then we're just returning to the current state after we've
                // parsed this token.
                if (!action || action.length === 0) {
                    action = (_b = this.currentPreparserState) !== null && _b !== void 0 ? _b : '';
                }
                // The tokens will be a comma-separated list; split them into an array.
                var tokens = tokensStr.split(',');
                // Then we'll create an intermediateParserToken with the same identifier and action for each token
                // specified.
                for (var _d = 0, tokens_1 = tokens; _d < tokens_1.length; _d++) {
                    var token = tokens_1[_d];
                    // Remove leading and following whitespace.
                    token = token.replace(/^\s*/, '');
                    token = token.replace(/\s*$/, '');
                    // Create the token.
                    var intermediateToken = new IntermediateParserToken(identifier, token, action);
                    if (!this.configParserStates[this.currentPreparserState]) {
                        this.configParserStates[this.currentPreparserState] = [];
                    }
                    this.configParserStates[this.currentPreparserState].push(intermediateToken);
                }
            }
        }
    };
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
    ConfigParser.prototype.generateParserTokens = function () {
        var _a, _b, _c, _d, _e;
        for (var _i = 0, _f = Object.keys(this.configParserStates).sort(function (a, b) { return b.length - a.length || a.localeCompare(b); }); _i < _f.length; _i++) {
            var state = _f[_i];
            var intermediateTokens = this.configParserStates[state];
            var parserTokens = [];
            for (var _g = 0, intermediateTokens_1 = intermediateTokens; _g < intermediateTokens_1.length; _g++) {
                var token = intermediateTokens_1[_g];
                // Is it a 'call'?
                if (/^call /.exec(token.action)) {
                    var command = (_a = /^call (.*)/.exec(token.action)) === null || _a === void 0 ? void 0 : _a[1];
                    if (command) {
                        // A 'call' can have `; NEXTSTATE` appended which means go to that state instead of 'INITIAL'.
                        var nextState = (_c = (_b = /; ([A-Z_]+)$/.exec(command)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : 'INITIAL';
                        // Remove the nextState from the command.
                        command.replace(/; ([A-Z_]+)$/, '');
                        var functionName = (_d = /([^(]+)\(/.exec(command)) === null || _d === void 0 ? void 0 : _d[1];
                        var argStr = (_e = /[^(]+\(([^)]+)\)/.exec(command)) === null || _e === void 0 ? void 0 : _e[1];
                        var args = [];
                        var argsWithTypes = [];
                        if (argStr) {
                            while (/\s+/.exec(argStr)) {
                                argStr = argStr.replace(/\s+/, '');
                            }
                            args = argStr.split(',');
                            argsWithTypes = args.map(function (arg) {
                                if (arg[0] === '&') {
                                    return { arg: arg.substr(1), type: 'long' };
                                }
                                if (arg[0] === '$') {
                                    return { arg: arg.substr(1), type: 'string' };
                                }
                                return { arg: arg, type: 'state' };
                            });
                        }
                        if (functionName) {
                            var cpt = new ConfigParserToken(token.tokens, token.identifier, nextState, functionName.toUpperCase(), argsWithTypes);
                            parserTokens.push(cpt);
                        }
                    }
                }
                else {
                    parserTokens.push(new ConfigParserToken(token.tokens, token.identifier, token.action, undefined));
                }
            }
            this.configParserTokens[state] = parserTokens;
        }
    };
    /**
     * Pre-processor for config file, that parses the file looking for `set $foo bar`, and extracts the variable to
     * `this.variables[$foo] = bar`.
     *
     * @param ctx
     * @param input
     */
    ConfigParser.prototype.extractVariables = function (input) {
        for (var i = 0; i < input.length; i++) {
            var j = i;
            while (input[j] !== '\n' && input[j] !== '\r') {
                j += 1;
            }
            if (input[j + 1] === '\r' || input[j + 1] === '\n') {
                j += 1;
            }
            var line = input.substring(i, j);
            i = j;
            // Ignore comments.
            if (/^#/.exec(line)) {
                continue;
            }
            var match = /^\s*set\s+(\$\w+)\s+(.*)\s*$/.exec(line);
            if (match) {
                this.variables[match[1]] = match[2];
            }
        }
    };
    /**
     * Pre-processor for config file that searches the config file for instances of each
     * key in `this.variables` and replaces it with the value for that key.
     *
     * @param input
     */
    ConfigParser.prototype.substituteVariables = function (input) {
        for (var _i = 0, _a = Object.keys(this.variables).sort(function (a, b) { return b.length - a.length || a.localeCompare(b); }); _i < _a.length; _i++) {
            var variable = _a[_i];
            while (input.includes(variable)) {
                input = input.replace(variable, this.variables[variable]);
            }
        }
        return input;
    };
    ConfigParser.prototype.pushState = function (token) {
        var _a;
        var criteriaNextState = (_a = token.args) === null || _a === void 0 ? void 0 : _a.find(function (a) { return a.type === 'state'; });
        if (criteriaNextState) {
            this.context.state = criteriaNextState.arg;
            dbg('Overrode next state with criteriaNextState.');
        }
        var ctxCopy = JSON.parse(JSON.stringify(this.context));
        this.context.savedContexts.push(ctxCopy);
        this.context.state = token.nextState;
    };
    ConfigParser.prototype.popState = function () {
        var restoredContext = this.context.savedContexts.pop();
        Object.assign(this.context, restoredContext !== null && restoredContext !== void 0 ? restoredContext : new ParserContext(), { criteria: this.context.criteria });
    };
    ConfigParser.prototype.nextState = function (token) {
        var _a, _b;
        if (!this.context) {
            throw new Error('ParserContext not initialized.');
        }
        if (!this.configuration) {
            throw new Error('Configuration not initialized.');
        }
        var parsedItem = (_a = this.context.stack) === null || _a === void 0 ? void 0 : _a.find(function (x) { return x.identifier === token.identifier; });
        if (token.configVar) {
            if (token.configVar === 'CFG_CRITERIA_INIT') {
                dbg('Shelving state - current: ', this.context.state, '  new: ', token.nextState, '   tokname: ', token.name, '   tokval: ', parsedItem === null || parsedItem === void 0 ? void 0 : parsedItem.val);
                this.pushState(token);
            }
            else if (token.configVar === 'CFG_CRITERIA_POP_STATE') {
                var currentState = this.context.state;
                this.popState();
                '';
                dbg('Unshelving state - current: ', currentState, '   new: ', this.context.state, '   tokname: ', token.name, '   tokval: ', parsedItem === null || parsedItem === void 0 ? void 0 : parsedItem.val);
            }
            else if (token.configVar === 'CFG_CRITERIA_ADD') {
                dbg('Adding criteria - currentState: ', this.context.state, '   new state: ', token.nextState, '   tokname: ', token.name, '   tokval: ', parsedItem === null || parsedItem === void 0 ? void 0 : parsedItem.val);
                var criterion = {};
                for (var _i = 0, _c = (_b = token.args) !== null && _b !== void 0 ? _b : []; _i < _c.length; _i++) {
                    var arg = _c[_i];
                    criterion[arg.arg] = this.getArgValue(arg.arg, arg.type);
                }
                dbg('Found criterion: ', criterion);
                if (!this.context.criteria) {
                    this.context.criteria = {};
                }
                if (criterion.ctype && criterion.cvalue) {
                    this.context.criteria[criterion.ctype] = criterion.cvalue;
                }
                else {
                    console.warn('Found non-conforming criterion: ', criterion);
                }
                this.context.state = token.nextState;
            }
            else {
                // Set the configurationValue with the parsed value from the stack.
                // const parsedItem: ParsedToken | undefined = ctx.stack.find(x => x.identifier === token.identifier);
                dbg('Setting configVar', token.configVar);
                if (parsedItem) {
                    var configItem = new ConfigurationItem(token.configVar);
                    if (parsedItem.type === 'string') {
                        configItem.itemValue = parsedItem.val.str;
                    }
                    else {
                        configItem.itemValue = parsedItem.val.num;
                    }
                    if (this.context.criteria) {
                        configItem.itemCriteria = this.context.criteria;
                        this.context.criteria = {};
                    }
                    if (token.args) {
                        for (var _d = 0, _e = token.args; _d < _e.length; _d++) {
                            var arg = _e[_d];
                            configItem.itemArguments[arg.arg] = this.getArgValue(arg.arg, arg.type);
                        }
                    }
                    this.configuration.items.push(configItem);
                }
                dbg('State change after token save: ', this.context.state, '->', token.nextState, '   tokname: ', token.name, '   tokval: ', parsedItem === null || parsedItem === void 0 ? void 0 : parsedItem.val);
                this.context.state = token.nextState;
            }
        }
        else {
            dbg('State Change with no action: ', this.context.state, '->', token.nextState, '  tokname: ', token.name, '   tokval: ', parsedItem === null || parsedItem === void 0 ? void 0 : parsedItem.val);
            this.context.state = token.nextState;
        }
        if (this.context.state === 'INITIAL') {
            this.context.stack = [];
        }
    };
    /**
     * Searches the context stack for the value of the specified argument and type.
     *
     * @param argName
     * @param argType
     */
    ConfigParser.prototype.getArgValue = function (argName, argType) {
        var _a, _b;
        var stackEntry = (_b = (_a = this.context) === null || _a === void 0 ? void 0 : _a.stack) === null || _b === void 0 ? void 0 : _b.find(function (p) { return p.identifier === argName; });
        if (stackEntry) {
            if (argType === 'string') {
                return stackEntry.val.str;
            }
            if (argType === 'long') {
                return stackEntry.val.num;
            }
            console.error('Unknown argument type: ', argType);
        }
    };
    /**
     * This does the work of actually parsing the configuration file.  Takes the contents
     * of the file as a string, and sets the result in `this.configuration`.
     * @param input
     */
    ConfigParser.prototype.parseConfig = function (input) {
        var _a;
        var tokenHandled = false;
        var lineCount = 1;
        this.context.state = 'INITIAL';
        for (var c = 0; c < input.length; c++) {
            // Skip whitespace before tokens
            if (input[c] === ' ' || input[c] === '\t') {
                continue;
            }
            for (var _i = 0, _b = (_a = this.configParserTokens[this.context.state]) !== null && _a !== void 0 ? _a : []; _i < _b.length; _i++) {
                var token = _b[_i];
                // What kind of token are we dealing with?
                // If it starts with a single quote, it's a string literal.
                if (token.name[0] === '\'') {
                    var unquotedTokenName = token.name;
                    // Remove the quotes from the name.   TODO: Move this to pre-processor time.
                    while (/\'/.exec(unquotedTokenName)) {
                        unquotedTokenName = unquotedTokenName.replace(/\'/, '');
                    }
                    var str = input.substr(c, unquotedTokenName.length);
                    if (str.toUpperCase() === unquotedTokenName.toUpperCase()) {
                        if (token.identifier) {
                            this.context.stack.push(new ParsedToken(token.identifier, { str: str }, 'string'));
                        }
                        // const currentToken = ctx.stack.pop();
                        c = c + str.length - 1;
                        this.nextState(token);
                        tokenHandled = true;
                        break;
                    }
                }
                else if (token.name === 'number') {
                    // It's a number.
                    var start = c;
                    while (/[0-9]/.exec(input[c])) {
                        c += 1;
                    }
                    if (c > start) {
                        var numStr = input.substring(start, c);
                        var numVal = parseInt(numStr);
                        if (token.identifier) {
                            this.context.stack.push(new ParsedToken(token.identifier, { num: numVal }, 'long'));
                        }
                    }
                    else {
                        // No valid number found
                    }
                    // It's a word or a string.
                }
                else if (token.name === 'word' || token.name === 'string') {
                    var start = c;
                    // If the first character is a double quote, search until we find the matching closing
                    // quotes.
                    if (input[c] === '"') {
                        c += 1;
                        start = c;
                        while (input[c] !== null && input[c] !== '"' && !(input[c] === '"' && input[c - 1] === '\\')) {
                            c += 1;
                        }
                        // c = c + 1;
                    }
                    else if (token.name === 'string') {
                        // Not a quoted string, so search until we find EOL.
                        while (input[c] !== null && input[c] !== '\r' && input[c] !== '\n') {
                            c += 1;
                        }
                    }
                    else {
                        // Otherwise it's a word, so search for whitespace, bracket, comma, semicolon, or newline.
                        while (![' ', '\t', ']', ',', ';', '\r', '\n', null].includes(input[c])) {
                            c += 1;
                        }
                    }
                    // Replace escaped double quotes.
                    var str = void 0;
                    if (c > start) {
                        str = input.substring(start, c);
                        while (/\\"/.exec(str)) {
                            str = str.replace(/\\"/, '"');
                        }
                    }
                    if (token.identifier) {
                        this.context.stack.push(new ParsedToken(token.identifier, { str: str }, 'string'));
                    }
                    // if (input[c] === '"') {
                    //   c = c + 1;
                    // }
                    this.nextState(token);
                    tokenHandled = true;
                }
                else if (token.name === 'line') {
                    // It's a line.  Find the end of it.
                    while (![null, '\n', '\r'].includes(input[c])) {
                        c += 1;
                    }
                    this.nextState(token);
                    tokenHandled = true;
                    lineCount += 1;
                    break;
                }
                else if (token.name === 'end') {
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
    };
    ConfigParser.prototype.initializeParserContext = function () {
        this.context = new ParserContext();
        this.context.stack = [];
        this.context.state = 'INITIAL';
        return true;
    };
    ConfigParser.prototype.readAndParseConfig = function () {
        if (!this.configuration) {
            this.configuration = new Configuration();
        }
        var configData = fs.readFileSync(this.configFile, {
            encoding: 'utf8',
        });
        this.initializeParserContext();
        if (!this.context) {
            throw new Error('Context failed to initialized.');
        }
        this.extractVariables(configData);
        configData = this.substituteVariables(configData);
        return this.parseConfig(configData);
    };
    return ConfigParser;
}());
export { ConfigParser };
