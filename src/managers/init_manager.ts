import FS from 'fs';
import _ from 'lodash';
import { ObjUtil } from '../util/util';
import FileManager from './file_manager';
import Logger from '../logger';
import ConfigManager from './config_manager';
import DataManager from './data_manager';

export default class InitManager {
  public static logger = new Logger('Init Manager');
  public static exampleExt = '.example.json';
  public static userExt = '.json';

  /** Gets the full file name of the given example file.
   *
   * @param fileName - The name of the example file to get the file name of.
   */
  public static getExampleFileName(fileName: string): string {
    return fileName + this.exampleExt;
  }

  /** Gets the full file name of the given user file.
   *
   * @param fileName - The name of the user file to get the file name of.
   */
  public static getUserFileName(fileName: string): string {
    return fileName + this.userExt;
  }

  /** Returns all example file names in the given directory.
   *
   * @param path - The path of the directory to get the example files in.
   */
  public static getExampleFiles(path: string): string[] {
    const files = FileManager.getFiles(path);

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
    const files = FileManager.getFiles(path);

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

      InitManager.logger.warn(
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

  public static getMissingKeys(
    reference: Record<string, unknown>,
    object: Record<string, unknown>,
    path?: string[],
  ): string[][] {
    const refTarget = ObjUtil.getInnerObject(reference, path);
    const objTarget = ObjUtil.getInnerObject(object, path);

    const refKeys = ObjUtil.keys(refTarget);
    const objKeys = ObjUtil.keys(objTarget);

    let missing: string[][] = [];
    const keyPath = path || [];

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

  public static addMissingKeys(
    reference: Record<string, unknown>,
    object: Record<string, unknown>,
  ): { object: Record<string, unknown>; keys: string[][] } {
    const missing = this.getMissingKeys(reference, object);
    let newObj = object;

    for (const path of missing) {
      const refInner = ObjUtil.getInnerObject(reference, path);
      newObj = _.set(newObj, path, refInner);
    }

    return { object: newObj, keys: missing };
  }

  public static addMissingUserKeys(path: string): void {
    const exampleFiles = this.getExampleFiles(path);
    const userFiles = this.getUserFiles(path);

    for (const file of exampleFiles) {
      if (userFiles.includes(file)) {
        const expObj = FileManager.parseFile(path, this.getExampleFileName(file));
        const userObj = FileManager.parseFile(path, this.getUserFileName(file));

        const { object: newUserObj, keys: missingKeys } = this.addMissingKeys(expObj, userObj);
        if (missingKeys.length > 0) {
          const keyString = `    - ${missingKeys
            .map((missingKey) => missingKey.join(' > '))
            .join('\n    - ')}`;

          InitManager.logger.warn(
            `Found missing keys in '${this.getUserFileName(
              file,
            )}, replacing by default.\n${keyString}`,
          );
          FileManager.writeObject(path, this.getUserFileName(file), newUserObj);
        }
      }
    }
  }

  public static addMissingUserConfigKeys(): void {
    const configPath = ConfigManager.basePath;
    return this.addMissingUserKeys(configPath);
  }

  public static addMissingUserDataKeys(): void {
    const configPath = DataManager.basePath;
    return this.addMissingUserKeys(configPath);
  }

  // To be deprecated after 1/1/2021
  public static dotaPatchesMigration(): void {
    const updatersConfig = ConfigManager.getUpdatersConfig();
    if (Object.keys(updatersConfig).includes('dota')) {
      updatersConfig.dota_patches = updatersConfig.dota;
      delete updatersConfig.dota;
      ConfigManager.setUpdatersConfig(updatersConfig);
      InitManager.logger.warn('Found old "dota" updater config key, replacing with "dota_patches"');
    }
    const updatersData = DataManager.getUpdatersData();
    if (Object.keys(updatersData).includes('dota')) {
      updatersData.dota_patches = updatersData.dota;
      delete updatersData.dota;
      DataManager.setUpdatersData(updatersData);
      InitManager.logger.warn('Found old "dota" updater data key, replacing with "dota_patches"');
    }
  }

  /** Initializes and validates all config and data files. */
  public static initAll(): void {
    this.addMissingUserConfigKeys();
    this.addMissingUserDataKeys();
    this.addMissingUserConfigs();
    this.addMissingUserDatas();

    // Migrations
    // 1. Rename 'dota' provider to 'dota_patches'
    this.dotaPatchesMigration();
    InitManager.logger.info('Finished initialization check.');
  }
}
