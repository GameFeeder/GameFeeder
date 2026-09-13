import Channel from 'src/channel.js';
import Action from 'src/commands/action.js';
import { renderCmdHelpEntry, renderCmdHelpLine } from 'src/commands/commands.js';
import { doc, list } from 'src/markup/build.js';
import renderDiscord from 'src/markup/renderers/discord.js';
import MockBot from './mockClasses/mockBot.js';

/** The help entry as the channel's messenger would show it. */
function renderEntry(action: Action, channel: Channel): string {
  return renderDiscord(doc(list(renderCmdHelpEntry(action, channel, '/'))), { masked: true });
}

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

  test('writes no markup of its own into the text', () => {
    // Backticks in the string would reach the reader as literal backticks,
    // because text from a command is escaped, not parsed.
    const channel = new Channel('mockChannel', new MockBot());

    expect(renderCmdHelpLine(action, channel, '/')).not.toContain('`');
  });
});

describe('renderCmdHelpEntry', () => {
  const action = new Action(
    'notifyGameSubs',
    'Notify the subs of a game',
    'notifyGameSubs (<game name>) <message>',
    /^\s*notifyGameSubs\s*$/,
    async () => {},
  );

  test('shows the syntax as code, not as literal backticks', () => {
    const channel = new Channel('mockChannel', new MockBot());

    expect(renderEntry(action, channel)).toBe(
      '- `/notifyGameSubs (<game name>) <message>` - Notify the subs of a game',
    );
  });

  test('rewrites the leading command name to kebab-case for Discord', () => {
    const bot = new MockBot();
    bot.name = 'discord';
    const channel = new Channel('mockChannel', bot);

    expect(renderEntry(action, channel)).toContain('`/notify-game-subs');
  });

  test('does not escape the syntax inside the code span', () => {
    const channel = new Channel('mockChannel', new MockBot());

    expect(renderEntry(action, channel)).not.toContain('\\');
  });
});
