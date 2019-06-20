import DiscordBot from './bot_discord';

describe('DiscordBot', () => {
  describe('msgFromMarkdown', () => {
    // BOLD
    describe('Bold', () => {
      test('Simple Asterisk', () => {
        const testText = '**Bold Text**';
        const expected = '**Bold Text**';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Multiple Asterisk', () => {
        const testText = 'A **bold text1** and another **bold text2**.';
        const expected = 'A **bold text1** and another **bold text2**.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Simple Underscore', () => {
        const testText = '__Bold Text__';
        const expected = '**Bold Text**';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Multiple Underscore', () => {
        const testText = 'A __bold text1__ and another __bold text2__.';
        const expected = 'A **bold text1** and another **bold text2**.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Multiple combined', () => {
        const testText = '__underscore1__ and **asterisk1** and __underscore2__ and **asterisk2**.';
        const expected = '**underscore1** and **asterisk1** and **underscore2** and **asterisk2**.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });
    });

    // ITALIC
    describe('Italic', () => {
      test('Simple Asterisk', () => {
        const testText = '*Italic Text*';
        const expected = '_Italic Text_';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Multiple Asterisk', () => {
        const testText = 'A *italic text1* and another *italic text2*.';
        const expected = 'A _italic text1_ and another _italic text2_.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Simple Underscore', () => {
        const testText = '_Bold Text_';
        const expected = '_Bold Text_';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Multiple Underscore', () => {
        const testText = 'A _bold text1_ and another _bold text2_.';
        const expected = 'A _bold text1_ and another _bold text2_.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });

      test('Multiple combined', () => {
        const testText = '_underscore1_ and *asterisk1* and _underscore2_ and *asterisk2*.';
        const expected = '_underscore1_ and _asterisk1_ and _underscore2_ and _asterisk2_.';

        const testNoEmbed = DiscordBot.msgFromMarkdown(testText, false);
        const testEmbed = DiscordBot.msgFromMarkdown(testText, true);

        expect(testNoEmbed).toEqual(expected);
        expect(testEmbed).toEqual(expected);
      });
    });
  });
});
