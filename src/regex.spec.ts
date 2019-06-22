import MDRegex from './regex';

describe('Markdown regex', () => {
  // ---
  // ATTRIBUTES
  // ---
  describe('attributes', () => {
    // LINK
    describe('link', () => {
      test('single', () => {
        testRegExp(MDRegex.link, '[TestLink](https://test.url)', [
          '[TestLink](https://test.url)',
          'TestLink',
          'https://test.url',
        ]);
      });

      test('not matching images', () => {
        testRegExp(MDRegex.link, '![TestImage](https://test.png)', []);
      });
    });

    // IMAGE
    describe('image', () => {
      test('single', () => {
        testRegExp(MDRegex.image, '![TestImage](https://test.png)', [
          '![TestImage](https://test.png)',
          'TestImage',
          'https://test.png',
        ]);
      });

      test('not matching links', () => {
        testRegExp(MDRegex.image, '[TestLink](https://test.url)', []);
      });
    });

    // BOLD
    describe('bold', () => {
      test('single with asterisks', () => {
        testRegExp(MDRegex.boldAsterisk, '**bold sample text**', [
          '**bold sample text**',
          'bold sample text',
        ]);
      });
      test('single with underscores', () => {
        testRegExp(MDRegex.boldUnderscore, '__bold sample text__', [
          '__bold sample text__',
          'bold sample text',
        ]);
      });
      describe('combined', () => {
        test('single with asterisks', () => {
          testRegExp(MDRegex.bold, '**bold sample text**', [
            '**bold sample text**',
            'bold sample text',
            undefined,
          ]);
        });

        test('single with underscores', () => {
          testRegExp(MDRegex.bold, '__bold sample text__', [
            '__bold sample text__',
            undefined,
            'bold sample text',
          ]);
        });
      });
    });

    // ITALIC
    describe('italic', () => {
      test('single with asterisks', () => {
        testRegExp(MDRegex.italicAsterisk, '*italic sample text*', [
          '*italic sample text*',
          'italic sample text',
        ]);
      });

      test('single with underscores', () => {
        testRegExp(MDRegex.italicUnderscore, '_italic sample text_', [
          '_italic sample text_',
          'italic sample text',
        ]);
      });

      describe('combined', () => {
        test('single with asterisks', () => {
          testRegExp(MDRegex.italic, '*italic sample text*', [
            '*italic sample text*',
            'italic sample text',
            undefined,
          ]);
        });

        test('single with underscores', () => {
          testRegExp(MDRegex.italic, '_italic sample text_', [
            '_italic sample text_',
            undefined,
            'italic sample text',
          ]);
        });
      });
    });

    // LIST
    describe('list', () => {
      test('single with asterisk', () => {
        testRegExp(MDRegex.list, '* List Element', [
          '* List Element',
          'List Element',
        ]);
      });

      xtest('single with dash', () => {
        testRegExp(MDRegex.list, '- List Element', [
          '- List Element',
          'List Element',
        ]);
      });
    });
  });

  // ---
  // FUNCTIONS
  // ---
  describe('replace function', () => {
    // LINK
    describe('link', () => {
      test('simple', () => {
        const testText = '[Label](https://link.com)';
        const resultText = MDRegex.replaceLink(testText, (_, label, url) => {
          return `This is a link called '${label}' with the url '${url}'.`;
        });
        const expected = `This is a link called 'Label' with the url 'https://link.com'.`;

        expect(resultText).toEqual(expected);
      });

      test('in text', () => {
        const testText = 'Right here, we have a [Link](https://www.url.org) in a **Text**.';
        const resultText = MDRegex.replaceLink(testText, (_, label, url) => {
          return `__${label}__ (${url})`;
        });
        const expected = `Right here, we have a __Link__ (https://www.url.org) in a **Text**.`;

        expect(resultText).toEqual(expected);
      });

      test('multiple', () => {
        const testText =
          'We have a [Link1](url1) and another [Link2](url2) and even a third [Link3](url3).';
        const resultText = MDRegex.replaceLink(testText, (_, label, url) => {
          return `${label}: ${url}`;
        });
        const expected =
          `We have a Link1: url1 and another Link2: url2 and even a third Link3: url3.`;

        expect(resultText).toEqual(expected);
      });

      test('not matching images', () => {
        const testText = 'We have an ![Image](www.url.png) right here.';
        const expected = 'We have an ![Image](www.url.png) right here.';
        const resultText = MDRegex.replaceLink(testText, (_, label, url) => {
          return `${label}: ${url}`;
        });

        expect(resultText).toEqual(expected);
      });
    });

    // IMAGE
    describe('image', () => {
      test('simple', () => {
        const testText = '![Label](https://link.png)';
        const resultText = MDRegex.replaceImage(testText, (_, label, url) => {
          return `This is an image called '${label}' with the url '${url}'.`;
        });
        const expected = `This is an image called 'Label' with the url 'https://link.png'.`;

        expect(resultText).toEqual(expected);
      });

      test('in text', () => {
        const testText = 'Right here, we have an ![Image](https://www.url.jpg) in a **Text**.';
        const resultText = MDRegex.replaceImage(testText, (_, label, url) => {
          return `__${label}__ (${url})`;
        });
        const expected = `Right here, we have an __Image__ (https://www.url.jpg) in a **Text**.`;

        expect(resultText).toEqual(expected);
      });

      test('multiple', () => {
        const testText =
          'We have an ![Image1](url1) and another ![Image2](url2) and a third ![Image3](url3).';
        const expected =
          `We have an Image1: url1 and another Image2: url2 and a third Image3: url3.`;
        const resultText = MDRegex.replaceImage(testText, (_, label, url) => {
          return `${label}: ${url}`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching links', () => {
        const testText = 'We have a [Link](www.url.com) right here.';
        const resultText = MDRegex.replaceImage(testText, (_, label, url) => {
          return `${label}: ${url}`;
        });
        const expected = `We have a [Link](www.url.com) right here.`;

        expect(resultText).toEqual(expected);
      });
    });

    // BOLD
    describe('bold', () => {
      test('single with asterisks', () => {
        const testText = '**Bold Text**';
        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `_${boldText}_`;
        });
        const expected = '_Bold Text_';

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'We have a **bold text1** and another **bold text2**';
        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `_${boldText}_`;
        });
        const expected = 'We have a _bold text1_ and another _bold text2_';

        expect(resultText).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '__Bold Text__';
        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `*${boldText}*`;
        });
        const expected = '*Bold Text*';

        expect(resultText).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'We have a __bold text1__ and another __bold text2__';
        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `*${boldText}*`;
        });
        const expected = 'We have a *bold text1* and another *bold text2*';

        expect(resultText).toEqual(expected);
      });

      test('single with asterisk and underscores', () => {
        const testText = '**Asterisk** and __Underscore__';
        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });
        const expected = '~Asterisk~ and ~Underscore~';

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '**asterisk1** and __underscore1__ and **asterisk2** and __underscore2__';
        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });
        const expected = '~asterisk1~ and ~underscore1~ and ~asterisk2~ and ~underscore2~';

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '**asterisk1** and __underscore1__ and **asterisk2** and __underscore2__';
        const expected = '~asterisk1~ and ~underscore1~ and ~asterisk2~ and ~underscore2~';

        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching single asterisks', () => {
        const testText = 'Test**Text';
        const expected = 'Test**Text';

        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching single underscores', () => {
        const testText = 'Test__Text';
        const expected = 'Test__Text';

        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching through linebreak with asterisks', () => {
        const testText = '**Test\nText**';
        const expected = '**Test\nText**';

        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching through linebreak with underscores', () => {
        const testText = '__Test\nText__';
        const expected = '__Test\nText__';

        const resultText = MDRegex.replaceBold(testText, (_, boldText) => {
          return `~${boldText}~`;
        });

        expect(resultText).toEqual(expected);
      });
    });

    // ITALIC
    describe('italic', () => {
      test('single with asterisks', () => {
        const testText = '*Italic Text*';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `_${italicText}_`;
        });
        const expected = '_Italic Text_';

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'We have an *italic text1* and another *italic text2*';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `_${italicText}_`;
        });
        const expected = 'We have an _italic text1_ and another _italic text2_';

        expect(resultText).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '_Italic Text_';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `*${italicText}*`;
        });
        const expected = '*Italic Text*';

        expect(resultText).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'We have an _italic text1_ and another _italic text2_';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `*${italicText}*`;
        });
        const expected = 'We have an *italic text1* and another *italic text2*';

        expect(resultText).toEqual(expected);
      });

      test('single with asterisks and underscores', () => {
        const testText = '*Asterisk* and _Underscore_';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });
        const expected = '~Asterisk~ and ~Underscore~';

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '*asterisk1* and _underscore1_ and *asterisk2* and _underscore2_';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });
        const expected = '~asterisk1~ and ~underscore1~ and ~asterisk2~ and ~underscore2~';

        expect(resultText).toEqual(expected);
      });

      test('not matching bold formatting', () => {
        const testText = '**asterisk1** and __underscore1__ and **asterisk2** and __underscore2__';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });
        const expected = '**asterisk1** and __underscore1__ and **asterisk2** and __underscore2__';

        expect(resultText).toEqual(expected);
      });

      test('not matching through linebreak with asterisks', () => {
        const testText = '*Test\nText*';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });
        const expected = '*Test\nText*';

        expect(resultText).toEqual(expected);
      });

      test('not matching through linebreak with underscores', () => {
        const testText = '_Test\nText_';
        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });
        const expected = '_Test\nText_';

        expect(resultText).toEqual(expected);
      });
    });

    // LIST
    describe('list', () => {
      test('single with asterisk', () => {
        const testText = '* List Element';
        const expected = '- List Element';

        const resultText = MDRegex.replaceList(testText, (_, listElement) => {
          return `- ${listElement}`;
        });

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = '* List Element 1\n* List Element 2';
        const expected = '- List Element 1\n- List Element 2';

        const resultText = MDRegex.replaceList(testText, (_, listElement) => {
          return `- ${listElement}`;
        });

        expect(resultText).toEqual(expected);
      });

      test('single with dash', () => {
        const testText = '- List Element';
        const expected = '* List Element';

        const resultText = MDRegex.replaceList(testText, (_, listElement) => {
          return `* ${listElement}`;
        });

        expect(resultText).toEqual(expected);
      });

      test('multiple with dashes', () => {
        const testText = '- List Element 1\n- List Element 2';
        const expected = '* List Element 1\n* List Element 2';

        const resultText = MDRegex.replaceList(testText, (_, listElement) => {
          return `* ${listElement}`;
        });

        expect(resultText).toEqual(expected);
      });
    });

    describe('header', () => {
      test('h1', () => {
        const testText = '# Header';
        const expected = '**Header**';

        const resultText = MDRegex.replaceHeader(testText, (_, headerText, level) => {
          expect(level).toEqual(1);
          return `**${headerText}**`;
        });

        expect(resultText).toEqual(expected);
      });

      test('h6', () => {
        const testText = '###### Header';
        const expected = '**Header**';

        const resultText = MDRegex.replaceHeader(testText, (_, headerText, level) => {
          expect(level).toEqual(6);
          return `**${headerText}**`;
        });

        expect(resultText).toEqual(expected);
      });

      test('h6 is max', () => {
        const testText = '####### Header';
        const expected = '**# Header**';

        const resultText = MDRegex.replaceHeader(testText, (_, headerText, level) => {
          expect(level).toEqual(6);
          return `**${headerText}**`;
        });

        expect(resultText).toEqual(expected);
      });
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
    fail('No match');
    return;
  }

  expect(match.length).toEqual(results.length);

  for (let i = 0; i < results.length; i++) {
    expect(match[i]).toEqual(results[i]);
  }
}
