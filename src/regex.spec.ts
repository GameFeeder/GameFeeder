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

  describe('bold', () => {
    it('asterix', () => {
      testRegExp(MDRegex.boldAsterix, '**bold sample text**', [
        '**bold sample text**',
        'bold sample text',
      ]);
    });
    it('underscore', () => {
      testRegExp(MDRegex.boldUnderscore, '__bold sample text__', [
        '__bold sample text__',
        'bold sample text',
      ]);
    });
    it('combined', () => {
      testRegExp(MDRegex.bold, '**bold sample text**', [
        '**bold sample text**',
        'bold sample text',
        undefined,
      ]);
      testRegExp(MDRegex.bold, '__bold sample text__', [
        '__bold sample text__',
        undefined,
        'bold sample text',
      ]);
    });
  });

  describe('italic', () => {
    it('asterix', () => {
      testRegExp(MDRegex.italicAsterix, '*italic sample text*', [
        '*italic sample text*',
        'italic sample text',
      ]);
    });

    it('underscore', () => {
      testRegExp(MDRegex.italicUnderscore, '_italic sample text_', [
        '_italic sample text_',
        'italic sample text',
      ]);
    });

    it('combined', () => {
      testRegExp(MDRegex.italic, '*italic sample text*', [
        '*italic sample text*',
        'italic sample text',
        undefined,
      ]);

      testRegExp(MDRegex.italic, '_italic sample text_', [
        '_italic sample text_',
        undefined,
        'italic sample text',
      ]);
    });
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
