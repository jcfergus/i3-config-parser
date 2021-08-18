
export class ConfigurationItem {
  constructor(public itemName: string,
              public itemValue?: string | number | undefined,
              public itemArguments: { [index: string]: number | string | undefined } = {},
              public itemCriteria?: WindowCriteria ) {}
}

export class Configuration {
  constructor( public items: Array<ConfigurationItem> = [] ) {};
}

export type WindowCriteria = { [index: string]: string | number | undefined };
