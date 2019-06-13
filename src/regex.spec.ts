import MDRegex from './regex';

describe('MarkdownRegex', () => {
  test('link', () => {
    testRegExp(MDRegex.link, '[TestLink](https://test.url)', ['TestLink', 'https://test.url']);
  });

  test('image', () => {
    testRegExp(MDRegex.link, '![TestImage](https://test.url)', ['TestImage', 'https://test.url']);
    // We dont want normal links to match
    testRegExp(MDRegex.link, '[TestLink](https://test.url)', []);
  });

  test('bold', () => {
    testRegExp(MDRegex.image, '**bold sample text**', ['bold sample text']);

    testRegExp(MDRegex.image, '__bold sample text__', ['bold sample text']);
  });
});

/** Tests the given regular expression
 *
 * @param regExp - The RegExp to test.
 * @param testStr - The string to test the regExp with.
 * @param results - The expected results of the match.
 */
function testRegExp(regExp: RegExp, testStr: string, results: string[]) {
  const match = regExp.exec(testStr);

  if (results.length === 0) {
    expect(match).toBeNull;
    return;
  }

  expect(match == null).toBeFalsy;

  if (match == null) {
    return;
  }

  expect(match.length - 1).toEqual(results.length);

  for (let i = 0; i < results.length; i++) {
    expect(match[i + 1]).toEqual(results[i]);
  }
}
