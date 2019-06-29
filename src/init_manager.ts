import FS from 'fs';
import { contains } from './util';
import FileManager from './file_manager';
import botLogger from './bot_logger';

export default class InitManager {
  public static exampleExt = '.example.json';
  public static userExt = '.json';

  /** Gets the full file name of the given example file.
   *
   * @param fileName - The name of the example file to get the file name of.
   */
  public static getExampleFile(fileName: string) {
    return fileName + this.exampleExt;
  }

  /** Gets the full file name of the given user file.
   *
   * @param fileName - The name of the user file to get the file name of.
   */
  public static getUserFile(fileName: string) {
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

    return contains(files, fileName);
  }

  /** Returns the names of all missing user files.
   *
   * @param path - The path of the director to check for missing user files.
   */
  public static missingUserFiles(path: string): string[] {
    const exampleFiles = this.getExampleFiles(path);
    const missingFiles = [];

    for (const file of exampleFiles) {
      if (!this.checkForFile(path, file)) {
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
      if (!this.checkForFile(path, file)) {
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
      const exampleFile = this.getExampleFile(file);
      const userFile = this.getUserFile(file);

      botLogger.warn(
        `Didn't find '${FileManager.getFilePath(
          path,
          userFile,
        )}'. Copying defaults from '${FileManager.getFilePath(path, exampleFile)}'.`,
      );

      const content = FileManager.readFile(path, exampleFile);
      FileManager.writeFile(path, this.getUserFile(file), content);
    }

    return missingUserFiles;
  }
}
