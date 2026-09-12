import type { MarkupNode } from 'src/markup/ast.js';
import { isBlockNode, isInlineNode, textContent } from 'src/markup/ast.js';
import {
  bold,
  br,
  cell,
  code,
  doc,
  heading,
  image,
  inlineCode,
  link,
  list,
  listItem,
  paragraph,
  quote,
  row,
  separator,
  table,
  text,
} from 'src/markup/build.js';

describe('Markup AST', () => {
  describe('node classification', () => {
    const inlineNodes: MarkupNode[] = [
      text('a'),
      br(),
      bold('a'),
      inlineCode('a'),
      link('https://example.com', 'a'),
      image('https://example.com/a.png'),
    ];

    test.each(inlineNodes)('should classify $type as inline', (node) => {
      expect(isInlineNode(node)).toBe(true);
      expect(isBlockNode(node)).toBe(false);
    });

    const blockNodes: MarkupNode[] = [
      paragraph('a'),
      heading(1, 'a'),
      list(listItem('a')),
      quote({}, 'a'),
      code('a'),
      table(row(cell('a'))),
      separator(),
    ];

    test.each(blockNodes)('should classify $type as block', (node) => {
      expect(isBlockNode(node)).toBe(true);
      expect(isInlineNode(node)).toBe(false);
    });

    test('should classify the structural nodes as neither', () => {
      expect(isInlineNode(listItem('a'))).toBe(false);
      expect(isBlockNode(listItem('a'))).toBe(false);
      expect(isInlineNode(doc('a'))).toBe(false);
      expect(isBlockNode(doc('a'))).toBe(false);
    });
  });

  describe('textContent', () => {
    test('should return the value of a text node', () => {
      expect(textContent(text('Text'))).toBe('Text');
    });

    test('should return a line break for a break node', () => {
      expect(textContent(br())).toBe('\n');
    });

    test('should return the value of inline and block code', () => {
      expect(textContent(inlineCode('npm test'))).toBe('npm test');
      expect(textContent(code('npm test', 'sh'))).toBe('npm test');
    });

    test('should return the alt text of an image, or nothing', () => {
      expect(textContent(image('https://example.com/a.png', 'Cover'))).toBe('Cover');
      expect(textContent(image('https://example.com/a.png'))).toBe('');
    });

    test('should return nothing for a separator', () => {
      expect(textContent(separator())).toBe('');
    });

    test('should run the children of an inline container together', () => {
      expect(textContent(paragraph('one ', bold('two'), ' three'))).toBe('one two three');
    });

    test('should separate blocks by a blank line', () => {
      expect(textContent(doc(paragraph('one'), paragraph('two')))).toBe('one\n\ntwo');
    });

    test('should read a table row as a line and its cells as a run', () => {
      const grid = table(row(cell('a'), cell('b')), row(cell('c'), cell('d')));

      expect(textContent(grid)).toBe('a b\nc d');
    });

    test('should read the items of a list as lines', () => {
      expect(textContent(list(listItem('one'), listItem('two')))).toBe('one\ntwo');
    });
  });
});
