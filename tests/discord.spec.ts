import { Partials, PermissionFlagsBits } from 'discord.js';
import DiscordBot from 'src/bots/discord.js';
import Channel from 'src/channel.js';
import Action from 'src/commands/action.js';
import CommandGroup from 'src/commands/command_group.js';
import Message from 'src/message.js';
import User, { UserRole } from 'src/user.js';
import MockBot from './mockClasses/mockBot.js';

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
      const expected = '\n\n__**Test**__\n';

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
      const expected = '\n\n**Test**\n';

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

  // SEPARATOR
  describe('separator', () => {
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

  // SLASH COMMAND NAME
  describe('slash command name', () => {
    test('single lowercase word is unchanged', () => {
      expect(DiscordBot.toSlashCommandName('roll')).toEqual('roll');
    });

    test('camelCase word is converted to kebab-case', () => {
      expect(DiscordBot.toSlashCommandName('notifyAll')).toEqual('notify-all');
    });

    test('multi-word camelCase word is converted to kebab-case', () => {
      expect(DiscordBot.toSlashCommandName('notifyGameSubs')).toEqual('notify-game-subs');
    });

    test('lowercases a trailing acronym-like segment', () => {
      expect(DiscordBot.toSlashCommandName('telegramCmds')).toEqual('telegram-cmds');
    });
  });

  // COMMAND GROUP ARGUMENT BRIDGING
  describe('command group argument bridging', () => {
    // Mirrors the leading-whitespace-anchored shape of the real action triggers in
    // src/commands/commands.ts (subscribe, unsubscribe, notifyAll, notifyGameSubs all
    // require a leading whitespace character to separate the command word from its
    // arguments), without depending on that module's heavyweight game/provider loading.
    const leadingWhitespaceTrigger = /^\s+(?<value>.+?)\s*$/;
    const action = new Action(
      'test-action',
      'Test action',
      'test <value>',
      leadingWhitespaceTrigger,
      // eslint-disable-next-line require-await
      async () => {},
    );

    const mockBot = new MockBot();
    const mockChannel = new Channel('mockChannel', mockBot);
    const mockUser = new User(mockBot, 'mockUser');

    test('empty args produce an empty group', () => {
      expect(DiscordBot.toCommandGroupArgs('')).toEqual('');
    });

    test('non-empty args are prefixed with a space', () => {
      expect(DiscordBot.toCommandGroupArgs('dota2')).toEqual(' dota2');
    });

    test('the bridged group matches a leading-whitespace action trigger', () => {
      const groupString = DiscordBot.toCommandGroupArgs('dota2');
      const message = new Message(mockUser, mockChannel, groupString, new Date());

      expect(action.test(message)).toBeTruthy();
    });

    test('the raw (unbridged) args string does not match, reproducing the bug this fixes', () => {
      const message = new Message(mockUser, mockChannel, 'dota2', new Date());

      expect(action.test(message)).toBeUndefined();
    });
  });

  // CLIENT SETUP
  describe('client setup', () => {
    test('the underlying Discord client is created with the Channel partial enabled', () => {
      const bot = new DiscordBot('mock-token', false);

      // Without this, DM interactions resolve to an uncached channel, which silently
      // wipes the channel's subscription data (see src/bots/discord.ts).
      expect(bot['bot'].options.partials).toContain(Partials.Channel);
    });
  });

  // REGISTER COMMAND
  describe('registerCommand', () => {
    const userCmd = new Action('ping', 'A user command', 'ping', /^\s*ping\s*$/, async () => {
      /* noop */
    });
    const adminGroupCmd = new CommandGroup(
      'subscribe',
      'An admin command group',
      () => 'subscribe',
      (channel, prefix) => `${prefix}subscribe`,
      () => /^\s*subscribe(?<group>.*)$/,
      async () => {
        /* noop */
      },
      [],
      UserRole.ADMIN,
    );
    const ownerCmd = new Action(
      'notifyAll',
      'An owner command',
      'notifyAll',
      /^\s*notifyAll\s*$/,
      async () => {
        /* noop */
      },
      UserRole.OWNER,
    );
    const rootGroup = new CommandGroup(
      'root',
      'Root',
      () => '',
      () => '',
      () => /^$/,
      async () => {
        /* noop */
      },
      [userCmd, adminGroupCmd, ownerCmd],
    );

    function buildSlashCommands() {
      const bot = new DiscordBot('mock-token', false);
      bot.registerCommand(rootGroup);
      return bot['slashCommands'];
    }

    test('a plain user command gets no args option and no default member permissions', () => {
      const slashCommands = buildSlashCommands();
      const cmd = slashCommands.find((c) => c.name === 'ping');

      expect(cmd?.options ?? []).toEqual([]);
      expect(cmd?.default_member_permissions).toBeUndefined();
    });

    test('a command group gets an optional args string option', () => {
      const slashCommands = buildSlashCommands();
      const cmd = slashCommands.find((c) => c.name === 'subscribe');

      expect(cmd?.options).toEqual([expect.objectContaining({ name: 'args', required: false })]);
    });

    test('admin and owner commands default to requiring the Administrator permission', () => {
      const slashCommands = buildSlashCommands();
      const adminCmd = slashCommands.find((c) => c.name === 'subscribe');
      const ownerCmd = slashCommands.find((c) => c.name === 'notify-all');

      expect(adminCmd?.default_member_permissions).toEqual(
        PermissionFlagsBits.Administrator.toString(),
      );
      expect(ownerCmd?.default_member_permissions).toEqual(
        PermissionFlagsBits.Administrator.toString(),
      );
    });
  });
});
