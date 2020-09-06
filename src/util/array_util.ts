import Comparable from './comparable';

/** Sorts an array of comparable values. */
export function sort<T extends Comparable<T>>(array: T[]): T[] {
  return array.sort((a, b) => a.compareTo(b));
}

/** Limits the array, returning the first elements. */
export function limitStart<T>(array: T[], limit?: number): T[] {
  if (limit !== undefined && array.length > limit) {
    return array.slice(0, limit);
  }
  return array;
}

/** Limits the array, returning the last elements. */
export function limitEnd<T>(array: T[], limit?: number): T[] {
  if (limit !== undefined && array.length > limit) {
    return array.slice(array.length - limit, array.length);
  }
  return array;
}

/** Sorts and limits the array, returning the first elements. */
export function sortLimitStart<T extends Comparable<T>>(array: T[], limit?: number): T[] {
  const sortedArray = sort<T>(array);
  return limitStart(sortedArray, limit);
}

/** Sorts and limits the array, returning the last elements. */
export function sortLimitEnd<T extends Comparable<T>>(array: T[], limit?: number): T[] {
  const sortedArray = sort<T>(array);
  return limitEnd(sortedArray, limit);
}

/** Applies an async function on every array element.
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

/** Applies an async function on every array element.
 *
 * @param array - The array to apply the function to.
 * @param callbackfn - The function to apply to the array elements.
 * @returns The array produced by the map function.
 */
export function optMapAsync<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U> | undefined,
): Promise<U[]> {
  const handles = array.map(callbackfn).filter((handle) => handle !== undefined) as Promise<U>[];
  return Promise.all(handles);
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

/**
 * Merges an array of arrays into a single array.
 * @param arrays - The arrays to merge.
 */
export function mergeArrays<T>(arrays: T[][]): T[] {
  // Needed for correct typing
  const start: T[] = [];
  return start.concat(...arrays);
}

/** Joins the array with the separator, but 'and' for the last item.
 *  E.g.: 'first, second and third'.
 */
export function naturalJoin(array?: string[], separator?: string): string {
  if (!array || array.length === 0) {
    return '';
  }
  if (array.length === 1) {
    return array[0];
  }
  const sep = separator || ', ';
  return `${array.slice(0, array.length - 1).join(sep)} and ${array[array.length - 1]}`;
}
