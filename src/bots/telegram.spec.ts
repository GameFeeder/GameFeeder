jest.mock('request-promise-native');
import TelegramBot from './telegram';

describe('Telegram bot', () => {
  describe('message from markdown', () => {
    // LINK
    describe('link', () => {
      test('single', () => {
        const testText = '[label](https://url.com)';
        const expected = '[label](https://url.com)';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });
    });

    // IMAGE
    describe('image', () => {
      test('single', () => {
        const testText = '![label](https://url.png)';
        const expected = '[label](https://url.png)';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });
    });

    // IMAGE LINK
    describe('image link', () => {
      test('single', () => {
        const testText = '![[image link](www.url.com)](www.url.png)';
        const expected = '[image link](www.url.png) ([link](www.url.com))';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });
    });

    // BOLD
    describe('bold', () => {
      test('single with asterisks', () => {
        const testText = '**Bold Text**';
        const expected = '*Bold Text*';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'A **bold text1** and another **bold text2**.';
        const expected = 'A *bold text1* and another *bold text2*.';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '__Bold Text__';
        const expected = '*Bold Text*';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'A __bold text1__ and another __bold text2__.';
        const expected = 'A *bold text1* and another *bold text2*.';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '__underscore1__ and **asterisk1** and __underscore2__ and **asterisk2**.';
        const expected = '*underscore1* and *asterisk1* and *underscore2* and *asterisk2*.';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });
    });

    // ITALIC
    describe('italic', () => {
      test('single with asterisks', () => {
        const testText = '*Italic Text*';
        const expected = '_Italic Text_';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'A *italic text1* and another *italic text2*.';
        const expected = 'A _italic text1_ and another _italic text2_.';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '_Italic Text_';
        const expected = '_Italic Text_';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'A _italic text1_ and another _italic text2_.';
        const expected = 'A _italic text1_ and another _italic text2_.';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '_underscore1_ and *asterisk1* and _underscore2_ and *asterisk2*.';
        const expected = '_underscore1_ and _asterisk1_ and _underscore2_ and _asterisk2_.';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });

      test('not matching single asterisk', () => {
        const testText = 'Test*Text';
        const expected = 'Test*Text';

        const test = TelegramBot.msgFromMarkdown(testText);

        expect(test).toEqual(expected);
      });
    });
  });

  // LIST
  describe('list', () => {
    test('single with asterisk', () => {
      const testText = '* List element';
      const expected = '- List element';

      const test = TelegramBot.msgFromMarkdown(testText);

      expect(test).toEqual(expected);
    });

    test('multiple with asterisks', () => {
      const testText = '* List element 1\n*  List element 2';
      const expected = '- List element 1\n- List element 2';

      const test = TelegramBot.msgFromMarkdown(testText);

      expect(test).toEqual(expected);
    });

    test('single with dash', () => {
      const testText = '- List element';
      const expected = '- List element';

      const test = TelegramBot.msgFromMarkdown(testText);

      expect(test).toEqual(expected);
    });

    test('multiple with dashes', () => {
      const testText = '- List element 1\n-  List element 2';
      const expected = '- List element 1\n- List element 2';

      const test = TelegramBot.msgFromMarkdown(testText);

      expect(test).toEqual(expected);
    });
  });

  // HEADER
  describe('header', () => {
    test('h1-6', () => {
      const testText1 = '# Test';
      const testText2 = '## Test';
      const testText3 = '### Test';
      const testText4 = '#### Test';
      const testText5 = '##### Test';
      const testText6 = '###### Test';
      const expected = '\n\n*Test*\n';

      const test1 = TelegramBot.msgFromMarkdown(testText1);
      const test2 = TelegramBot.msgFromMarkdown(testText2);
      const test3 = TelegramBot.msgFromMarkdown(testText3);
      const test4 = TelegramBot.msgFromMarkdown(testText4);
      const test5 = TelegramBot.msgFromMarkdown(testText5);
      const test6 = TelegramBot.msgFromMarkdown(testText6);

      expect(test1).toEqual(expected);
      expect(test2).toEqual(expected);
      expect(test3).toEqual(expected);
      expect(test4).toEqual(expected);
      expect(test5).toEqual(expected);
      expect(test6).toEqual(expected);
    });
  });

  // SEPERATOR
  describe('seperator', () => {
    test('with 3 dashes', () => {
      const testText = '\n\n---\n\n';
      const expected = '\n--\n';

      const test = TelegramBot.msgFromMarkdown(testText);

      expect(test).toEqual(expected);
    });

    test('with 3 asterisks', () => {
      const testText = '\n\n***\n\n';
      const expected = '\n--\n';

      const test = TelegramBot.msgFromMarkdown(testText);

      expect(test).toEqual(expected);
    });
  });
});
