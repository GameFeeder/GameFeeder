import MDRegex from './regex';

describe('MarkdownRegex', () => {
  describe('Attributes', () => {
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
      test('asterix', () => {
        testRegExp(MDRegex.boldAsterisk, '**bold sample text**', [
          '**bold sample text**',
          'bold sample text',
        ]);
      });
      test('underscore', () => {
        testRegExp(MDRegex.boldUnderscore, '__bold sample text__', [
          '__bold sample text__',
          'bold sample text',
        ]);
      });
      describe('combined', () => {
        test('asterix', () => {
          testRegExp(MDRegex.bold, '**bold sample text**', [
            '**bold sample text**',
            'bold sample text',
            undefined,
          ]);
        });

        test('underscore', () => {
          testRegExp(MDRegex.bold, '__bold sample text__', [
            '__bold sample text__',
            undefined,
            'bold sample text',
          ]);
        });
      });
    });

    describe('italic', () => {
      test('asterix', () => {
        testRegExp(MDRegex.italicAsterisk, '*italic sample text*', [
          '*italic sample text*',
          'italic sample text',
        ]);
      });

      test('underscore', () => {
        testRegExp(MDRegex.italicUnderscore, '_italic sample text_', [
          '_italic sample text_',
          'italic sample text',
        ]);
      });

      describe('combined', () => {
        test('asterix', () => {
          testRegExp(MDRegex.italic, '*italic sample text*', [
            '*italic sample text*',
            'italic sample text',
            undefined,
          ]);
        });

        test('underscore', () => {
          testRegExp(MDRegex.italic, '_italic sample text_', [
            '_italic sample text_',
            undefined,
            'italic sample text',
          ]);
        });
      });
    });
  });

  describe('Functions', () => {});
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
    fail('No match');
    return;
  }

  expect(match.length).toEqual(results.length);

  for (let i = 0; i < results.length; i++) {
    expect(match[i]).toEqual(results[i]);
  }
}
