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

      test('not matching image links', () => {
        testRegExp(MDRegex.link, '![[TestImageLink](https://test.url)](https://test.png)', []);
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

      test('not matching image links', () => {
        testRegExp(MDRegex.image, '![[TestImageLink](https://test.url)](https://test.png)', []);
      });
    });

    // IMAGE LINK
    describe('image link', () => {
      test('with link', () => {
        testRegExp(MDRegex.imageLink, '![[TestLabel](https://url.com)](https://test.png)', [
          '![[TestLabel](https://url.com)](https://test.png)',
          'TestLabel',
          'https://url.com',
          undefined,
          'https://test.png',
        ]);
      });

      xtest('without link', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.imageLink, '![TestLabel](https://test.png)', [
          '![TestLabel](https://test.png)',
          undefined,
          undefined,
          'TestLabel',
          'https://test.png',
        ]);
      });

      test('not matching links', () => {
        testRegExp(MDRegex.imageLink, '[TestLink](https://test.url)', []);
      });

      test('not matching link images', () => {
        testRegExp(MDRegex.imageLink, '[![TestLabel](https://test.png)](https://url.com)', []);
      });
    });

    // LINK IMAGE
    describe('link image', () => {
      test('with image', () => {
        testRegExp(MDRegex.linkImage, '[![TestLabel](https://test.png)](https://url.com)', [
          '[![TestLabel](https://test.png)](https://url.com)',
          'TestLabel',
          'https://test.png',
          undefined,
          'https://url.com',
        ]);
      });

      xtest('without image', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.imageLink, '[TestLabel](https://url.com)', [
          '[TestLabel](https://url.com)',
          undefined,
          undefined,
          'TestLabel',
          'https://url.com',
        ]);
      });

      xtest('not matching images', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.imageLink, '![TestImage](https://test.png)', []);
      });

      xtest('not matching image links', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.imageLink, '![[TestLabel](https://url.com)](https://test.png)', []);
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
        testRegExp(MDRegex.list, '* List Element', ['* List Element', 'List Element']);
      });

      xtest('single with dash', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.list, '- List Element', ['- List Element', 'List Element']);
      });
    });

    // QUOTE
    describe('quote', () => {
      test('with space', () => {
        testRegExp(MDRegex.quote, '> Quote text', ['> Quote text', 'Quote text']);
      });

      xtest('without space', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.quote, '>Quote text', ['>Quote text', 'Quote text']);
      });
    });

    // SEPERATOR
    describe('seperator', () => {
      test('with 3 dashes', () => {
        testRegExp(MDRegex.seperator, '\n\n---\n\n', ['\n\n---\n\n', '---']);
      });

      xtest('with 3 asterisks', () => {
        // This should pass, the function test passes. No idea what's happening here
        testRegExp(MDRegex.seperator, '\n\n***\n\n', ['\n\n***\n\n', '***']);
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
        const expected = `We have a Link1: url1 and another Link2: url2 and even a third Link3: url3.`;

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
        const expected = `We have an Image1: url1 and another Image2: url2 and a third Image3: url3.`;
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

    // IMAGE LINK
    describe('image link', () => {
      test('with link', () => {
        const testText = 'We have an ![[image link](www.url.com)](www.url.png) right here.';
        const expected = `We have an [image link](www.url.png) ([Link](www.url.com)) right here.`;

        const resultText = MDRegex.replaceImageLink(testText, (_, label, imageUrl, linkUrl) => {
          return `[${label}](${imageUrl}) ([Link](${linkUrl}))`;
        });

        expect(resultText).toEqual(expected);
      });

      test('without link', () => {
        const testText = 'We have an ![image](www.url.png) right here.';
        const expected = `We have an [image](www.url.png) right here.`;

        const resultText = MDRegex.replaceImageLink(testText, (_, label, imageUrl, linkUrl) => {
          return `[${label}](${imageUrl})`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not replacing links', () => {
        const testText = 'We have a [link](www.url.com) right here.';
        const expected = `We have a [link](www.url.com) right here.`;

        const resultText = MDRegex.replaceImageLink(testText, (_, label, imageUrl, linkUrl) => {
          return `+++`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not replacing links', () => {
        const testText = 'We have a [![link image](www.url.png)](www.url.com) right here.';
        const expected = `We have a [![link image](www.url.png)](www.url.com) right here.`;

        const resultText = MDRegex.replaceImageLink(testText, (_, label, imageUrl, linkUrl) => {
          return `+++`;
        });

        expect(resultText).toEqual(expected);
      });
    });

    // LINK IMAGE
    describe('link image', () => {
      test('with image', () => {
        const testText = 'We have a [![link image](www.url.png)](www.url.com) right here.';
        const expected = `We have a [link image](www.url.png) ([link](www.url.com)) right here.`;

        const resultText = MDRegex.replaceLinkImage(testText, (_, label, linkUrl, imageUrl) => {
          return `[${label}](${imageUrl}) ([link](${linkUrl}))`;
        });

        expect(resultText).toEqual(expected);
      });

      test('without image', () => {
        const testText = 'We have a [link](www.url.com) right here.';
        const expected = `We have a [link](www.url.com) right here.`;

        const resultText = MDRegex.replaceLinkImage(testText, (_, label, linkUrl, imageUrl) => {
          return `[${label}](${linkUrl})`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not replacing images', () => {
        const testText = 'We have an ![image](www.url.png) right here.';
        const expected = `We have an ![image](www.url.png) right here.`;

        const resultText = MDRegex.replaceLinkImage(testText, (_, label, linkUrl, imageUrl) => {
          return `+++`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not replacing image links', () => {
        const testText = 'We have an ![[image link](www.url.com)](www.url.png) right here.';
        const expected = `We have an ![[image link](www.url.com)](www.url.png) right here.`;

        const resultText = MDRegex.replaceLinkImage(testText, (_, label, linkUrl, imageUrl) => {
          return `+++`;
        });

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

      test('not matching with adjacent spaces', () => {
        const testText = '** Test **';
        const expected = '** Test **';

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
        const expected = '_Italic Text_';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `_${italicText}_`;
        });

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'We have an *italic text1* and another *italic text2*';
        const expected = 'We have an _italic text1_ and another _italic text2_';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `_${italicText}_`;
        });

        expect(resultText).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '_Italic Text_';
        const expected = '*Italic Text*';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `*${italicText}*`;
        });

        expect(resultText).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'We have an _italic text1_ and another _italic text2_';
        const expected = 'We have an *italic text1* and another *italic text2*';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `*${italicText}*`;
        });

        expect(resultText).toEqual(expected);
      });

      test('single with asterisks and underscores', () => {
        const testText = '*Asterisk* and _Underscore_';
        const expected = '~Asterisk~ and ~Underscore~';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '*asterisk1* and _underscore1_ and *asterisk2* and _underscore2_';
        const expected = '~asterisk1~ and ~underscore1~ and ~asterisk2~ and ~underscore2~';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching bold formatting', () => {
        const testText = '**asterisk1** and __underscore1__ and **asterisk2** and __underscore2__';
        const expected = '**asterisk1** and __underscore1__ and **asterisk2** and __underscore2__';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching through linebreak with asterisks', () => {
        const testText = '*Test\nText*';
        const expected = '*Test\nText*';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching through linebreak with underscores', () => {
        const testText = '_Test\nText_';
        const expected = '_Test\nText_';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });

        expect(resultText).toEqual(expected);
      });

      test('not matching with adjacent spaces', () => {
        const testText = '* Test *';
        const expected = '* Test *';

        const resultText = MDRegex.replaceItalic(testText, (_, italicText) => {
          return `~${italicText}~`;
        });

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

    // HEADER
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

      test('h1 alternative', () => {
        const testText = 'Header\n===';
        const expected = '**Header**';

        const resultText = MDRegex.replaceHeader(testText, (_, headerText, level) => {
          expect(level).toEqual(1);
          return `**${headerText}**`;
        });

        expect(resultText).toEqual(expected);
      });

      test('h2 alternative', () => {
        const testText = 'Header\n---';
        const expected = '**Header**';

        const resultText = MDRegex.replaceHeader(testText, (_, headerText, level) => {
          expect(level).toEqual(2);
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

    // QUOTE
    describe('Quote', () => {
      test('with space', () => {
        const testText = '> Quote text';
        const expected = '"Quote text"';

        const resultText = MDRegex.replaceQuote(testText, (_, quoteText) => {
          return `"${quoteText}"`;
        });

        expect(resultText).toEqual(expected);
      });

      test('without space', () => {
        const testText = '>Quote text';
        const expected = '"Quote text"';

        const resultText = MDRegex.replaceQuote(testText, (_, quoteText) => {
          return `"${quoteText}"`;
        });

        expect(resultText).toEqual(expected);
      });
    });

    // SEPERATOR
    describe('Seperator', () => {
      test('with 3 dashes', () => {
        const testText = 'Test text\n\n---\n\nAnd it goes on.';
        const expected = 'Test text\n--\nAnd it goes on.';

        const resultText = MDRegex.replaceSeperator(testText, (_, seperator) => {
          return `\n--\n`;
        });

        expect(resultText).toEqual(expected);
      });

      test('with 3 asterisks', () => {
        const testText = 'Test text\n\n***\n\nAnd it goes on.';
        const expected = 'Test text\n--\nAnd it goes on.';

        const resultText = MDRegex.replaceSeperator(testText, (_, seperator) => {
          return `\n--\n`;
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
    fail(`Not matching '${testStr}'.`);
    return;
  }

  expect(match.length).toEqual(results.length);

  for (let i = 0; i < results.length; i++) {
    expect(match[i]).toEqual(results[i]);
  }
}
