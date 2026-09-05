import type { BlockNode, ListNode } from 'src/steam/bbcode/ast.js';
import { textContent } from 'src/steam/bbcode/ast.js';
import parse from 'src/steam/bbcode/parser.js';

function blocks(input: string): BlockNode[] {
  return parse(input).children;
}

/** The text of each block, which is enough for most structural assertions. */
function texts(input: string): string[] {
  return blocks(input).map((block) => textContent(block));
}

function paragraph(value: string): BlockNode {
  return { type: 'paragraph', children: [{ type: 'text', value }] };
}

describe('Steam BBCode parser', () => {
  describe('paragraphs', () => {
    test('should parse consecutive paragraph tags', () => {
      expect(blocks('[p]a[/p][p]b[/p]')).toEqual([paragraph('a'), paragraph('b')]);
    });

    test('should drop the empty paragraphs Steam uses as spacers', () => {
      expect(blocks('[p]a[/p][p][/p][p] [/p][p]b[/p]')).toEqual([paragraph('a'), paragraph('b')]);
    });

    test('should split on blank lines when there are no paragraph tags', () => {
      expect(blocks('First\n\nSecond')).toEqual([paragraph('First'), paragraph('Second')]);
    });

    test('should keep a single line break as a soft break', () => {
      expect(blocks('First\nSecond')).toEqual([paragraph('First\nSecond')]);
    });

    test('should keep line breaks inside a paragraph tag', () => {
      expect(blocks('[p]First\nSecond[/p]')).toEqual([paragraph('First\nSecond')]);
    });
  });

  describe('headings', () => {
    test.each([1, 2, 3, 4, 5, 6])('should parse an h%i tag', (level) => {
      expect(blocks(`[h${level}]Text[/h${level}]`)).toEqual([
        { type: 'heading', level, children: [{ type: 'text', value: 'Text' }] },
      ]);
    });

    test('should not treat h7 as a heading', () => {
      expect(texts('[h7]Text[/h7]')).toEqual(['[h7]Text[/h7]']);
    });

    test('should drop an empty heading', () => {
      expect(blocks('[h1] [/h1]')).toEqual([]);
    });
  });

  describe('lists', () => {
    test('should close a list item implicitly at the next item', () => {
      expect(blocks('[list][*]a[*]b[/list]')).toEqual([
        {
          type: 'list',
          ordered: false,
          children: [
            { type: 'listItem', children: [paragraph('a')] },
            { type: 'listItem', children: [paragraph('b')] },
          ],
        },
      ]);
    });

    test('should accept explicitly closed list items holding blocks', () => {
      expect(blocks('[list][*][p]a[/p][/*][/list]')).toEqual([
        {
          type: 'list',
          ordered: false,
          children: [{ type: 'listItem', children: [paragraph('a')] }],
        },
      ]);
    });

    test('should parse a nested list', () => {
      const [list] = blocks('[list][*]a[list][*]b[/list][/*][/list]') as ListNode[];
      const [item] = list.children;

      expect(item.children).toEqual([
        paragraph('a'),
        {
          type: 'list',
          ordered: false,
          children: [{ type: 'listItem', children: [paragraph('b')] }],
        },
      ]);
    });

    test('should mark an olist as ordered', () => {
      const [list] = blocks('[olist][*]a[/olist]') as ListNode[];
      expect(list.ordered).toBe(true);
    });

    test('should wrap list items that have no enclosing list', () => {
      expect(blocks('[*]a[*]b')).toEqual([
        {
          type: 'list',
          ordered: false,
          children: [
            { type: 'listItem', children: [paragraph('a')] },
            { type: 'listItem', children: [paragraph('b')] },
          ],
        },
      ]);
    });

    test('should merge the single item lists Steam emits in sequence', () => {
      const [list, ...rest] = blocks('[list][*]a[/*][/list][list][*]b[/*][/list]') as ListNode[];

      expect(rest).toEqual([]);
      expect(list.children.map((item) => textContent(item))).toEqual(['a', 'b']);
    });

    test('should keep a block that follows a list out of the list', () => {
      expect(texts('[list][*]a[/list][p]b[/p]')).toEqual(['a', 'b']);
    });

    test('should parse an item that holds several blocks', () => {
      const [list] = blocks('[list][*]Aurora[expand type=details]Nightfall[/expand][/list]') as [
        ListNode,
      ];

      expect(list.children[0].children).toEqual([
        paragraph('Aurora'),
        { type: 'expand', children: [paragraph('Nightfall')] },
      ]);
    });
  });

  describe('error recovery', () => {
    test('should close an unclosed tag at the end of the input', () => {
      expect(blocks('[b]hello')).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'bold', children: [{ type: 'text', value: 'hello' }] }],
        },
      ]);
    });

    test('should discard a closing tag that was never opened', () => {
      expect(texts('[b]a[/i]b[/b]')).toEqual(['ab']);
    });

    test('should discard a stray closing tag on its own', () => {
      expect(texts('a[/p]b')).toEqual(['ab']);
    });

    test('should close an inner tag when its parent closes', () => {
      // The bold tag is never closed, but it must not swallow the next paragraph.
      expect(blocks('[p][b]a[/p][p]b[/p]')).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'bold', children: [{ type: 'text', value: 'a' }] }],
        },
        paragraph('b'),
      ]);
    });

    test('should close a paragraph implicitly at the next block', () => {
      expect(texts('[p]a[h2]b[/h2]')).toEqual(['a', 'b']);
    });

    test('should keep text that only looks like a tag', () => {
      expect(texts('[p]Enter [YOUR NAME] here[/p]')).toEqual(['Enter [YOUR NAME] here']);
    });
  });

  describe('links and media', () => {
    test('should read the URL from the tag value', () => {
      expect(blocks('[p][url=https://x.com]Text[/url][/p]')).toEqual([
        {
          type: 'paragraph',
          children: [
            { type: 'link', url: 'https://x.com', children: [{ type: 'text', value: 'Text' }] },
          ],
        },
      ]);
    });

    test('should treat both image forms alike', () => {
      const bare = blocks('[img]https://x.com/a.png[/img]');
      const attribute = blocks('[img src="https://x.com/a.png"][/img]');

      expect(bare).toEqual(attribute);
      expect(bare).toEqual([
        { type: 'paragraph', children: [{ type: 'image', url: 'https://x.com/a.png' }] },
      ]);
    });

    test('should parse an image inside a link', () => {
      expect(blocks('[url=https://x.com][img]https://x.com/a.png[/img][/url]')).toEqual([
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://x.com',
              children: [{ type: 'image', url: 'https://x.com/a.png' }],
            },
          ],
        },
      ]);
    });

    test('should drop the alignment hint of a YouTube preview', () => {
      expect(blocks('[previewyoutube=PVNSct9atp8;full][/previewyoutube]')).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'video', url: 'https://youtu.be/PVNSct9atp8', children: [] }],
        },
      ]);
    });

    test('should read the target of a dynamic link', () => {
      expect(blocks('[dynamiclink href="https://x.com"][/dynamiclink]')).toEqual([
        { type: 'paragraph', children: [{ type: 'link', url: 'https://x.com', children: [] }] },
      ]);
    });
  });

  describe('tables', () => {
    test('should close a cell implicitly at the next cell', () => {
      expect(blocks('[table][tr][th]A[/th][tr][td]a[td]b[/tr][/table]')).toEqual([
        {
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [{ type: 'tableCell', header: true, children: [paragraph('A')] }],
            },
            {
              type: 'tableRow',
              children: [
                { type: 'tableCell', header: false, children: [paragraph('a')] },
                { type: 'tableCell', header: false, children: [paragraph('b')] },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe('verbatim and standalone tags', () => {
    test('should keep the body of a code tag verbatim', () => {
      expect(blocks('[code][b]x[/b][/code]')).toEqual([{ type: 'code', value: '[b]x[/b]' }]);
    });

    test('should only strip the markup of a noparse tag', () => {
      expect(blocks('[noparse][i]x[/i][/noparse]')).toEqual([paragraph('[i]x[/i]')]);
    });

    test.each(['[hr]', '[hr][/hr]'])('should parse %s as a single separator', (input) => {
      expect(blocks(`a${input}b`)).toEqual([paragraph('a'), { type: 'separator' }, paragraph('b')]);
    });

    test('should parse a quote', () => {
      expect(blocks('[quote]a[/quote]')).toEqual([
        { type: 'quote', author: undefined, children: [paragraph('a')] },
      ]);
    });

    test('should read the author of a quote', () => {
      const [quote] = blocks('[quote=Tim;123]a[/quote]');
      expect(quote).toEqual({ type: 'quote', author: 'Tim', children: [paragraph('a')] });
    });
  });

  describe('limits', () => {
    test('should stop descending once the nesting limit is reached', () => {
      const input = `${'[list][*]'.repeat(200)}deep`;
      const root = parse(input);

      expect(textContent(root)).toContain('deep');
    });

    test('should parse a large post quickly', () => {
      const input = '[p]Hello [b]world[/b], see [url="https://x.com"]this[/url].[/p]'.repeat(4000);
      const start = Date.now();
      parse(input);

      expect(Date.now() - start).toBeLessThan(2000);
    });
  });
});
