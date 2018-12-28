const util = require('./util');

test('check empty or whitespace', () => {
  expect(util.isEmptyOrWhitespace('')).toBe(true);
});
