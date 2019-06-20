import DiscordBot from './bot_discord';

xdescribe('DiscordBot', () => {
  describe('msgFromMarkdown', () => {
    describe('Bold', () => {
      test('Asterisk', () => {
        const testText = '**Bold Text**';
        const test = DiscordBot.msgFromMarkdown(testText, false);
        const expected = '**Bold Text**';

        expect(test).toEqual(expected);
      });
    });
  });
});
