import FS from 'fs';

export default class FileManager {
  /** Returns all file names in the given directory.
   *
   * @param path - The path of the directory to get the files in.
   */
  public static getFiles(path: string): string[] {
    return FS.readdirSync(path);
  }

  /** Returns the filepath of the given file.
   *
   * @param path - The path of the file directory.
   * @param fileName - The name of the file.
   */
  public static getFilePath(path: string, fileName: string): string {
    return path + fileName;
  }

  /** Reads the given file.
   *
   * @param path - The path of the file directory.
   * @param fileName - The name of the file to read.
   */
  public static readFile(path: string, fileName: string): string {
    return FS.readFileSync(this.getFilePath(path, fileName), 'utf8');
  }

  /** Writes the given content to the given file.
   *
   * @param path - The path of the file directory.
   * @param fileName - The name of the file.
   * @param content - The content to write in the file.
   */
  public static writeFile(path: string, fileName: string, content: string): void {
    FS.writeFileSync(this.getFilePath(path, fileName), content);
  }

  /** Parses the given file to a JSON object.
   *
   * @param path - The path of the file directory.
   * @param fileName - The name of the file to parse.
   */
  public static parseFile(path: string, fileName: string): Record<string, unknown> {
    return JSON.parse(this.readFile(path, fileName));
  }

  /** Writes an object to the given file.
   *
   * @param path - The path of the file directory.
   * @param fileName - The name of the file to write to.
   * @param object - The object to write to the file.
   */
  public static writeObject(path: string, fileName: string, object: Record<string, unknown>): void {
    return this.writeFile(path, fileName, JSON.stringify(object, null, 2));
  }
}
