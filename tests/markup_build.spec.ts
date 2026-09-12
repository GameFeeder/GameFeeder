import {
  bold,
  br,
  code,
  doc,
  headerCell,
  image,
  inline,
  link,
  list,
  listItem,
  orderedList,
  paragraph,
  quote,
  text,
} from 'src/markup/build.js';

describe('Markup builders', () => {
  describe('inline input', () => {
    test('should wrap a bare string as text', () => {
      expect(inline('Text')).toEqual([{ type: 'text', value: 'Text' }]);
    });

    test('should pass a node through untouched', () => {
      expect(inline(bold('Text'))).toEqual([
        { type: 'bold', children: [{ type: 'text', value: 'Text' }] },
      ]);
    });

    test('should turn the line breaks of a string into break nodes', () => {
      expect(inline('one\ntwo')).toEqual([
        { type: 'text', value: 'one' },
        { type: 'break' },
        { type: 'text', value: 'two' },
      ]);
    });

    test('should never produce a text node holding a line break', () => {
      const nodes = inline('\n\na\n');

      for (const node of nodes) {
        expect(node.type === 'text' ? node.value : '').not.toContain('\n');
      }
    });

    test('should keep a line break that carries no text of its own', () => {
      expect(inline('a\n\nb')).toEqual([
        { type: 'text', value: 'a' },
        { type: 'break' },
        { type: 'break' },
        { type: 'text', value: 'b' },
      ]);
    });

    test('should flatten several arguments into one run', () => {
      expect(paragraph('a ', bold('b'), ' c').children).toHaveLength(3);
    });
  });

  describe('links and media', () => {
    test('should show the URL when a link has no label', () => {
      expect(link('https://example.com')).toEqual({
        type: 'link',
        url: 'https://example.com',
        children: [{ type: 'text', value: 'https://example.com' }],
      });
    });

    test('should use the given label', () => {
      expect(link('https://example.com', 'Example').children).toEqual([
        { type: 'text', value: 'Example' },
      ]);
    });

    test('should omit the alt text of an image when there is none', () => {
      expect(image('https://example.com/a.png')).toEqual({
        type: 'image',
        url: 'https://example.com/a.png',
      });
    });
  });

  describe('blocks', () => {
    test('should wrap a bare string in a paragraph', () => {
      expect(doc('Text')).toEqual({
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Text' }] }],
      });
    });

    test('should mark an ordered list as ordered', () => {
      expect(orderedList(listItem('a')).ordered).toBe(true);
      expect(list(listItem('a')).ordered).toBe(false);
    });

    test('should omit the optional fields of a quote when unset', () => {
      expect(quote({}, 'Text')).toEqual({
        type: 'quote',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Text' }] }],
      });
    });

    test('should record the author and the expandable flag of a quote', () => {
      const node = quote({ author: 'Gabe', expandable: true }, 'Text');

      expect(node.author).toBe('Gabe');
      expect(node.expandable).toBe(true);
    });

    test('should omit the language of a code block when unset', () => {
      expect(code('npm test')).toEqual({ type: 'code', value: 'npm test' });
      expect(code('npm test', 'sh')).toEqual({
        type: 'code',
        language: 'sh',
        value: 'npm test',
      });
    });

    test('should mark a header cell as a header', () => {
      expect(headerCell('a').header).toBe(true);
    });

    test('should accept an explicit break', () => {
      expect(paragraph('a', br(), 'b').children).toEqual([
        { type: 'text', value: 'a' },
        { type: 'break' },
        { type: 'text', value: 'b' },
      ]);
    });
  });
});
