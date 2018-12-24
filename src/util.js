/** @description Determine if a string is empty (null or whitespace).
 *
 * @param  {string} str - The string to check.
 */
function isEmptyOrWhitespace(str) {
  return str === null || str.match(/^\s*$/) !== null;
}

/** @description Escape a regular expression.
 *
 * @param  {string} text - The text to escape.
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = {
  isEmptyOrWhitespace,
  escapeRegExp,
};
