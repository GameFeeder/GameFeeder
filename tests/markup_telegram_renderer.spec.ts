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
import renderTelegram, { telegramTextLength } from 'src/markup/renderers/telegram.js';
import { telegramHtmlProblem } from './telegram_html.js';

function line(...children: Parameters<typeof paragraph>): string {
  return renderTelegram(doc(paragraph(...children)));
}

describe('Telegram renderer', () => {
  describe('character styles', () => {
    test.each([
      ['bold', bold('Text'), '<b>Text</b>'],
      ['italic', italic('Text'), '<i>Text</i>'],
      ['underline', underline('Text'), '<u>Text</u>'],
      ['strikethrough', strike('Text'), '<s>Text</s>'],
      ['a spoiler', spoiler('Text'), '<tg-spoiler>Text</tg-spoiler>'],
    ])('should render %s as a tag', (_name, node, expected) => {
      expect(line(node)).toBe(expected);
    });

    test('should nest styles', () => {
      expect(line(bold('a ', italic('b')))).toBe('<b>a <i>b</i></b>');
    });

    test('should not repeat bold inside bold', () => {
      expect(line(bold('a ', bold('b')))).toBe('<b>a b</b>');
    });

    test('should move whitespace outside the tags', () => {
      expect(line('a', bold(' Text '), 'b')).toBe('a <b>Text</b> b');
    });

    test('should drop emphasis that has no text', () => {
      expect(line('x', bold(' '), 'y')).toBe('xy');
    });
  });

  describe('escaping', () => {
    test.each([
      '2 * 3',
      'half_life_2',
      '[YOUR NAME]',
      'a `tick',
    ])('should keep %s exactly as written', (value) => {
      expect(line(value)).toBe(value);
    });

    test('should escape the characters HTML reads as markup', () => {
      expect(line('<b>Fish & Chips</b>')).toBe('&lt;b&gt;Fish &amp; Chips&lt;/b&gt;');
    });

    test('should escape inside a style', () => {
      expect(line(bold('a < b'))).toBe('<b>a &lt; b</b>');
    });

    test('should produce HTML Telegram accepts for awkward text', () => {
      const rendered = line('2 * 3 and half_life and `code and [bracket <tag> & "quote"');

      expect(telegramHtmlProblem(rendered)).toBeUndefined();
    });
  });

  describe('links and media', () => {
    test('should render a link', () => {
      expect(line(link('https://example.com', 'Example'))).toBe(
        '<a href="https://example.com">Example</a>',
      );
    });

    test('should keep formatting inside a link label', () => {
      expect(line(link('https://example.com', bold('Example')))).toBe(
        '<a href="https://example.com"><b>Example</b></a>',
      );
    });

    test('should escape an ampersand in the URL', () => {
      expect(line(link('https://example.com/?a=1&b=2', 'x'))).toBe(
        '<a href="https://example.com/?a=1&amp;b=2">x</a>',
      );
    });

    test('should not nest a link inside a link', () => {
      const rendered = line(link('https://a.com', 'a ', link('https://b.com', 'b')));

      expect(rendered).toBe('<a href="https://a.com">a b</a>');
      expect(telegramHtmlProblem(rendered)).toBeUndefined();
    });

    test('should fall back to a label when a link has no text', () => {
      expect(line(link('https://example.com', ''))).toBe('<a href="https://example.com">Link</a>');
    });

    test('should refuse a URL with a scheme it does not trust', () => {
      expect(line(link('javascript:alert(1)', 'Click'))).toBe('Click');
    });

    test('should label an image', () => {
      expect(line(image('https://example.com/a.png'))).toBe(
        '<a href="https://example.com/a.png">Image</a>',
      );
    });

    test('should escape the alt text of an image', () => {
      expect(line(image('https://example.com/a.png', 'a & b'))).toBe(
        '<a href="https://example.com/a.png">a &amp; b</a>',
      );
    });

    test('should recognise a YouTube video', () => {
      expect(line(video('https://youtu.be/abc'))).toBe(
        '<a href="https://youtu.be/abc">YouTube Video</a>',
      );
    });

    test('should keep both halves of a clickable banner', () => {
      expect(line(link('https://x.com', image('https://x.com/a.png')))).toBe(
        '<a href="https://x.com/a.png">Image</a> (<a href="https://x.com">Link</a>)',
      );
    });
  });

  describe('blocks', () => {
    test.each([1, 3, 6])('should render an h%i as bold text', (level) => {
      expect(renderTelegram(doc(heading(level as 1 | 3 | 6, 'Title')))).toBe('<b>Title</b>');
    });

    test('should keep emphasis a heading does not already imply', () => {
      expect(renderTelegram(doc(heading(1, 'a ', italic('b'), bold(' c'))))).toBe(
        '<b>a <i>b</i> c</b>',
      );
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

    test('should render a quote', () => {
      expect(renderTelegram(doc(quote({}, 'a')))).toBe('<blockquote>a</blockquote>');
    });

    test('should name the author of a quote', () => {
      expect(renderTelegram(doc(quote({ author: 'Gabe & co' }, 'a')))).toBe(
        '<blockquote><b>Gabe &amp; co</b>:\na</blockquote>',
      );
    });

    test('should render a collapsed section as an expandable quote', () => {
      expect(renderTelegram(doc(quote({ expandable: true }, 'a')))).toBe(
        '<blockquote expandable>a</blockquote>',
      );
    });

    test('should not nest a quote inside a quote', () => {
      const rendered = renderTelegram(doc(quote({}, paragraph('a'), quote({}, 'b'))));

      expect(rendered).toBe('<blockquote>a\n\n&gt; b</blockquote>');
      expect(telegramHtmlProblem(rendered)).toBeUndefined();
    });

    test('should render inline code', () => {
      expect(line(inlineCode('npm test'))).toBe('<code>npm test</code>');
    });

    test('should escape inline code', () => {
      expect(line(inlineCode('a <b> `c`'))).toBe('<code>a &lt;b&gt; `c`</code>');
    });

    test('should render a code block', () => {
      expect(renderTelegram(doc(code('one\ntwo')))).toBe('<pre>one\ntwo</pre>');
    });

    test('should name the language of a code block', () => {
      expect(renderTelegram(doc(code('x = 1', 'python')))).toBe(
        '<pre><code class="language-python">x = 1</code></pre>',
      );
    });

    test('should keep a language name from breaking out of its attribute', () => {
      const rendered = renderTelegram(doc(code('x', 'c++" onclick="x')));

      expect(rendered).toBe('<pre><code class="language-c++onclickx">x</code></pre>');
      expect(telegramHtmlProblem(rendered)).toBeUndefined();
    });

    test('should flatten a table into lines', () => {
      const grid = table(row(headerCell('Name'), headerCell('Score')), row(cell('a'), cell('1')));

      expect(renderTelegram(doc(grid))).toBe('<b>Name</b> | <b>Score</b>\na | 1');
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

  describe('telegramTextLength', () => {
    test('should not count tags', () => {
      expect(telegramTextLength(line(link('https://example.com/long/path', bold('abc'))))).toBe(3);
    });

    test('should count an entity as one character', () => {
      expect(telegramTextLength(line('a & <b>'))).toBe('a & <b>'.length);
    });
  });
});
