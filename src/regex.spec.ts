import MDRegex from './regex';

describe('MarkdownRegex', () => {
  test('link', () => {
    testRegExp(MDRegex.link, '[TestLink](https://test.url)', [
      '[TestLink](https://test.url)',
      'TestLink',
      'https://test.url',
    ]);
  });

  test('image', () => {
    testRegExp(MDRegex.image, '![TestImage](https://test.url)', [
      '![TestImage](https://test.url)',
      'TestImage',
      'https://test.url',
    ]);
    // We dont want normal links to match
    testRegExp(MDRegex.image, '[TestLink](https://test.url)', []);
  });

  test('bold', () => {
    testRegExp(MDRegex.boldAsterix, '**bold sample text**', [
      '**bold sample text**',
      'bold sample text',
    ]);
    testRegExp(MDRegex.boldUnderscore, '__bold sample text__', [
      '__bold sample text__',
      'bold sample text',
    ]);
  });

  test('italic', () => {
    testRegExp(MDRegex.italicAsterix, '*italic sample text*', [
      '*italic sample text*',
      'italic sample text',
    ]);
    testRegExp(MDRegex.italicUnderscore, '_italic sample text_', [
      '_italic sample text_',
      'italic sample text',
    ]);
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
    expect(match).toBeNull();
    return;
  }

  if (!match) {
    fail();
    return;
  }

  expect(match.length).toEqual(results.length);

  for (let i = 0; i < results.length; i++) {
    console.debug(`${results[i]}`);
    expect(match[i]).toEqual(results[i]);
  }
}
