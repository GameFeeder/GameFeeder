import { Partials, PermissionFlagsBits } from 'discord.js';
import DiscordBot from 'src/bots/discord.js';
import Channel from 'src/channel.js';
import Action from 'src/commands/action.js';
import CommandGroup from 'src/commands/command_group.js';
import Game from 'src/game.js';
import { br, doc, image, paragraph } from 'src/markup/build.js';
import Message from 'src/message.js';
import Notification from 'src/notifications/notification.js';
import NotificationElement from 'src/notifications/notification_element.js';
import User, { UserRole } from 'src/user.js';
import MockBot from './mockClasses/mockBot.js';

describe('Discord bot', () => {
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

  // EMBED
  describe('embed from notification', () => {
    const BANNER = 'https://example.com/banner.png';
    const game = new Game('dota', ['dota'], 'Dota 2', '#A9372B', 'icon.png', {}, []);

    function embedOf(content: ReturnType<typeof doc>, preset?: string) {
      const notification = new Notification(
        new Date('2026-01-01T00:00:00Z'),
        game,
        new NotificationElement('Patch', 'https://example.com/patch'),
        content,
        undefined,
        undefined,
        undefined,
        preset,
      );
      return new DiscordBot('mock-token', false).embedFromNotification(notification);
    }

    test('should show an opening image in the embed image slot', () => {
      const embed = embedOf(doc(paragraph(image(BANNER), br(), 'The first sentence.')));

      expect(embed.image?.url).toBe(BANNER);
      expect(embed.description).toBe('The first sentence.');
    });

    test('should show a closing image in the embed image slot', () => {
      const embed = embedOf(doc(paragraph('Body'), paragraph(image(BANNER))));

      expect(embed.image?.url).toBe(BANNER);
      expect(embed.description).toBe('Body');
    });

    test('should leave an image in the middle of the post in the text', () => {
      const embed = embedOf(doc(paragraph('Before'), paragraph(image(BANNER)), paragraph('After')));

      expect(embed.image).toBeUndefined();
      expect(embed.description).toContain(BANNER);
    });

    test('should not displace an image the notification already carries', () => {
      const preset = 'https://example.com/preset.png';
      const embed = embedOf(doc(paragraph(image(BANNER)), paragraph('Body')), preset);

      expect(embed.image?.url).toBe(preset);
      // The post's own image is not lost: it stays in the text.
      expect(embed.description).toContain(BANNER);
    });

    test('should keep an image whose URL cannot be used in the text', () => {
      const embed = embedOf(
        doc(paragraph(image('javascript:alert(1)', 'Cover')), paragraph('Body')),
      );

      expect(embed.image).toBeUndefined();
      expect(embed.description).toContain('Cover');
    });

    test('should send no description when the post was only an image', () => {
      const embed = embedOf(doc(paragraph(image(BANNER))));

      expect(embed.image?.url).toBe(BANNER);
      expect(embed.description).toBeUndefined();
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
