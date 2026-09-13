import Game from 'src/game.js';
import { bold, doc, paragraph } from 'src/markup/build.js';
import renderDiscord from 'src/markup/renderers/discord.js';
import renderPlain from 'src/markup/renderers/plain.js';
import Notification from 'src/notifications/notification.js';
import NotificationElement from 'src/notifications/notification_element.js';

const game = new Game('dota', ['dota'], 'Dota 2', '#A9372B', 'icon.png', {}, []);

function notification(overrides: Partial<Notification> = {}): Notification {
  return Object.assign(
    new Notification(
      new Date('2026-01-01T00:00:00Z'),
      game,
      new NotificationElement('Patch 7.39', 'https://dota2.com/patches/7.39'),
      doc(paragraph('The ', bold('Sniper'), ' was rebalanced.')),
    ),
    overrides,
  );
}

/** The document, as a Discord embed would show it. */
function render(note: Notification, options?: Parameters<Notification['toDocument']>[0]): string {
  return renderDiscord(note.toDocument(options), { masked: true });
}

describe('Notification document', () => {
  describe('the envelope', () => {
    test('should open with the game it is for', () => {
      expect(render(notification())).toContain('New **Dota 2** update:');
    });

    test('should name the author when there is one', () => {
      const note = notification({ author: new NotificationElement('Valve') });

      expect(render(note)).toContain('New **Dota 2** update - Valve:');
    });

    test('should link the author when it has a link', () => {
      const note = notification({
        author: new NotificationElement('Valve', 'https://valvesoftware.com'),
      });

      expect(render(note)).toContain('New **Dota 2** update - [Valve](https://valvesoftware.com):');
    });

    test('should ignore an author with no name', () => {
      const note = notification({ author: new NotificationElement('') });

      expect(render(note)).toContain('New **Dota 2** update:');
    });

    test('should show the title in bold, linked to the post', () => {
      expect(render(notification())).toContain('[**Patch 7.39**](https://dota2.com/patches/7.39)');
    });

    test('should leave the title unlinked when it has no link', () => {
      const note = notification({ title: new NotificationElement('Patch 7.39') });

      expect(render(note)).toContain('**Patch 7.39**');
      expect(render(note)).not.toContain('](');
    });

    test('should include the content', () => {
      expect(render(notification())).toContain('The **Sniper** was rebalanced.');
    });

    test('should escape a game label that looks like markup', () => {
      const note = notification();
      note.game = { ...game, label: 'Half_Life 2' } as Game;

      expect(render(note)).toContain('New **Half\\_Life 2** update:');
    });
  });

  describe('options', () => {
    test('should point the title elsewhere when asked', () => {
      // Telegram's Instant View wraps the post URL.
      expect(render(notification(), { titleUrl: 'https://t.me/iv?url=x' })).toContain(
        '[**Patch 7.39**](https://t.me/iv?url=x)',
      );
    });

    test('should leave the title out for an embed that carries its own', () => {
      const rendered = render(notification(), { includeTitle: false });

      expect(rendered).not.toContain('Patch 7.39');
      expect(rendered).toContain('The **Sniper** was rebalanced.');
    });

    test('should leave the content out when asked', () => {
      const rendered = render(notification(), { includeContent: false });

      expect(rendered).toContain('Patch 7.39');
      expect(rendered).not.toContain('rebalanced');
    });

    test('should still produce the envelope with no content at all', () => {
      const note = notification({ content: undefined });

      expect(render(note)).toBe(
        'New **Dota 2** update:\n\n[**Patch 7.39**](https://dota2.com/patches/7.39)',
      );
    });
  });

  describe('toString', () => {
    test('should read as plain text for logs', () => {
      expect(notification().toString()).toBe('Patch 7.39 -  The Sniper was rebalanced.');
    });

    test('should cope with no content', () => {
      expect(notification({ content: undefined }).toString()).toBe('Patch 7.39 -  ');
    });
  });

  describe('as one tree', () => {
    test('should render the whole notification for plain text too', () => {
      expect(renderPlain(notification().toDocument())).toBe(
        'New Dota 2 update:\n\nPatch 7.39\n\nThe Sniper was rebalanced.',
      );
    });
  });
});
