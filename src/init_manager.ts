import FS from 'fs';
import { ObjUtil } from './util';
import FileManager from './file_manager';
import botLogger from './bot_logger';
import ConfigManager from './config_manager';
import DataManager from './data_manager';
import _ from 'lodash';

export default class InitManager {
  public static exampleExt = '.example.json';
  public static userExt = '.json';

  public static info(message: string): void {
    botLogger.info(message, 'InitManager');
  }

  public static warn(message: string): void {
    botLogger.warn(message, 'InitManager');
  }

  /** Gets the full file name of the given example file.
   *
   * @param fileName - The name of the example file to get the file name of.
   */
  public static getExampleFileName(fileName: string) {
    return fileName + this.exampleExt;
  }

  /** Gets the full file name of the given user file.
   *
   * @param fileName - The name of the user file to get the file name of.
   */
  public static getUserFileName(fileName: string) {
    return fileName + this.userExt;
  }

  /** Returns all file names in the given directory.
   *
   * @param path - The path of the directory to get the files in.
   */
  public static getFiles(path: string): string[] {
    return FS.readdirSync(path);
  }

  /** Returns all example file names in the given directory.
   *
   * @param path - The path of the directory to get the example files in.
   */
  public static getExampleFiles(path: string): string[] {
    const files = this.getFiles(path);

    const exampleRegex = /^(.*)\.example\.json$/;
    const exampleFiles = [];

    for (const file of files) {
      const match = exampleRegex.exec(file);
      if (match) {
        const fileName = match[1];
        exampleFiles.push(fileName);
      }
    }

    return exampleFiles;
  }

  /** Returns all user file names in the given directory.
   *
   * @param path - The path of the directory to get the user files in.
   */
  public static getUserFiles(path: string): string[] {
    const files = this.getFiles(path);

    const exampleRegex = /^(.*)\.example\.json$/;
    const jsonRegex = /^(.*)\.json$/;
    const userFiles = [];

    for (const file of files) {
      if (!exampleRegex.test(file)) {
        const match = jsonRegex.exec(file);
        if (match) {
          const fileName = match[1];
          userFiles.push(fileName);
        }
      }
    }

    return userFiles;
  }

  /** Determines whether the given file is in the given directory.
   *
   * @param path - The path of the directory to check for the file.
   * @param fileName - The name of the file to check for.
   */
  public static checkForFile(path: string, fileName: string): boolean {
    const files = FS.readdirSync(path);

    return files.includes(fileName);
  }

  /** Returns the names of all missing user files.
   *
   * @param path - The path of the director to check for missing user files.
   */
  public static missingUserFiles(path: string): string[] {
    const exampleFiles = this.getExampleFiles(path);
    const missingFiles = [];

    for (const file of exampleFiles) {
      if (!this.checkForFile(path, this.getUserFileName(file))) {
        missingFiles.push(file);
      }
    }

    return missingFiles;
  }

  /** Returns the names of all missing example files.
   *
   * @param path - The path of the director to check for missing example files.
   */
  public static missingExampleFiles(path: string): string[] {
    const userFiles = this.getUserFiles(path);
    const missingFiles = [];

    for (const file of userFiles) {
      if (!this.checkForFile(path, this.getExampleFileName(file))) {
        missingFiles.push(file);
      }
    }

    return missingFiles;
  }

  /** Adds all missing user files and returns the added file names.
   *
   * @param path - The path of the directory to add the missing user files in.
   */
  public static addMissingUserFiles(path: string): string[] {
    const missingUserFiles = this.missingUserFiles(path);

    for (const file of missingUserFiles) {
      const exampleFile = this.getExampleFileName(file);
      const userFile = this.getUserFileName(file);

      this.warn(
        `Didn't find '${FileManager.getFilePath(
          path,
          userFile,
        )}'. Copying defaults from '${FileManager.getFilePath(path, exampleFile)}'.`,
      );

      const content = FileManager.readFile(path, exampleFile);
      FileManager.writeFile(path, this.getUserFileName(file), content);
    }

    return missingUserFiles;
  }

  /** Adds all missing config files. */
  public static addMissingUserConfigs(): string[] {
    const configPath = ConfigManager.basePath;
    return this.addMissingUserFiles(configPath);
  }

  /** Adds all missing data files. */
  public static addMissingUserDatas(): string[] {
    const dataPath = DataManager.basePath;
    return this.addMissingUserFiles(dataPath);
  }

  public static checkForKey(object: any, keyPath: string[], key: string): boolean {
    let target = object;

    for (const path of keyPath) {
      target = target[path];
    }

    return target[key];
  }

  public static getMissingKeys(reference: any, object: any, path?: string[]): string[][] {
    const refTarget = ObjUtil.getInnerObject(reference, path);
    const objTarget = ObjUtil.getInnerObject(object, path);

    const refKeys = ObjUtil.keys(refTarget);
    const objKeys = ObjUtil.keys(objTarget);

    let missing: string[][] = [];
    const keyPath = path ? path : [];

    for (const key of refKeys) {
      if (key && objKeys.includes(key)) {
        const nextMissing = this.getMissingKeys(reference, object, keyPath.concat([key]));
        missing = missing.concat(nextMissing);
      } else {
        missing.push(keyPath.concat([key]));
      }
    }

    return missing;
  }

  public static addMissingKeys(reference: any, object: any): { object: any; keys: string[][] } {
    const missing = this.getMissingKeys(reference, object);
    let newObj = object;

    for (const path of missing) {
      const refInner = ObjUtil.getInnerObject(reference, path);
      newObj = _.set(newObj, path, refInner);
    }

    return { object: newObj, keys: missing };
  }

  public static addMissingUserKeys(path: string) {
    const exampleFiles = this.getExampleFiles(path);
    const userFiles = this.getUserFiles(path);

    for (const file of exampleFiles) {
      if (userFiles.includes(file)) {
        const expObj = FileManager.parseFile(path, this.getExampleFileName(file));
        const userObj = FileManager.parseFile(path, this.getUserFileName(file));

        const { object: newUserObj, keys: missingKeys } = this.addMissingKeys(expObj, userObj);
        if (missingKeys.length > 0) {
          const keyString = `    - ${missingKeys.map((path) => path.join(' > ')).join('\n    - ')}`;

          this.warn(
            `Found missing keys in '${this.getUserFileName(
              file,
            )}, replacing by default.\n${keyString}`,
          );
          FileManager.writeObject(path, this.getUserFileName(file), newUserObj);
        }
      }
    }
  }

  public static addMissingUserConfigKeys() {
    const configPath = ConfigManager.basePath;
    return this.addMissingUserKeys(configPath);
  }

  public static addMissingUserDataKeys() {
    const configPath = DataManager.basePath;
    return this.addMissingUserKeys(configPath);
  }

  /** Initializes and validates all config and data files. */
  public static initAll() {
    this.addMissingUserConfigKeys();
    this.addMissingUserDataKeys();
    this.addMissingUserConfigs();
    this.addMissingUserDatas();

    this.info('Finished initialization check.');
  }
}
