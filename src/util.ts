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
