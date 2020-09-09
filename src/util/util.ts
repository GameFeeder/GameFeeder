import _ from 'lodash';
import { AssertionError } from 'assert';

export type JSONObj = Record<string, unknown> | string[];

/** Delays the execution by the specified amount of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Asserts that val is defined, i.e. not undefined or null. */
export function assertIsDefined<T>(val: T, errorMsg?: string): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    // For some reason, typescript-eslint does not recognize this as an Error
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new AssertionError({ message: `Expected 'val' to be defined, but received ${val}` });
  }
}

export function matchGroups(match: RegExpMatchArray): { [key: string]: string } {
  if (!match.groups) {
    throw new Error('Missing RegExp match groups');
  }
  return match.groups;
}

/** Utility functions for strings. */
export class StrUtil {
  /** Limits the given string to the given maximum length.
   *
   * @param str - The string to limit.
   * @param limit - The maximum length of the string.
   */
  public static limit(str: string, limit: number): string {
    if (str.length > limit) {
      return str.substring(0, limit);
    }
    return str;
  }

  /** Limits the given string to the given maximum length naturally, by adding an indicator.
   * E.g. Text message => Text messa...
   *
   * @param str - The string to limit.
   * @param limit - The maximum length of the string.
   * @param indicator - The indicator to use when the string is too long.
   */
  public static naturalLimit(str: string, limit: number, indicator = '...'): string {
    if (indicator.length > limit) {
      throw new Error('The indicator must not be longer than the limit.');
    }

    if (str.length > limit) {
      const cutStr = this.limit(str, limit - indicator.length);
      return cutStr + indicator;
    }

    return str;
  }
}

export class ObjUtil {
  public static keys(object: JSONObj): string[] {
    if (!(object instanceof Object)) {
      return [];
    }

    return Object.keys(object);
  }

  /** Gets the inner object at the given path, or the object if the path is empty.
   *
   * @param object - The object to get the inner object of.
   * @param path - The path of the inner object.
   */
  public static getInnerObject(object: JSONObj, path?: string[]): JSONObj {
    if (!path || path.length === 0) {
      // _.get returns undefined in this case, so we needed a function for this
      return object;
    }

    return _.get(object, path);
  }
}
