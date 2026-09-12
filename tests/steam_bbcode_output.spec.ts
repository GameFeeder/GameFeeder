import renderDiscord from 'src/markup/renderers/discord.js';
import renderTelegram from 'src/markup/renderers/telegram.js';
import parseBBCode from 'src/steam/bbcode/index.js';

const CLAN_IMAGES = 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans';

/** Steam BBCode as a Discord message would show it. */
function discord(bbcode: string): string {
  return renderDiscord(parseBBCode(bbcode), { masked: true });
}

/** Steam BBCode as a Telegram message would show it. */
function telegram(bbcode: string): string {
  return renderTelegram(parseBBCode(bbcode));
}

describe('Steam BBCode output', () => {
  describe('character styles', () => {
    test('should render bold', () => {
      expect(discord('[b]Text[/b]')).toBe('**Text**');
      expect(telegram('[b]Text[/b]')).toBe('*Text*');
    });

    test('should render italic', () => {
      expect(discord('[i]Text[/i]')).toBe('*Text*');
      expect(telegram('[i]Text[/i]')).toBe('_Text_');
    });

    test.each([
      ['[u]Text[/u]', '__Text__'],
      ['[strike]Text[/strike]', '~~Text~~'],
      ['[spoiler]Text[/spoiler]', '||Text||'],
    ])('should render %s on Discord, which the old pipeline could not', (input, expected) => {
      expect(discord(input)).toBe(expected);
    });

    test.each([
      '[u]Text[/u]',
      '[strike]Text[/strike]',
      '[spoiler]Text[/spoiler]',
    ])('should fall back to plain text for %s on Telegram', (input) => {
      // The legacy parse mode has no representation for any of these.
      expect(telegram(input)).toBe('Text');
    });

    test('should move whitespace outside the emphasis markers', () => {
      expect(discord('a[b] Text [/b]b')).toBe('a **Text** b');
    });

    test('should keep a line break inside emphasis', () => {
      // The old pipeline collapsed it, because its regexes could not match
      // emphasis across lines. Both messengers render it as written.
      expect(discord('[b]one\ntwo[/b]')).toBe('**one\ntwo**');
    });

    test('should drop emphasis that has no text', () => {
      expect(discord('x[b] [/b]y')).toBe('xy');
      expect(discord('[b][/b]')).toBe('');
    });

    test('should not need a fallback marker for text holding an asterisk', () => {
      // The old pipeline switched to underscores here because its regexes could
      // not match an asterisk inside emphasis. Escaping removes the problem.
      expect(discord('[i]2 * 3[/i]')).toBe('*2 \\* 3*');
    });
  });

  describe('headings', () => {
    test.each([1, 2, 3])('should render an h%i natively on Discord', (level) => {
      expect(discord(`[h${level}]Text[/h${level}]`)).toBe(`${'#'.repeat(level)} Text`);
    });

    test.each([4, 5, 6])('should render an h%i as bold text on Discord', (level) => {
      expect(discord(`[h${level}]Text[/h${level}]`)).toBe('**Text**');
    });

    test('should render a heading as bold text on Telegram', () => {
      expect(telegram('[h1]Text[/h1]')).toBe('*Text*');
    });

    test('should not repeat bold inside a heading that is already bold', () => {
      expect(discord('[h1][b]Text[/b][/h1]')).toBe('# Text');
    });

    test('should keep emphasis a heading does not already imply', () => {
      expect(discord('[h1]a [i]b[/i][/h1]')).toBe('# a *b*');
    });

    test('should put a heading on its own line', () => {
      expect(discord('[p]a[/p][h2]Title[/h2][p]b[/p]')).toBe('a\n\n## Title\n\nb');
    });
  });

  describe('links', () => {
    test('should render a link', () => {
      expect(discord('[url=https://x.com]Label[/url]')).toBe('[Label](https://x.com)');
    });

    test('should derive a label from the URL when the tag carries no text', () => {
      expect(discord('[url=https://x.com/a][/url]')).toBe('[x.com/a](https://x.com/a)');
    });

    test('should name the app of a Steam store link', () => {
      const input =
        '[dynamiclink href="https://store.steampowered.com/app/251570/7_Days_to_Die/"][/dynamiclink]';

      expect(discord(input)).toBe(
        '[7 Days to Die](https://store.steampowered.com/app/251570/7_Days_to_Die/)',
      );
    });

    test('should unwrap a Steam link filter', () => {
      const input = '[url=https://steamcommunity.com/linkfilter/?url=https://github.com]Repo[/url]';

      expect(discord(input)).toBe('[Repo](https://github.com)');
    });

    test('should keep the parentheses of a URL', () => {
      // The old pipeline percent-encoded them so its regexes could find the end
      // of the URL. A tree has no such ambiguity.
      const input = '[url=https://en.wikipedia.org/wiki/Portal_(series)]Portal[/url]';

      expect(discord(input)).toBe('[Portal](https://en.wikipedia.org/wiki/Portal_(series))');
    });

    test('should keep the brackets of a link label', () => {
      // The old pipeline rewrote them as parentheses to survive its regexes.
      expect(discord('[url=https://x.com]Hi [YOUR NAME][/url]')).toBe(
        '[Hi \\[YOUR NAME\\]](https://x.com)',
      );
    });
  });

  describe('images and video', () => {
    test.each([
      ['[img]{STEAM_CLAN_IMAGE}/a.png[/img]', `${CLAN_IMAGES}/a.png`],
      ['[img src="{STEAM_CLAN_LOC_IMAGE}/a.png"][/img]', `${CLAN_IMAGES}/a.png`],
      ['[img src="https://x.com/a.png"][/img]', 'https://x.com/a.png'],
    ])('should resolve the image of %s', (input, url) => {
      expect(discord(input)).toBe(`[Image](${url})`);
    });

    test('should keep both halves of a clickable banner', () => {
      // Neither what it shows nor where it points may be lost.
      expect(discord('[url=https://x.com][img]https://x.com/a.png[/img][/url]')).toBe(
        '[Image](https://x.com/a.png) ([Link](https://x.com))',
      );
    });

    test('should recognise a banner split over lines', () => {
      expect(discord('[url=https://x.com]\n[img]https://x.com/a.png[/img]\n[/url]')).toBe(
        '[Image](https://x.com/a.png) ([Link](https://x.com))',
      );
    });

    test('should give media a line of its own', () => {
      expect(discord('[p][img]https://x.com/a.png[/img]Caption[/p]')).toBe(
        '[Image](https://x.com/a.png)\nCaption',
      );
    });

    test('should render a YouTube preview as a link', () => {
      expect(discord('[previewyoutube=PVNSct9atp8;full][/previewyoutube]')).toBe(
        '[YouTube Video](https://youtu.be/PVNSct9atp8)',
      );
    });
  });

  describe('lists', () => {
    test('should render a bullet on each line', () => {
      expect(discord('[list][*]a[*]b[/list]')).toBe('- a\n- b');
      expect(telegram('[list][*]a[*]b[/list]')).toBe('• a\n• b');
    });

    test('should number an ordered list', () => {
      expect(discord('[olist][*]a[*]b[/olist]')).toBe('1. a\n2. b');
    });

    test('should indent a nested list', () => {
      expect(discord('[list][*]a[list][*]b[/list][/*][/list]')).toBe('- a\n  - b');
    });

    test('should merge the single item lists Steam emits in sequence', () => {
      expect(discord('[list][*]a[/*][/list][list][*]b[/*][/list]')).toBe('- a\n- b');
    });
  });

  describe('other blocks', () => {
    test('should prefix every line of a quote', () => {
      expect(discord('[quote]a\n\nb[/quote]')).toBe('> a\n>\n> b');
    });

    test('should name the author of a quote', () => {
      expect(discord('[quote=Tim]a[/quote]')).toBe('> **Tim**:\n> a');
    });

    test('should fence a code block', () => {
      expect(discord('[code]x = 1[/code]')).toBe('```\nx = 1\n```');
    });

    test('should surround a separator with blank lines', () => {
      expect(discord('[p]a[/p][hr][/hr][p]b[/p]')).toBe('a\n\n---\n\nb');
    });

    test('should render a table as one line per row', () => {
      const input = '[table][tr][th]A[/th][th]B[/th][/tr][tr][td]1[/td][td]2[/td][/tr][/table]';

      expect(discord(input)).toBe('**A** | **B**\n1 | 2');
    });

    test('should keep the content of a collapsible section', () => {
      expect(discord('[expand type=details]Hidden[/expand]')).toBe('Hidden');
    });
  });

  describe('escaping', () => {
    test('should stop post text from becoming emphasis on Discord', () => {
      expect(discord('2 * 3 and half_life')).toBe('2 \\* 3 and half\\_life');
    });

    test('should leave no unpaired marker for Telegram', () => {
      // An unpaired marker is a hard API error in the legacy parse mode.
      expect(telegram('2 * 3 and half_life and `code')).not.toMatch(/[*_`]/);
    });

    test('should keep bracketed prose out of link syntax', () => {
      expect(discord('Hello [YOUR NAME], welcome')).toBe('Hello \\[YOUR NAME\\], welcome');
    });
  });

  describe('output shape', () => {
    test('should return an empty string for empty input', () => {
      expect(discord('')).toBe('');
      expect(telegram('')).toBe('');
    });

    test('should separate blocks by exactly one blank line', () => {
      expect(discord('[p]a[/p][p][/p][p]b[/p]')).toBe('a\n\nb');
    });

    test('should not leave trailing whitespace on a line', () => {
      expect(discord('[p]a   \n   b[/p]')).not.toMatch(/[ \t]\n/);
    });

    test('should trim the result', () => {
      const rendered = discord('\n\n[p]a[/p]\n\n');

      expect(rendered).toBe(rendered.trim());
    });
  });
});
