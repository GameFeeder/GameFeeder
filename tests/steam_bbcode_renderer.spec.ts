import bbcodeToMarkdown from 'src/steam/bbcode/index.js';

const CLAN_IMAGES = 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans';

describe('Steam BBCode markdown renderer', () => {
  describe('character styles', () => {
    test('should render bold with asterisks', () => {
      expect(bbcodeToMarkdown('[b]Text[/b]')).toBe('**Text**');
    });

    test('should render italic with a single asterisk', () => {
      expect(bbcodeToMarkdown('[i]Text[/i]')).toBe('*Text*');
    });

    test.each([
      '[u]Text[/u]',
      '[strike]Text[/strike]',
      '[spoiler]Text[/spoiler]',
    ])('should render %s as plain text', (input) => {
      expect(bbcodeToMarkdown(input)).toBe('Text');
    });

    test('should move whitespace outside of the emphasis markers', () => {
      // `MDRegex.boldAsterisk` refuses to match `** Text **`.
      expect(bbcodeToMarkdown('a[b] Text [/b]b')).toBe('a **Text** b');
    });

    test('should collapse a line break inside emphasis', () => {
      // `MDRegex.boldAsterisk` does not match across lines.
      expect(bbcodeToMarkdown('[b]one\ntwo[/b]')).toBe('**one two**');
    });

    test('should drop emphasis that has no text', () => {
      expect(bbcodeToMarkdown('x[b] [/b]y')).toBe('xy');
      expect(bbcodeToMarkdown('[b][/b]')).toBe('');
    });

    test('should use underscores for italic text containing an asterisk', () => {
      // `MDRegex.italicAsterisk` cannot contain an asterisk.
      expect(bbcodeToMarkdown('[i]2 * 3[/i]')).toBe('_2 * 3_');
    });
  });

  describe('headings', () => {
    test.each([1, 2, 3, 4, 5, 6])('should render an h%i tag with hashes', (level) => {
      expect(bbcodeToMarkdown(`[h${level}]Text[/h${level}]`)).toBe(`${'#'.repeat(level)} Text`);
    });

    test('should strip emphasis from a heading', () => {
      // Both bots wrap headings in their own markers, which would nest badly.
      expect(bbcodeToMarkdown('[h1][b]Text[/b][/h1]')).toBe('# Text');
    });

    test('should put a heading on its own line', () => {
      expect(bbcodeToMarkdown('[p]a[/p][h2]Title[/h2][p]b[/p]')).toBe('a\n\n## Title\n\nb');
    });
  });

  describe('links', () => {
    test('should render a link', () => {
      expect(bbcodeToMarkdown('[url=https://x.com]Text[/url]')).toBe('[Text](https://x.com)');
    });

    test('should render the quoted and unquoted forms alike', () => {
      expect(bbcodeToMarkdown('[url="https://x.com"]Text[/url]')).toBe(
        bbcodeToMarkdown('[url=https://x.com]Text[/url]'),
      );
    });

    test('should replace brackets in a link label', () => {
      // `MDRegex.link` ends the label at the first closing bracket.
      expect(bbcodeToMarkdown('[url=https://x.com]a [YOUR NAME] b[/url]')).toBe(
        '[a (YOUR NAME) b](https://x.com)',
      );
    });

    test('should encode parentheses in a URL', () => {
      // `MDRegex.link` ends the URL at the first closing parenthesis.
      expect(bbcodeToMarkdown('[url=https://x.com/Rust_(game)]Rust[/url]')).toBe(
        '[Rust](https://x.com/Rust_%28game%29)',
      );
    });

    test('should unwrap the Steam link filter', () => {
      expect(
        bbcodeToMarkdown(
          '[url=https://steamcommunity.com/linkfilter/?url=https://github.com]T[/url]',
        ),
      ).toBe('[T](https://github.com)');
    });

    test('should name a link that has no label after its target', () => {
      expect(
        bbcodeToMarkdown('[dynamiclink href="https://www.twitch.tv/corky"][/dynamiclink]'),
      ).toBe('[twitch.tv/corky](https://www.twitch.tv/corky)');
    });

    test('should name a Steam store link after the app', () => {
      expect(
        bbcodeToMarkdown(
          '[dynamiclink href="https://store.steampowered.com/app/251570/7_Days_to_Die/"][/dynamiclink]',
        ),
      ).toBe('[7 Days to Die](https://store.steampowered.com/app/251570/7_Days_to_Die/)');
    });
  });

  describe('images and video', () => {
    test.each([
      ['[img]{STEAM_CLAN_IMAGE}/a.png[/img]', `![Image](${CLAN_IMAGES}/a.png)`],
      ['[img src="{STEAM_CLAN_LOC_IMAGE}/a.png"][/img]', `![Image](${CLAN_IMAGES}/a.png)`],
      ['[img src="https://x.com/a.png"][/img]', '![Image](https://x.com/a.png)'],
    ])('should render %s as an image', (input, expected) => {
      expect(bbcodeToMarkdown(input)).toBe(expected);
    });

    test('should render an image inside a link in the shape MDRegex expects', () => {
      expect(bbcodeToMarkdown('[url=https://x.com][img]https://x.com/a.png[/img][/url]')).toBe(
        '[![Image](https://x.com/a.png)](https://x.com)',
      );
    });

    test('should still recognise an image link that is split over lines', () => {
      expect(bbcodeToMarkdown('[url=https://x.com]\n[img]https://x.com/a.png[/img]\n[/url]')).toBe(
        '[![Image](https://x.com/a.png)](https://x.com)',
      );
    });

    test('should give an image its own line', () => {
      expect(bbcodeToMarkdown('[p][img]https://x.com/a.png[/img]Caption[/p]')).toBe(
        '![Image](https://x.com/a.png)\nCaption',
      );
    });

    test('should render a YouTube preview as a link', () => {
      expect(bbcodeToMarkdown('[previewyoutube=PVNSct9atp8;full][/previewyoutube]')).toBe(
        '[YouTube Video](https://youtu.be/PVNSct9atp8)',
      );
    });
  });

  describe('lists', () => {
    test('should render a bullet on each line', () => {
      expect(bbcodeToMarkdown('[list][*]a[*]b[/list]')).toBe('- a\n- b');
    });

    test('should number an ordered list', () => {
      expect(bbcodeToMarkdown('[olist][*]a[*]b[/olist]')).toBe('1. a\n2. b');
    });

    test('should indent a nested list', () => {
      expect(bbcodeToMarkdown('[list][*]a[list][*]b[/list][/*][/list]')).toBe('- a\n  - b');
    });

    test('should keep an item on a single line', () => {
      // `MDRegex.list` only matches a bullet at the start of a line.
      expect(bbcodeToMarkdown('[list][*][p]one\ntwo[/p][/*][/list]')).toBe('- one\n  two');
    });

    test('should merge the single item lists Steam emits in sequence', () => {
      expect(bbcodeToMarkdown('[list][*]a[/*][/list][list][*]b[/*][/list]')).toBe('- a\n- b');
    });
  });

  describe('other blocks', () => {
    test('should prefix every line of a quote', () => {
      expect(bbcodeToMarkdown('[quote]a\n\nb[/quote]')).toBe('> a\n>\n> b');
    });

    test('should name the author of a quote', () => {
      expect(bbcodeToMarkdown('[quote=Tim]a[/quote]')).toBe('> **Tim**:\n> a');
    });

    test('should fence a code block', () => {
      expect(bbcodeToMarkdown('[code]x = 1[/code]')).toBe('```\nx = 1\n```');
    });

    test('should surround a separator with blank lines', () => {
      // Without the blank line `MDRegex.h2Alt` would turn `a\n---` into a heading.
      expect(bbcodeToMarkdown('[p]a[/p][hr][/hr][p]b[/p]')).toBe('a\n\n---\n\nb');
    });

    test('should render a table as one line per row', () => {
      expect(
        bbcodeToMarkdown(
          '[table][tr][th]A[/th][th]B[/th][/tr][tr][td]1[/td][td]2[/td][/tr][/table]',
        ),
      ).toBe('**A** | **B**\n1 | 2');
    });

    test('should keep the content of a collapsible section', () => {
      expect(bbcodeToMarkdown('[expand type=details]Hidden[/expand]')).toBe('Hidden');
    });
  });

  describe('output shape', () => {
    test('should return an empty string for empty input', () => {
      expect(bbcodeToMarkdown('')).toBe('');
    });

    test('should separate blocks by exactly one blank line', () => {
      const markdown = bbcodeToMarkdown('[p]a[/p][p][/p][p][/p][p]b[/p]');

      expect(markdown).toBe('a\n\nb');
      expect(markdown).not.toMatch(/\n{3,}/);
    });

    test('should not leave trailing whitespace on a line', () => {
      expect(bbcodeToMarkdown('[p]a  \nb[/p]')).toBe('a\nb');
    });

    test('should trim the result', () => {
      const markdown = bbcodeToMarkdown('\n\n[p]a[/p]\n\n');
      expect(markdown).toBe(markdown.trim());
    });
  });
});
