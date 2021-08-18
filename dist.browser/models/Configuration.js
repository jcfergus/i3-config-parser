var ConfigurationItem = /** @class */ (function () {
    function ConfigurationItem(itemName, itemValue, itemArguments, itemCriteria) {
        if (itemArguments === void 0) { itemArguments = {}; }
        this.itemName = itemName;
        this.itemValue = itemValue;
        this.itemArguments = itemArguments;
        this.itemCriteria = itemCriteria;
    }
    return ConfigurationItem;
}());
export { ConfigurationItem };
var Configuration = /** @class */ (function () {
    function Configuration(items) {
        if (items === void 0) { items = []; }
        this.items = items;
    }
    ;
    return Configuration;
}());
export { Configuration };
