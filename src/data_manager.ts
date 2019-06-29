import FileManager from './file_manager';

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

  /** Parses the given file to a JSON object.
   *
   * @param file - The file to parse.
   */
  private static parseFile(file: DATA): any {
    return FileManager.parseFile(this.basePath, this.getFileName(file));
  }

  /** Writes an object to the given file.
   *
   * @param file - The file to write to.
   * @param object - The object to write to the file.
   */
  private static writeObject(file: DATA, object: any): void {
    return FileManager.writeObject(this.basePath, this.getFileName(file), object);
  }

  // Data getters and setters

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
