import Comparable from '../util/comparable.js';

export function parseVersion(version: string): Array<{ major: number; minor: string }> {
  // Split into version parts, e.g. 0.10.3 is split into 0 and 10 and 3
  const vParts = version.split('.');

  // Split in major and minor version part, e.g. 10b is split in 10 and b
  const partRegex = /(?<major>\d+)(?<minor>[a-zA-z]+)?/;

  return vParts.map((vPart) => {
    const match = partRegex.exec(vPart);

    if (!match) {
      throw Error(`Invalid version part '${vPart}' in version number '${version}'.`);
    }

    const groups = match.groups;

    if (!groups) {
      throw Error(`No match groups when parsion version number '${version}'.`);
    }

    const major = Number(groups.major);
    const minor: string = groups.minor ?? '0';

    return { major, minor };
  });
}

export default class Version implements Comparable<Version> {
  /**
   * Creates a new Version.
   * @param version The gameplay version of the update.
   */
  constructor(public version: string) {}

  public compareTo(other: Version): -1 | 0 | 1 {
    // Split the version strings in the different version numbers
    const v1Parts = parseVersion(this.version);
    const v2Parts = parseVersion(other.version);

    for (let index = 0; index < Math.max(v1Parts.length, v2Parts.length); index += 1) {
      const v1Part = v1Parts[index] ?? { major: 0 };
      const v2Part = v2Parts[index] ?? { major: 0 };

      // If the major version string is greater, the version is greater
      if (v1Part.major < v2Part.major) {
        return -1;
      }
      if (v1Part.major > v2Part.major) {
        return 1;
      }

      // Otherwise, if the minor version is greater, the version is greater
      if (v1Part.minor < v2Part.minor) {
        return -1;
      }
      if (v1Part.minor > v2Part.minor) {
        return 1;
      }
    }

    // It's the same version number
    return 0;
  }
}
