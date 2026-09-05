import type { CloseToken, OpenToken, Token } from 'src/steam/bbcode/tokenizer.js';
import tokenize from 'src/steam/bbcode/tokenizer.js';

/** Renders a token stream in a form that is easy to assert on. */
function summarize(tokens: Token[]): string[] {
  return tokens.map((token) => {
    switch (token.kind) {
      case 'text':
        return `text:${token.value}`;
      case 'close':
        return `close:${token.name}`;
      default: {
        const attrs = [...token.attrs].map(([key, value]) => `${key}=${value}`).join(',');
        return `open:${token.name}${token.value === undefined ? '' : `=${token.value}`}${
          attrs ? `{${attrs}}` : ''
        }`;
      }
    }
  });
}

function openTag(input: string): OpenToken {
  const [token] = tokenize(input);
  if (token?.kind !== 'open') {
    throw new Error(`Expected an opening tag, got ${JSON.stringify(token)}`);
  }
  return token;
}

describe('Steam BBCode tokenizer', () => {
  test('should return nothing for an empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  test('should return plain text unchanged', () => {
    expect(tokenize('Hello world')).toEqual([{ kind: 'text', value: 'Hello world' }]);
  });

  test('should split a tag from its surrounding text', () => {
    expect(summarize(tokenize('a[b]c[/b]d'))).toEqual([
      'text:a',
      'open:b',
      'text:c',
      'close:b',
      'text:d',
    ]);
  });

  test('should lower case tag names', () => {
    expect(summarize(tokenize('[B]x[/B]'))).toEqual(['open:b', 'text:x', 'close:b']);
  });

  test('should normalize carriage returns', () => {
    expect(tokenize('a\r\nb\rc')).toEqual([{ kind: 'text', value: 'a\nb\nc' }]);
  });

  describe('tag values', () => {
    test('should read an unquoted value', () => {
      expect(openTag('[url=https://github.com]').value).toBe('https://github.com');
    });

    test('should strip the quotes of a quoted value', () => {
      expect(openTag('[url="https://github.com"]').value).toBe('https://github.com');
    });

    test('should read a value followed by attributes', () => {
      const token = openTag('[url="https://github.com" style="pill" buttoncolor="#ffe800"]');

      expect(token.value).toBe('https://github.com');
      expect(Object.fromEntries(token.attrs)).toEqual({ style: 'pill', buttoncolor: '#ffe800' });
    });

    test('should treat the quoted and unquoted preview forms alike', () => {
      expect(openTag('[previewyoutube=PVNSct9atp8;full]').value).toBe('PVNSct9atp8;full');
      expect(openTag('[previewyoutube="PVNSct9atp8;full"]').value).toBe('PVNSct9atp8;full');
    });
  });

  describe('tag attributes', () => {
    test('should read a single attribute', () => {
      expect(Object.fromEntries(openTag('[img src="https://x.com/a.png"]').attrs)).toEqual({
        src: 'https://x.com/a.png',
      });
    });

    test('should read a quoted value containing punctuation and spaces', () => {
      const style = 'box-sizing: inherit; box-shadow: rgba(0, 0, 0, 0.3) 0px 5px 15px;';
      const token = openTag(`[img src="https://x.com/a.png" style="${style}"]`);

      expect(token.attrs.get('style')).toBe(style);
      expect(token.attrs.get('src')).toBe('https://x.com/a.png');
    });

    test('should read several attributes', () => {
      expect(Object.fromEntries(openTag('[table equalcells="1" colwidth=",,,"]').attrs)).toEqual({
        equalcells: '1',
        colwidth: ',,,',
      });
    });

    test('should read an unquoted attribute value', () => {
      expect(Object.fromEntries(openTag('[expand type=details]').attrs)).toEqual({
        type: 'details',
      });
      expect(Object.fromEntries(openTag('[td rowspan="8"]').attrs)).toEqual({ rowspan: '8' });
    });
  });

  describe('list items', () => {
    test('should read an opening and a closing list item', () => {
      expect(summarize(tokenize('[*]a[/*]'))).toEqual(['open:*', 'text:a', 'close:*']);
    });
  });

  describe('text that only looks like markup', () => {
    test.each([
      '[YOUR NAME]',
      '[space-age]',
      '[count=100]',
      '[MEDIA=youtube]',
      '[USER=325151]',
      '[Animated Short]',
      '[input, output, storage]',
      '[]',
      '[/]',
    ])('should keep %s as literal text', (input) => {
      expect(tokenize(input)).toEqual([{ kind: 'text', value: input }]);
    });

    test('should keep an unterminated tag as literal text', () => {
      expect(tokenize('a [b c')).toEqual([{ kind: 'text', value: 'a [b c' }]);
    });

    test('should not let a tag span lines', () => {
      expect(tokenize('[img src="a\nb"]')).toEqual([{ kind: 'text', value: '[img src="a\nb"]' }]);
    });

    test('should keep a known name that is not followed by a valid tag ending', () => {
      expect(tokenize('[b-side]')).toEqual([{ kind: 'text', value: '[b-side]' }]);
    });
  });

  describe('verbatim tags', () => {
    test('should not scan for tags inside code', () => {
      expect(summarize(tokenize('[code][b]x[/b][/code]'))).toEqual([
        'open:code',
        'text:[b]x[/b]',
        'close:code',
      ]);
    });

    test('should not scan for tags inside noparse', () => {
      expect(summarize(tokenize('[noparse][i]x[/i][/noparse]'))).toEqual([
        'open:noparse',
        'text:[i]x[/i]',
        'close:noparse',
      ]);
    });

    test('should take the rest of the input when the closer is missing', () => {
      expect(summarize(tokenize('[code][b]x'))).toEqual(['open:code', 'text:[b]x']);
    });
  });

  describe('resilience', () => {
    test('should keep the raw source of a closing tag', () => {
      const [token] = tokenize('[/b]');
      expect((token as CloseToken).raw).toBe('[/b]');
    });

    test('should scan a long run of brackets quickly', () => {
      const start = Date.now();
      tokenize('['.repeat(50_000));
      expect(Date.now() - start).toBeLessThan(1000);
    });

    test('should scan a long run of list tags quickly', () => {
      const start = Date.now();
      tokenize('[list]'.repeat(20_000));
      expect(Date.now() - start).toBeLessThan(1000);
    });
  });
});
