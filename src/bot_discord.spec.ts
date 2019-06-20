import DiscordBot from './bot_discord';

describe('DiscordBot', () => {
  describe('msgFromMarkdown', () => {
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
  });
});
