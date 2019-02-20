/** Limits an array to a given length.
 *
 * @param array - The array to limit.
 * @param limit - The maximum length the array can have.
 */
function limitArray(array: any[], limit?: number): any[] {
  if (limit && (array.length > limit)) {
    return array.slice(array.length - limit, array.length);
  }
  return array;
}
/** Filters the given array with an async function
 *
 * @param array - The array to filter.
 * @param filterfn - The function to filter the array with.
 */
async function filterAsync(array: any[], filterfn: (value: any) => any): Promise<any[]> {
  // Copy array
  const data = Array.from(array);
  // Filter the array
  return Promise.all(data.map((entry) => filterfn(entry)))
    .then((bits) => data.filter((entry) => bits.shift()));
}

export { limitArray, filterAsync };
