import FS from 'fs';

/** The available data files. */
export enum DATA {
  'SUBS',
  'UPDATER',
}

/** The data for one subscribing channel. */
export type subscriber = {
  /** The names of the games the channel subscribed to. */
  gameSubs: string[],
  /** The channel ID. */
  id: string,
  /** The prefix the channel uses */
  prefix: string,
};

/** The data for the subscribers. */
export type subscriber_data = {
  [index: string]: subscriber[],
  /** The discord subs. */
  discord: subscriber[],
  /** The telegram subs. */
  telegram: subscriber[],
};

/** The data for the updater. */
export type updater_data = {
  /** The time of the last update. */
  lastUpdate: string,
  /** The version string of the last dota patch. */
  lastDotaPatch: string,
};

/** The class managing the data files. */
export default class DataManager {
  /** The base path of the config files. */
  private static basePath = 'data';

  /** The file name of the updater config. */
  private static updaterFileName = 'updater_data';
  private static subscriberFileName = 'subscriber_data';

  /** Gets the name of the given file.
   *
   * @param file - The file to get the name of.
   */
  private static getFileName(file: DATA): string {
    switch (file) {
      case DATA.UPDATER:
        return this.updaterFileName;
      case DATA.SUBS:
        return this.subscriberFileName;
      default:
        throw Error('Unknown config file.');
    }
  }

  /** Gets the relative path of the given file.
   *
   * @param file - The file to get the path of.
   */
  private static getFilePath(file: DATA): string {
    const fileName = this.getFileName(file);
    return `${this.basePath}/${fileName}.json`;
  }

  /** Gets the relative path of the example of the given file.
   *
   * @param file  - The file to get the example path of.
   */
  private static getExampleFilePath(file: DATA): string {
    const fileName = this.getFileName(file);
    return `${this.basePath}/${fileName}.example.json`;
  }

  /** Reads the given file.
   *
   * @param file - The file to read.
   */
  private static readFile(file: DATA): string {
    return FS.readFileSync(this.getFilePath(file), 'utf8');
  }

  private static writeFile(file: DATA, content: string): void {
    FS.writeFileSync(this.getFilePath(file), content);
  }

  /** Reads the example of the given file.
   *
   * @param file - The file to read the example of.
   */
  private static readExampleFile(file: DATA): string {
    return FS.readFileSync(this.getExampleFilePath(file), 'utf8');
  }

  /** Parses the given file to a JSON object.
   *
   * @param file - The file to parse.
   */
  private static parseFile(file: DATA): any {
    return JSON.parse(this.readFile(file));
  }

  /** Writes an object to the given file.
   *
   * @param file - The file to write to.
   * @param object - The object to write to the file.
   */
  private static writeObject(file: DATA, object: any): void {
    return this.writeFile(file, JSON.stringify(object));
  }

  /** Parses the example of the given file to a JSON object.
   *
   * @param file - The file to parse the example of.
   */
  public static parseExampleFile(file: DATA): any {
    return JSON.parse(this.readExampleFile(file));
  }

  /** Gets the subscriber data as an object. */
  public static getSubscriberData(): subscriber_data {
    return this.parseFile(DATA.SUBS);
  }

  /** Sets the subscriber data. */
  public static setSubscriberData(data: subscriber_data): void {
    this.writeObject(DATA.SUBS, data);
  }

  /** Gets the updater data as an object. */
  public static getUpdaterData(): updater_data {
    return this.parseFile(DATA.UPDATER);
  }

  /** Sets the updater data. */
  public static setUpdaterData(data: updater_data): void {
    this.writeObject(DATA.UPDATER, data);
  }
}
