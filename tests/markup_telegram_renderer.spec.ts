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
  underline,
  video,
} from 'src/markup/build.js';
import renderTelegram from 'src/markup/renderers/telegram.js';

function line(...children: Parameters<typeof paragraph>): string {
  return renderTelegram(doc(paragraph(...children)));
}

/** The markers that must be balanced for the legacy parse mode to accept a message. */
function isBalanced(rendered: string): boolean {
  const outsideCode = rendered.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const links = outsideCode.replace(/\[[^\]]*\]\([^)]*\)/g, '');

  return (links.match(/\*/g) ?? []).length % 2 === 0 && (links.match(/_/g) ?? []).length % 2 === 0;
}

describe('Telegram renderer', () => {
  describe('character styles', () => {
    test('should render bold with a single asterisk', () => {
      expect(line(bold('Text'))).toBe('*Text*');
    });

    test('should render italic with underscores', () => {
      expect(line(italic('Text'))).toBe('_Text_');
    });

    test.each([
      ['underline', underline('Text')],
      ['strikethrough', strike('Text')],
      ['a spoiler', spoiler('Text')],
    ])('should render %s as plain text', (_name, node) => {
      // The legacy parse mode has no representation for these at all.
      expect(line(node)).toBe('Text');
    });

    test('should not nest entities, which the parse mode rejects', () => {
      expect(line(bold('a ', italic('b')))).toBe('*a b*');
    });

    test('should move whitespace outside the markers', () => {
      expect(line('a', bold(' Text '), 'b')).toBe('a *Text* b');
    });

    test('should drop emphasis that has no text', () => {
      expect(line('x', bold(' '), 'y')).toBe('xy');
    });
  });

  describe('sanitizing', () => {
    test('should defuse a marker in the source text', () => {
      expect(line('2 * 3')).not.toContain('*');
    });

    test('should defuse an underscore in a name', () => {
      expect(line('half_life_2')).not.toContain('_');
    });

    test('should keep the surrounding emphasis intact', () => {
      const rendered = line(bold('2 * 3'));

      expect(rendered.startsWith('*')).toBe(true);
      expect(rendered.endsWith('*')).toBe(true);
      expect(isBalanced(rendered)).toBe(true);
    });

    test('should leave the markers balanced for awkward text', () => {
      const rendered = renderTelegram(doc(paragraph('2 * 3 and half_life and `code and [bracket')));

      expect(isBalanced(rendered)).toBe(true);
    });

    test('should defuse brackets that would break a link', () => {
      expect(line('[YOUR NAME]')).toBe('(YOUR NAME)');
    });
  });

  describe('links and media', () => {
    test('should always mask a link', () => {
      expect(line(link('https://example.com', 'Example'))).toBe('[Example](https://example.com)');
    });

    test('should strip formatting out of a link label', () => {
      // The parse mode rejects an entity inside a link.
      expect(line(link('https://example.com', bold('Example')))).toBe(
        '[Example](https://example.com)',
      );
    });

    test('should fall back to a label when a link has no text', () => {
      expect(line(link('https://example.com', ''))).toBe('[Link](https://example.com)');
    });

    test('should refuse a URL with a scheme it does not trust', () => {
      expect(line(link('javascript:alert(1)', 'Click'))).toBe('Click');
    });

    test('should label an image', () => {
      expect(line(image('https://example.com/a.png'))).toBe('[Image](https://example.com/a.png)');
    });

    test('should recognise a YouTube video', () => {
      expect(line(video('https://youtu.be/abc'))).toBe('[YouTube Video](https://youtu.be/abc)');
    });
  });

  describe('blocks', () => {
    test.each([1, 3, 6])('should render an h%i as bold text', (level) => {
      expect(renderTelegram(doc(heading(level as 1 | 3 | 6, 'Title')))).toBe('*Title*');
    });

    test('should render a bullet list', () => {
      expect(renderTelegram(doc(list(listItem('a'), listItem('b'))))).toBe('• a\n• b');
    });

    test('should render a numbered list', () => {
      expect(renderTelegram(doc(orderedList(listItem('a'), listItem('b'))))).toBe('1. a\n2. b');
    });

    test('should indent a nested list', () => {
      const nested = doc(list(listItem(paragraph('a'), list(listItem('b')))));

      expect(renderTelegram(nested)).toBe('• a\n  • b');
    });

    test('should render a quote as a quoted line', () => {
      // The old pipeline wrapped quotes in double quotes instead.
      expect(renderTelegram(doc(quote({}, 'a')))).toBe('> a');
    });

    test('should name the author of a quote', () => {
      expect(renderTelegram(doc(quote({ author: 'Gabe' }, 'a')))).toBe('> *Gabe*:\n> a');
    });

    test('should show a collapsed section as ordinary content', () => {
      expect(renderTelegram(doc(quote({ expandable: true }, 'a')))).toBe('a');
    });

    test('should render inline code', () => {
      expect(line(inlineCode('npm test'))).toBe('`npm test`');
    });

    test('should render a code block', () => {
      expect(renderTelegram(doc(code('one\ntwo')))).toBe('```\none\ntwo\n```');
    });

    test('should defuse a backtick inside code, which cannot be escaped', () => {
      expect(line(inlineCode('a ` b'))).toBe('`a ʼ b`');
    });

    test('should flatten a table into lines', () => {
      const grid = table(row(headerCell('Name'), headerCell('Score')), row(cell('a'), cell('1')));

      expect(renderTelegram(doc(grid))).toBe('*Name* | *Score*\na | 1');
    });

    test('should render a separator', () => {
      expect(renderTelegram(doc(paragraph('a'), separator(), paragraph('b')))).toBe('a\n\n--\n\nb');
    });
  });

  describe('output shape', () => {
    test('should separate blocks by a blank line', () => {
      expect(renderTelegram(doc(paragraph('a'), paragraph('b')))).toBe('a\n\nb');
    });

    test('should keep a break inside a paragraph', () => {
      expect(line('a', br(), 'b')).toBe('a\nb');
    });

    test('should render an empty document as an empty string', () => {
      expect(renderTelegram(doc())).toBe('');
    });

    test('should leave no trailing whitespace or blank line runs', () => {
      const rendered = renderTelegram(doc(paragraph('a'), paragraph(' '), paragraph('b')));

      expect(rendered).toBe(rendered.trim());
      expect(rendered).not.toMatch(/\n{3,}/);
      expect(rendered).not.toMatch(/[ \t]\n/);
    });
  });
});
