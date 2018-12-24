/**
 * Determine if a string is empty (null or whitespace)
 * @param  {string} str - The string to check.
 */
function isEmptyOrWhitespace(str) {
  return str === null || str.match(/^\s*$/) !== null;
}

module.exports = {
  isEmptyOrWhitespace,
};
