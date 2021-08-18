/**
 * Represents an intermediate token created after the first pass through the spec file.
 */
var IntermediateParserToken = /** @class */ (function () {
    function IntermediateParserToken(identifier, tokens, action) {
        this.identifier = identifier;
        this.tokens = tokens;
        this.action = action;
    }
    ;
    return IntermediateParserToken;
}());
export { IntermediateParserToken };
/**
 * Represents a token which will be parsed by the ConfigParser.  These are created based on the
 * config spec file.
 */
var ConfigParserToken = /** @class */ (function () {
    function ConfigParserToken(name, identifier, nextState, configVar, args) {
        this.name = name;
        this.identifier = identifier;
        this.nextState = nextState;
        this.configVar = configVar;
        this.args = args;
    }
    ;
    return ConfigParserToken;
}());
export { ConfigParserToken };
/**
 * Holds a value which has been parsed from the config file - either a number or a string.  Tied to
 * a ConfigParserToken by 'identifier'.
 */
var ParsedToken = /** @class */ (function () {
    function ParsedToken(identifier, val, type) {
        this.identifier = identifier;
        this.val = val;
        this.type = type;
    }
    ;
    return ParsedToken;
}());
export { ParsedToken };
/**
 * Holds the current state of the config parser.
 */
var ParserContext = /** @class */ (function () {
    function ParserContext() {
        this.hasErrors = false;
        this.savedContexts = [];
        this.criteria = {};
    }
    return ParserContext;
}());
export { ParserContext };
