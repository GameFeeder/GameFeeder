import FS from 'fs';
import { contains } from './util';

export default class InitManager {
  public static getFiles(path: string): string[] {
    return FS.readdirSync(path);
  }

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
}
