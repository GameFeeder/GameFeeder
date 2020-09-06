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
