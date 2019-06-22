import DiscordBot from './bot_discord';

describe('Discord bot', () => {
  describe('message from markdown', () => {
    // LINK
    describe('link', () => {
      test('single', () => {
        const testText = '[label](https://url.com)';
        const expectedNoEmbed = 'label (https://url.com)';
        const expectedEmbed = '[label](https://url.com)';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expectedNoEmbed);
        expect(testEmbed).toEqual(expectedEmbed);
      });
    });

    // IMAGE
    describe('image', () => {
      test('single', () => {
        const testText = '![label](https://url.png)';
        const expectedNoEmbed = 'label (https://url.png)';
        const expectedEmbed = '[label](https://url.png)';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expectedNoEmbed);
        expect(testEmbed).toEqual(expectedEmbed);
      });
    });

    // BOLD
    describe('bold', () => {
      test('single with asterisks', () => {
        const testText = '**Bold Text**';
        const expected = '**Bold Text**';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'A **bold text1** and another **bold text2**.';
        const expected = 'A **bold text1** and another **bold text2**.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '__Bold Text__';
        const expected = '**Bold Text**';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'A __bold text1__ and another __bold text2__.';
        const expected = 'A **bold text1** and another **bold text2**.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '__underscore1__ and **asterisk1** and __underscore2__ and **asterisk2**.';
        const expected = '**underscore1** and **asterisk1** and **underscore2** and **asterisk2**.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });
    });

    // ITALIC
    describe('italic', () => {
      test('single with asterisks', () => {
        const testText = '*Italic Text*';
        const expected = '_Italic Text_';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with asterisks', () => {
        const testText = 'A *italic text1* and another *italic text2*.';
        const expected = 'A _italic text1_ and another _italic text2_.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('single with underscores', () => {
        const testText = '_Bold Text_';
        const expected = '_Bold Text_';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'A _bold text1_ and another _bold text2_.';
        const expected = 'A _bold text1_ and another _bold text2_.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with asterisks and underscores', () => {
        const testText = '_underscore1_ and *asterisk1* and _underscore2_ and *asterisk2*.';
        const expected = '_underscore1_ and _asterisk1_ and _underscore2_ and _asterisk2_.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('not matching single asterisk', () => {
        const testText = 'Test*Text';
        const expected = 'Test*Text';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });
    });
  });

  // LIST
  describe('list', () => {
    test('single with asterisk', () => {
      const testText = '* List element';
      const expected = '- List element';

      const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
      const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

      expect(testNoEmbed).toEqual(expected);
      expect(testEmbed).toEqual(expected);
    });

    test('multiple with asterisks', () => {
      const testText = '* List element 1\n*  List element 2';
      const expected = '- List element 1\n- List element 2';

      const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
      const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

      expect(testNoEmbed).toEqual(expected);
      expect(testEmbed).toEqual(expected);
    });

    test('single with dash', () => {
      const testText = '- List element';
      const expected = '- List element';

      const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
      const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

      expect(testNoEmbed).toEqual(expected);
      expect(testEmbed).toEqual(expected);
    });

    test('multiple with dashes', () => {
      const testText = '- List element 1\n-  List element 2';
      const expected = '- List element 1\n- List element 2';

      const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
      const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

      expect(testNoEmbed).toEqual(expected);
      expect(testEmbed).toEqual(expected);
    });
  });
});
