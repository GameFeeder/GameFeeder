import {
  bold,
  br,
  cell,
  code,
  doc,
  headerCell,
  heading,
  image,
  inlineCode,
  italic,
  link,
  list,
  listItem,
  orderedList,
  paragraph,
  quote,
  row,
  separator,
  spoiler,
  strike,
  table,
  text,
  underline,
  video,
} from 'src/markup/build.js';
import renderDiscord from 'src/markup/renderers/discord.js';

/** Renders a single paragraph, which is the common case. */
function line(...children: Parameters<typeof paragraph>): string {
  return renderDiscord(doc(paragraph(...children)));
}

describe('Discord renderer', () => {
  describe('character styles', () => {
    test('should render bold with double asterisks', () => {
      expect(line(bold('Text'))).toBe('**Text**');
    });

    test('should render italic with a single asterisk', () => {
      expect(line(italic('Text'))).toBe('*Text*');
    });

    test('should render underline, which the old pipeline dropped', () => {
      expect(line(underline('Text'))).toBe('__Text__');
    });

    test('should render strikethrough, which the old pipeline dropped', () => {
      expect(line(strike('Text'))).toBe('~~Text~~');
    });

    test('should render a spoiler, which the old pipeline dropped', () => {
      expect(line(spoiler('Text'))).toBe('||Text||');
    });

    test('should nest different styles', () => {
      expect(line(bold(italic('Text')))).toBe('***Text***');
    });

    test('should not nest a style inside itself', () => {
      expect(line(bold('a ', bold('b')))).toBe('**a b**');
    });

    test('should move whitespace outside the markers', () => {
      expect(line('a', bold(' Text '), 'b')).toBe('a **Text** b');
    });

    test('should drop emphasis that has no text', () => {
      expect(line('x', bold(' '), 'y')).toBe('xy');
    });
  });

  describe('escaping', () => {
    test('should stop source text from becoming emphasis', () => {
      expect(line('2 * 3')).toBe('2 \\* 3');
    });

    test('should stop a name from becoming italics', () => {
      expect(line('half_life_2')).toBe('half\\_life\\_2');
    });

    test('should keep escaped text out of the emphasis it sits in', () => {
      expect(line(bold('2 * 3'))).toBe('**2 \\* 3**');
    });

    test('should defuse a line that begins like a list', () => {
      expect(line('- not a list')).toBe('\\- not a list');
    });

    test.each([
      '# not a heading',
      '> not a quote',
      '1. not a list',
    ])('should defuse %s', (value) => {
      expect(line(value)).toBe(`\\${value}`);
    });

    test('should leave a hyphen in the middle of a line alone', () => {
      expect(line('Half-Life 2')).toBe('Half-Life 2');
    });

    test('should defuse every line of a paragraph, not just the first', () => {
      expect(line('a', br(), '- b')).toBe('a\n\\- b');
    });

    test('should not escape the markup it emits itself', () => {
      expect(renderDiscord(doc(list(listItem('a'))))).toBe('- a');
    });
  });

  describe('links and media', () => {
    test('should mask a link when masking is on', () => {
      expect(
        renderDiscord(doc(paragraph(link('https://example.com', 'Example'))), { masked: true }),
      ).toBe('[Example](https://example.com)');
    });

    test('should spell the URL out when masking is off', () => {
      expect(line(link('https://example.com', 'Example'))).toBe('Example (https://example.com)');
    });

    test('should fall back to a label when a link has no text', () => {
      expect(line(link('https://example.com', ''))).toBe('Link (https://example.com)');
    });

    test('should drop a link nested inside a link', () => {
      const nested = link('https://outer.example', 'a ', link('https://inner.example', 'b'));

      expect(renderDiscord(doc(paragraph(nested)), { masked: true })).toBe(
        '[a b](https://outer.example)',
      );
    });

    test('should refuse a URL with a scheme it does not trust', () => {
      expect(line(link('javascript:alert(1)', 'Click'))).toBe('Click');
    });

    test('should send a bare URL when the label is the URL itself', () => {
      // Discord refuses to mask such a link and prints the markup verbatim.
      const url = 'https://store.playstation.com/concept/10018186';

      expect(renderDiscord(doc(paragraph(link(url, url))), { masked: true })).toBe(url);
      expect(renderDiscord(doc(paragraph(link(url))), { masked: true })).toBe(url);
    });

    test('should send a bare URL even when its characters need escaping', () => {
      const url = 'https://x.com/a_b';

      expect(renderDiscord(doc(paragraph(link(url, url))), { masked: true })).toBe(url);
    });

    test('should not spell an unmasked URL out twice', () => {
      const url = 'https://x.com/a';

      expect(line(link(url, url))).toBe(url);
    });

    test('should still mask a link that has a label of its own', () => {
      expect(renderDiscord(doc(paragraph(link('https://x.com', 'Shop'))), { masked: true })).toBe(
        '[Shop](https://x.com)',
      );
    });

    test('should escape the alt text of an image', () => {
      expect(line(image('https://x.com/a.png', '2 * 3'))).toBe('2 \\* 3 (https://x.com/a.png)');
    });

    test('should use the alt text of an image as its label', () => {
      expect(line(image('https://example.com/a.png', 'Cover'))).toBe(
        'Cover (https://example.com/a.png)',
      );
    });

    test('should label an image that has no alt text', () => {
      expect(line(image('https://example.com/a.png'))).toBe('Image (https://example.com/a.png)');
    });

    test('should recognise a YouTube video', () => {
      expect(line(video('https://youtu.be/abc'))).toBe('YouTube Video (https://youtu.be/abc)');
    });

    test('should flatten a label that spans lines', () => {
      expect(line(link('https://example.com', 'a', br(), 'b'))).toBe('a b (https://example.com)');
    });
  });

  describe('code', () => {
    test('should render inline code', () => {
      expect(line(inlineCode('npm test'))).toBe('`npm test`');
    });

    test('should not escape the contents of inline code', () => {
      expect(line(inlineCode('2 * 3'))).toBe('`2 * 3`');
    });

    test('should widen the fence around code that holds a backtick', () => {
      expect(line(inlineCode('a ` b'))).toBe('``a ` b``');
    });

    test('should pad code that starts or ends with a backtick', () => {
      expect(line(inlineCode('`a`'))).toBe('`` `a` ``');
    });

    test('should render a code block', () => {
      expect(renderDiscord(doc(code('one\ntwo')))).toBe('```\none\ntwo\n```');
    });

    test('should label a code block with its language', () => {
      expect(renderDiscord(doc(code('a = 1', 'python')))).toBe('```python\na = 1\n```');
    });

    test('should widen the fence around a block that holds one', () => {
      expect(renderDiscord(doc(code('```')))).toBe('````\n```\n````');
    });
  });

  describe('blocks', () => {
    test.each([1, 2, 3])('should render an h%i natively', (level) => {
      expect(renderDiscord(doc(heading(level as 1 | 2 | 3, 'Title')))).toBe(
        `${'#'.repeat(level)} Title`,
      );
    });

    test.each([4, 5, 6])('should render an h%i as bold text', (level) => {
      expect(renderDiscord(doc(heading(level as 4 | 5 | 6, 'Title')))).toBe('**Title**');
    });

    test('should not double the markers of a bold deep heading', () => {
      expect(renderDiscord(doc(heading(4, bold('Title'))))).toBe('**Title**');
    });

    test('should render a bullet list', () => {
      expect(renderDiscord(doc(list(listItem('a'), listItem('b'))))).toBe('- a\n- b');
    });

    test('should render a numbered list', () => {
      expect(renderDiscord(doc(orderedList(listItem('a'), listItem('b'))))).toBe('1. a\n2. b');
    });

    test('should count a numbered list from its start', () => {
      const numbered = { ...orderedList(listItem('a'), listItem('b')), start: 5 };

      expect(renderDiscord(doc(numbered))).toBe('5. a\n6. b');
    });

    test('should indent a nested list', () => {
      const nested = doc(list(listItem(paragraph('a'), list(listItem('b')))));

      expect(renderDiscord(nested)).toBe('- a\n  - b');
    });

    test('should render a quote', () => {
      expect(renderDiscord(doc(quote({}, 'a')))).toBe('> a');
    });

    test('should name the author of a quote', () => {
      expect(renderDiscord(doc(quote({ author: 'Gabe' }, 'a')))).toBe('> **Gabe**:\n> a');
    });

    test('should quote every line of a multi-block quote', () => {
      // The blank line keeps its space: a bare `>` is literal text to Discord,
      // which would end the quote and show the marker to the reader.
      expect(renderDiscord(doc(quote({}, paragraph('a'), paragraph('b'))))).toBe('> a\n> \n> b');
    });

    test('should keep a nested quote continuous too', () => {
      const nested = doc(quote({}, paragraph('a'), quote({}, paragraph('b'), paragraph('c'))));

      expect(renderDiscord(nested)).not.toMatch(/^>+$/m);
    });

    test('should show a collapsed section as ordinary content', () => {
      // Discord cannot collapse anything, and the content of a Steam [expand]
      // is not a quotation, so quoting it would misrepresent it.
      expect(renderDiscord(doc(quote({ expandable: true }, 'a')))).toBe('a');
    });

    test('should still quote a collapsed section that names an author', () => {
      expect(renderDiscord(doc(quote({ expandable: true, author: 'Gabe' }, 'a')))).toBe(
        '> **Gabe**:\n> a',
      );
    });

    test('should flatten a table into lines', () => {
      const grid = table(row(headerCell('Name'), headerCell('Score')), row(cell('a'), cell('1')));

      expect(renderDiscord(doc(grid))).toBe('**Name** | **Score**\na | 1');
    });

    test('should render a separator', () => {
      expect(renderDiscord(doc(paragraph('a'), separator(), paragraph('b')))).toBe('a\n\n---\n\nb');
    });
  });

  describe('output shape', () => {
    test('should separate blocks by a blank line', () => {
      expect(renderDiscord(doc(paragraph('a'), paragraph('b')))).toBe('a\n\nb');
    });

    test('should keep a break inside a paragraph', () => {
      expect(line('a', br(), 'b')).toBe('a\nb');
    });

    test('should render an empty document as an empty string', () => {
      expect(renderDiscord(doc())).toBe('');
    });

    test('should leave no trailing whitespace or blank line runs', () => {
      const rendered = renderDiscord(doc(paragraph('a'), paragraph(' '), paragraph('b')));

      expect(rendered).toBe(rendered.trim());
      expect(rendered).not.toMatch(/\n{3,}/);
      expect(rendered).not.toMatch(/[ \t]\n/);
    });

    test('should leave the emphasis markers balanced', () => {
      const rendered = renderDiscord(
        doc(paragraph('2 * 3 ', bold('and'), ' half_life ', spoiler('secret'))),
      );

      expect((rendered.match(/(?<!\\)\*\*/g) ?? []).length % 2).toBe(0);
      expect((rendered.match(/(?<!\\)\|\|/g) ?? []).length % 2).toBe(0);
    });
  });
});
