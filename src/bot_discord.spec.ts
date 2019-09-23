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

    // IMAGE LINK
    describe('image link', () => {
      test('single', () => {
        const testText = '![[image link](www.url.com)](www.url.png)';
        const expectedNoEmbed = 'image link (www.url.com)';
        const expectedEmbed = '[image link](www.url.png) ([link](www.url.com))';

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
        const testText = '_Italic Text_';
        const expected = '_Italic Text_';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('multiple with underscores', () => {
        const testText = 'A _italic text1_ and another _italic text2_.';
        const expected = 'A _italic text1_ and another _italic text2_.';

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

  // HEADER
  describe('header', () => {
    test('h1-3', () => {
      const testText1 = '# Test';
      const testText2 = '## Test';
      const testText3 = '### Test';
      const expected = '\n__**Test**__';

      const testNoEmbed1 = DiscordBot.msgFromMarkdown(testText1, false);
      const testEmbed1 = DiscordBot.msgFromMarkdown(testText1, true);
      const testNoEmbed2 = DiscordBot.msgFromMarkdown(testText2, false);
      const testEmbed2 = DiscordBot.msgFromMarkdown(testText2, true);
      const testNoEmbed3 = DiscordBot.msgFromMarkdown(testText3, false);
      const testEmbed3 = DiscordBot.msgFromMarkdown(testText3, true);

      expect(testNoEmbed1).toEqual(expected);
      expect(testEmbed1).toEqual(expected);
      expect(testNoEmbed2).toEqual(expected);
      expect(testEmbed2).toEqual(expected);
      expect(testNoEmbed3).toEqual(expected);
      expect(testEmbed3).toEqual(expected);
    });

    test('h4-6', () => {
      const testText4 = '#### Test';
      const testText5 = '##### Test';
      const testText6 = '###### Test';
      const expected = '\n**Test**';

      const testNoEmbed4 = DiscordBot.msgFromMarkdown(testText4, false);
      const testEmbed4 = DiscordBot.msgFromMarkdown(testText4, true);
      const testNoEmbed5 = DiscordBot.msgFromMarkdown(testText5, false);
      const testEmbed5 = DiscordBot.msgFromMarkdown(testText5, true);
      const testNoEmbed6 = DiscordBot.msgFromMarkdown(testText6, false);
      const testEmbed6 = DiscordBot.msgFromMarkdown(testText6, true);

      expect(testNoEmbed4).toEqual(expected);
      expect(testEmbed4).toEqual(expected);
      expect(testNoEmbed5).toEqual(expected);
      expect(testEmbed5).toEqual(expected);
      expect(testNoEmbed6).toEqual(expected);
      expect(testEmbed6).toEqual(expected);
    });
  });

  // SEPERATOR
  describe('seperator', () => {
    test('with 3 dashes', () => {
      const testText = '\n\n---\n\n';
      const expected = '\n---\n';

      const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
      const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

      expect(testNoEmbed).toEqual(expected);
      expect(testEmbed).toEqual(expected);
    });

    test('with 3 asterisks', () => {
      const testText = '\n\n***\n\n';
      const expected = '\n---\n';

      const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
      const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

      expect(testNoEmbed).toEqual(expected);
      expect(testEmbed).toEqual(expected);
    });
  });
});
