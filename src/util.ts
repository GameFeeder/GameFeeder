import _ from 'lodash';

/** Applies a function on every array element.
 *
 * @param array - The array to apply the function to.
 * @param callbackfn - The function to apply to the array elements.
 * @returns The array produced by the map function.
 */
export function mapAsync<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>,
): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}

/** Filters the given array with an async function
 *
 * @param array - The array to filter.
 * @param callbackfn - The function to filter the array with.
 */
export async function filterAsync<T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((value, index) => filterMap[index]);
}

/** Joins the array with the seperator, but 'and' for the last item.
 *  E.g.: 'first, second and third'.
 */
export function naturalJoin(array: string[], seperator?: string): string {
  if (!array || array.length === 0) {
    return '';
  }
  if (array.length === 1) {
    return array[0];
  }
  const sep = seperator || ', ';
  return array.slice(0, array.length - 1).join(sep) + ' and ' + array[array.length - 1];
}

export class ObjUtil {
  public static keys(object: any): string[] {
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
  public static getInnerObject(object: any, path?: string[]): any {
    if (!path || path.length === 0) {
      // _.get returns undefined in this case, so we needed a function for this
      return object;
    }

    return _.get(object, path);
  }
}
