import type { InlineNode } from 'src/markup/ast.js';
import {
  bold,
  br,
  cell,
  code,
  doc,
  heading,
  list,
  listItem,
  paragraph,
  quote,
  row,
  separator,
  table,
  text,
} from 'src/markup/build.js';
import normalize, { isEmptyBlock, normalizeBlocks, trimInline } from 'src/markup/normalize.js';

describe('Markup normalization', () => {
  describe('isEmptyBlock', () => {
    test('should treat a paragraph of whitespace as empty', () => {
      expect(isEmptyBlock(paragraph('   '))).toBe(true);
      expect(isEmptyBlock(paragraph(''))).toBe(true);
    });

    test('should treat a paragraph of only breaks as empty', () => {
      expect(isEmptyBlock(paragraph(br(), br()))).toBe(true);
    });

    test('should treat a paragraph with any text as filled', () => {
      expect(isEmptyBlock(paragraph('a'))).toBe(false);
    });

    test('should treat a paragraph holding only an image as filled', () => {
      expect(isEmptyBlock({ type: 'paragraph', children: [{ type: 'image', url: 'a' }] })).toBe(
        false,
      );
    });

    test('should treat a code block of whitespace as empty', () => {
      expect(isEmptyBlock(code('  \n '))).toBe(true);
    });

    test('should never treat a separator as empty', () => {
      expect(isEmptyBlock(separator())).toBe(false);
    });

    test('should treat a childless container as empty', () => {
      expect(isEmptyBlock(list())).toBe(true);
      expect(isEmptyBlock(table())).toBe(true);
      expect(isEmptyBlock(quote({}))).toBe(true);
    });
  });

  describe('normalizeBlocks', () => {
    test('should drop empty blocks', () => {
      expect(normalizeBlocks([paragraph('a'), paragraph(' '), paragraph('b')])).toEqual([
        paragraph('a'),
        paragraph('b'),
      ]);
    });

    test('should merge lists that a source split into single-item chunks', () => {
      const merged = normalizeBlocks([list(listItem('a')), list(listItem('b'))]);

      expect(merged).toHaveLength(1);
      expect((merged[0] as ReturnType<typeof list>).children).toHaveLength(2);
    });

    test('should not merge lists of different kinds', () => {
      expect(
        normalizeBlocks([list(listItem('a')), { ...list(listItem('b')), ordered: true }]),
      ).toHaveLength(2);
    });
  });

  describe('trimInline', () => {
    test('should trim the whitespace around a run', () => {
      expect(trimInline([text('  a  ')])).toEqual([text('a')]);
    });

    test('should drop leading and trailing breaks', () => {
      expect(trimInline([br(), text('a'), br(), br()])).toEqual([text('a')]);
    });

    test('should keep a break inside the run', () => {
      expect(trimInline([text('a'), br(), text('b')])).toEqual([text('a'), br(), text('b')]);
    });

    test('should stop trimming at a node that is not text', () => {
      const nodes: InlineNode[] = [bold('a'), text('  ')];

      expect(trimInline(nodes)).toEqual([bold('a')]);
    });

    test('should return an empty run when there is nothing but whitespace', () => {
      expect(trimInline([text(' '), br(), text('  ')])).toEqual([]);
    });
  });

  describe('normalize', () => {
    test('should cap a run of breaks at a paragraph boundary', () => {
      const result = normalize(doc(paragraph('a', br(), br(), br(), br(), 'b')));

      expect(result.children[0]).toEqual(paragraph('a', br(), br(), 'b'));
    });

    test('should trim the inline run of a heading', () => {
      expect(normalize(doc(heading(1, '  Title  '))).children[0]).toEqual(heading(1, 'Title'));
    });

    test('should leave the whitespace inside a style node alone', () => {
      // The space in `a <b> text </b>b` belongs to the sentence, and a renderer
      // moves it outside the markers. Trimming it here would join the words.
      const result = normalize(doc(paragraph('a', bold(' text '), 'b')));

      expect(result.children[0]).toEqual(paragraph('a', bold(' text '), 'b'));
    });

    test('should still trim the outermost run of a block', () => {
      expect(normalize(doc(paragraph('  a  '))).children[0]).toEqual(paragraph('a'));
    });

    test('should drop empty blocks nested in a list item', () => {
      const result = normalize(doc(list(listItem(paragraph('a'), paragraph(' ')))));

      expect(result).toEqual(doc(list(listItem(paragraph('a')))));
    });

    test('should drop a list item that holds nothing, and the list with it', () => {
      expect(normalize(doc(list(listItem(paragraph(' ')))))).toEqual(doc());
    });

    test('should keep the filled items of a partly empty list', () => {
      const result = normalize(doc(list(listItem(paragraph(' ')), listItem('a'))));

      expect(result).toEqual(doc(list(listItem('a'))));
    });

    test('should drop empty blocks nested in a table cell', () => {
      const result = normalize(doc(table(row(cell(paragraph('a'), paragraph('  '))))));

      expect(result).toEqual(doc(table(row(cell(paragraph('a'))))));
    });

    test('should drop empty blocks nested in a quote', () => {
      const result = normalize(doc(quote({ author: 'Gabe' }, paragraph('a'), paragraph(' '))));

      expect(result).toEqual(doc(quote({ author: 'Gabe' }, paragraph('a'))));
    });

    test('should leave a document that is already clean untouched', () => {
      const clean = doc(paragraph('a'), separator(), paragraph('b'));

      expect(normalize(clean)).toEqual(clean);
    });
  });
});
