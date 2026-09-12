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
} from 'src/markup/build.js';
import renderPlain from 'src/markup/renderers/plain.js';

function line(...children: Parameters<typeof paragraph>): string {
  return renderPlain(doc(paragraph(...children)));
}

describe('Plain text renderer', () => {
  describe('inline content', () => {
    test.each([
      ['bold', bold('Text')],
      ['italic', underline('Text')],
      ['strikethrough', strike('Text')],
      ['a spoiler', spoiler('Text')],
    ])('should strip %s', (_name, node) => {
      expect(line(node)).toBe('Text');
    });

    test('should emit no markup characters of its own', () => {
      expect(line('2 * 3 and half_life')).toBe('2 * 3 and half_life');
    });

    test('should keep the value of inline code', () => {
      expect(line(inlineCode('npm test'))).toBe('npm test');
    });

    test('should use the label of a link', () => {
      expect(line(link('https://example.com', 'Example'))).toBe('Example');
    });

    test('should fall back to the URL of a link with no label', () => {
      expect(line(link('https://example.com', ''))).toBe('https://example.com');
    });

    test('should use the alt text of an image', () => {
      expect(line(image('https://example.com/a.png', 'Cover'))).toBe('Cover');
    });

    test('should contribute nothing for an image with no alt text', () => {
      expect(line('a', image('https://example.com/a.png'), 'b')).toBe('ab');
    });

    test('should keep a break', () => {
      expect(line('a', br(), 'b')).toBe('a\nb');
    });
  });

  describe('blocks', () => {
    test('should render a heading as a bare line', () => {
      expect(renderPlain(doc(heading(1, 'Title')))).toBe('Title');
    });

    test('should render a bullet list', () => {
      expect(renderPlain(doc(list(listItem('a'), listItem('b'))))).toBe('- a\n- b');
    });

    test('should render a numbered list', () => {
      expect(renderPlain(doc(orderedList(listItem('a'), listItem('b'))))).toBe('1. a\n2. b');
    });

    test('should indent a nested list', () => {
      expect(renderPlain(doc(list(listItem(paragraph('a'), list(listItem('b'))))))).toBe(
        '- a\n  - b',
      );
    });

    test('should render a quote without markers', () => {
      expect(renderPlain(doc(quote({}, 'a')))).toBe('a');
    });

    test('should name the author of a quote', () => {
      expect(renderPlain(doc(quote({ author: 'Gabe' }, 'a')))).toBe('Gabe: a');
    });

    test('should keep the value of a code block', () => {
      expect(renderPlain(doc(code('one\ntwo', 'sh')))).toBe('one\ntwo');
    });

    test('should flatten a table into lines', () => {
      const grid = table(row(headerCell('Name'), headerCell('Score')), row(cell('a'), cell('1')));

      expect(renderPlain(doc(grid))).toBe('Name | Score\na | 1');
    });

    test('should render a separator', () => {
      expect(renderPlain(doc(paragraph('a'), separator(), paragraph('b')))).toBe('a\n\n---\n\nb');
    });

    test('should separate blocks by a blank line', () => {
      expect(renderPlain(doc(paragraph('a'), paragraph('b')))).toBe('a\n\nb');
    });

    test('should render an empty document as an empty string', () => {
      expect(renderPlain(doc())).toBe('');
    });
  });
});
