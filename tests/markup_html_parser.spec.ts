import type { BlockNode } from 'src/markup/ast.js';
import { textContent } from 'src/markup/ast.js';
import parseHtml from 'src/markup/parsers/html.js';
import renderDiscord from 'src/markup/renderers/discord.js';

function blocks(html: string): BlockNode[] {
  return parseHtml(html).children;
}

/** The text of each block, which is enough for most structural assertions. */
function texts(html: string): string[] {
  return blocks(html).map((block) => textContent(block));
}

function paragraph(value: string): BlockNode {
  return { type: 'paragraph', children: [{ type: 'text', value }] };
}

describe('HTML parser', () => {
  describe('paragraphs and text', () => {
    test('should parse consecutive paragraphs', () => {
      expect(blocks('<p>a</p><p>b</p>')).toEqual([paragraph('a'), paragraph('b')]);
    });

    test('should wrap bare text in a paragraph', () => {
      expect(blocks('hello')).toEqual([paragraph('hello')]);
    });

    test('should drop empty paragraphs', () => {
      expect(blocks('<p>a</p><p></p><p>  </p><p>b</p>')).toEqual([paragraph('a'), paragraph('b')]);
    });

    test('should collapse a run of whitespace into one space', () => {
      expect(blocks('<p>a   \n\t b</p>')).toEqual([paragraph('a b')]);
    });

    test('should decode entities', () => {
      expect(texts('<p>Tom &amp; Jerry &lt;3 &quot;hi&quot;</p>')).toEqual(['Tom & Jerry <3 "hi"']);
    });

    test('should turn a br into a break', () => {
      expect(blocks('<p>a<br>b</p>')).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'a' }, { type: 'break' }, { type: 'text', value: 'b' }],
        },
      ]);
    });

    test('should treat a div as a block boundary', () => {
      expect(blocks('<div>a</div><div>b</div>')).toEqual([paragraph('a'), paragraph('b')]);
    });
  });

  describe('character styles', () => {
    test.each([
      ['<b>x</b>', 'bold'],
      ['<strong>x</strong>', 'bold'],
      ['<i>x</i>', 'italic'],
      ['<em>x</em>', 'italic'],
      ['<u>x</u>', 'underline'],
      ['<ins>x</ins>', 'underline'],
      ['<s>x</s>', 'strike'],
      ['<del>x</del>', 'strike'],
      ['<strike>x</strike>', 'strike'],
    ])('should parse %s as %s', (html, type) => {
      expect(blocks(html)).toEqual([
        { type: 'paragraph', children: [{ type, children: [{ type: 'text', value: 'x' }] }] },
      ]);
    });

    test('should nest styles', () => {
      expect(renderDiscord(parseHtml('<b>a <i>b</i></b>'))).toBe('**a *b***');
    });

    test('should recognise a spoiler by its class', () => {
      expect(renderDiscord(parseHtml('<span class="tg-spoiler">x</span>'))).toBe('||x||');
    });

    test('should drop a style that has no text', () => {
      expect(blocks('<p>a<b></b></p>')).toEqual([paragraph('a')]);
    });
  });

  describe('headings', () => {
    test.each([1, 2, 3, 4, 5, 6])('should parse an h%i', (level) => {
      expect(blocks(`<h${level}>Title</h${level}>`)).toEqual([
        { type: 'heading', level, children: [{ type: 'text', value: 'Title' }] },
      ]);
    });

    test('should recognise a Steam heading written as a div', () => {
      // Steam's Community feeds mark headings up with a class, not an element.
      expect(blocks('<div class="bb_h2">Title</div>')).toEqual([
        { type: 'heading', level: 2, children: [{ type: 'text', value: 'Title' }] },
      ]);
    });

    test('should drop an empty heading', () => {
      expect(blocks('<h1>  </h1>')).toEqual([]);
    });
  });

  describe('lists', () => {
    test('should parse a bullet list', () => {
      expect(renderDiscord(parseHtml('<ul><li>a</li><li>b</li></ul>'))).toBe('- a\n- b');
    });

    test('should parse a numbered list', () => {
      expect(renderDiscord(parseHtml('<ol><li>a</li><li>b</li></ol>'))).toBe('1. a\n2. b');
    });

    test('should parse a nested list', () => {
      const html = '<ul><li>a<ul><li>b</li></ul></li></ul>';

      expect(renderDiscord(parseHtml(html))).toBe('- a\n  - b');
    });

    test('should give a stray list item a bullet of its own', () => {
      expect(renderDiscord(parseHtml('<li>a</li>'))).toBe('- a');
    });

    test('should tolerate unclosed list items', () => {
      expect(renderDiscord(parseHtml('<ul><li>a<li>b</ul>'))).toBe('- a\n- b');
    });
  });

  describe('links and media', () => {
    test('should parse a link', () => {
      expect(blocks('<a href="https://example.com">Example</a>')).toEqual([
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://example.com',
              children: [{ type: 'text', value: 'Example' }],
            },
          ],
        },
      ]);
    });

    test('should keep the text of a link that has no target', () => {
      expect(blocks('<a>Example</a>')).toEqual([paragraph('Example')]);
    });

    test('should parse an image with its alt text', () => {
      expect(blocks('<img src="https://example.com/a.png" alt="Cover">')).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'image', url: 'https://example.com/a.png', alt: 'Cover' }],
        },
      ]);
    });

    test('should drop an image with no source', () => {
      expect(blocks('<p>a<img alt="x"></p>')).toEqual([paragraph('a')]);
    });

    test('should parse a YouTube embed as a video', () => {
      expect(blocks('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'video', url: 'https://www.youtube.com/embed/abc', children: [] }],
        },
      ]);
    });

    test('should drop an embed that is not a video', () => {
      expect(blocks('<iframe src="https://ads.example.com/x"></iframe>')).toEqual([]);
    });

    test('should drop the link host Steam appends to a link', () => {
      const html =
        '<a href="https://github.com">Repo</a><span class="bb_link_host">[github.com]</span>';

      expect(textContent(parseHtml(html))).toBe('Repo');
    });
  });

  describe('other blocks', () => {
    test('should parse a quote', () => {
      expect(renderDiscord(parseHtml('<blockquote>a</blockquote>'))).toBe('> a');
    });

    test('should parse preformatted text verbatim', () => {
      expect(blocks('<pre>  one\n  two</pre>')).toEqual([{ type: 'code', value: '  one\n  two' }]);
    });

    test('should treat code inside pre as the block itself', () => {
      expect(blocks('<pre><code>a = 1</code></pre>')).toEqual([{ type: 'code', value: 'a = 1' }]);
    });

    test('should parse standalone code as inline code', () => {
      expect(blocks('<p>run <code>npm test</code></p>')).toEqual([
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'run ' },
            { type: 'inlineCode', value: 'npm test' },
          ],
        },
      ]);
    });

    test('should parse an hr as a separator', () => {
      expect(blocks('<p>a</p><hr><p>b</p>')).toEqual([
        paragraph('a'),
        { type: 'separator' },
        paragraph('b'),
      ]);
    });

    test('should parse a table', () => {
      const html =
        '<table><tr><th>Name</th><th>Score</th></tr><tr><td>a</td><td>1</td></tr></table>';

      expect(renderDiscord(parseHtml(html))).toBe('**Name** | **Score**\na | 1');
    });

    test('should see through a tbody', () => {
      const html = '<table><tbody><tr><td>a</td></tr></tbody></table>';

      expect(renderDiscord(parseHtml(html))).toBe('a');
    });
  });

  describe('resilience', () => {
    test('should drop a script and everything in it', () => {
      expect(blocks('<p>a</p><script>var x = "<p>b</p>";</script>')).toEqual([paragraph('a')]);
    });

    test('should drop a style block', () => {
      expect(blocks('<style>p { color: red }</style><p>a</p>')).toEqual([paragraph('a')]);
    });

    test('should pass an unknown element through', () => {
      expect(blocks('<custom-thing>a</custom-thing>')).toEqual([paragraph('a')]);
    });

    test('should close what the document left open', () => {
      expect(renderDiscord(parseHtml('<p>a<b>bold'))).toBe('a**bold**');
    });

    test('should discard a closing tag that was never opened', () => {
      expect(blocks('</div><p>a</p>')).toEqual([paragraph('a')]);
    });

    test('should produce an empty document for empty input', () => {
      expect(parseHtml('')).toEqual({ type: 'root', children: [] });
    });

    test('should never lose text to markup it does not know', () => {
      expect(textContent(parseHtml('<weird><b>a</b> <q>b</q></weird>'))).toBe('a b');
    });
  });

  describe('line breaks as structure', () => {
    test('should ignore line breaks by default', () => {
      expect(blocks('<p>a\n\nb</p>')).toEqual([paragraph('a b')]);
    });

    test('should split paragraphs on blank lines when asked', () => {
      const result = parseHtml('a\n\nb', { preserveLineBreaks: true });

      expect(result.children).toEqual([paragraph('a'), paragraph('b')]);
    });

    test('should keep a single line break as a break when asked', () => {
      const result = parseHtml('a\nb', { preserveLineBreaks: true });

      expect(result.children).toEqual([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'a' }, { type: 'break' }, { type: 'text', value: 'b' }],
        },
      ]);
    });
  });
});
