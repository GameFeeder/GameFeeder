import Channel from 'src/channel.js';
import Action from 'src/commands/action.js';
import { renderCmdHelpLine } from 'src/commands/commands.js';
import MockBot from './mockClasses/mockBot.js';

describe('renderCmdHelpLine', () => {
  const action = new Action(
    'notifyGameSubs',
    'Notify the subs of a game',
    'notifyGameSubs (<game name>) <message>',
    /^\s*notifyGameSubs\s*$/,
    // eslint-disable-next-line require-await
    async () => {},
  );

  test('keeps the internal camelCase name for non-Discord bots', () => {
    const bot = new MockBot();
    const channel = new Channel('mockChannel', bot);

    const line = renderCmdHelpLine(action, channel, '/');

    expect(line).toContain('/notifyGameSubs');
  });

  test('rewrites the leading command name to kebab-case for Discord', () => {
    const bot = new MockBot();
    bot.name = 'discord';
    const channel = new Channel('mockChannel', bot);

    const line = renderCmdHelpLine(action, channel, '/');

    expect(line).toContain('/notify-game-subs');
    expect(line).not.toContain('/notifyGameSubs');
  });
});
