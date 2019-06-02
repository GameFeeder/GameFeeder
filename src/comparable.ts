export default interface Comparable<T> {
  /** Compares this element to another and returns the sorting order. */
  compareTo(other: Comparable<T>): number;
}

/** Sorts an array of comparable values. */
export function sort<T>(array: Comparable<T>[]): Comparable<T>[] {
  return array.sort((a, b) => a.compareTo(b));
}

/** Limits the array, returning the first elements. */
export function limitStart<T>(array: T[], limit?: number): T[] {
  if (limit && array.length > limit) {
    return array.slice(0, limit);
  }
  return array;
}

/** Limits the array, returning the last elements. */
export function limitEnd<T>(array: T[], limit?: number): T[] {
  if (limit && array.length > limit) {
    return array.slice(array.length - limit, array.length);
  }
  return array;
}

/** Sorts and limits the array, returning the first elements. */
export function sortLimitStart<T>(array: Comparable<T>[]): Comparable<T>[] {
  const sortedArray = sort<T>(array);
  return limitStart<Comparable<T>>(sortedArray);
}

/** Sorts and limits the array, returning the last elements. */
export function sortLimitEnd<T>(array: Comparable<T>[]): Comparable<T>[] {
  const sortedArray = sort<T>(array);
  return limitEnd<Comparable<T>>(sortedArray);
}
