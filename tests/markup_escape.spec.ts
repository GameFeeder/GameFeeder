import {
  escapeDiscord,
  escapeDiscordLineStart,
  sanitizeTelegramMarkdown,
  sanitizeUrl,
} from 'src/markup/escape.js';

describe('Markup escaping', () => {
  describe('escapeDiscord', () => {
    test.each(['*', '_', '~', '`', '|', '[', ']', '\\'])('should escape %s', (char) => {
      expect(escapeDiscord(char)).toBe(`\\${char}`);
    });

    test.each([
      '(',
      ')',
    ])('should leave %s alone, as it only means anything after a bracket', (char) => {
      expect(escapeDiscord(`a${char}b`)).toBe(`a${char}b`);
    });

    test.each([
      '#',
      '>',
      '-',
      '+',
    ])('should leave %s alone, as it is only markup at a line start', (char) => {
      expect(escapeDiscord(`a${char}b`)).toBe(`a${char}b`);
    });

    test('should leave an ordinary hyphenated word alone', () => {
      expect(escapeDiscord('Half-Life 2')).toBe('Half-Life 2');
    });

    test('should leave ordinary text alone', () => {
      expect(escapeDiscord('Patch 7.39 is live!')).toBe('Patch 7.39 is live!');
    });

    test('should stop text from turning into emphasis', () => {
      expect(escapeDiscord('2 * 3 * 4')).toBe('2 \\* 3 \\* 4');
    });

    test('should stop a name from turning into italics', () => {
      expect(escapeDiscord('half_life_2')).toBe('half\\_life\\_2');
    });

    test('should stop text from turning into a link', () => {
      // Escaping the brackets is enough: without them the parentheses are prose.
      expect(escapeDiscord('[YOUR NAME](here)')).toBe('\\[YOUR NAME\\](here)');
    });

    test('should escape the backslash before anything else', () => {
      // Otherwise the escape of a later character could itself be escaped.
      expect(escapeDiscord('\\*')).toBe('\\\\\\*');
    });
  });

  describe('escapeDiscordLineStart', () => {
    test.each([
      '# heading',
      '> quote',
      '- bullet',
      '+ bullet',
      '1. item',
      '2) item',
    ])('should defuse a line beginning with %s', (line) => {
      expect(escapeDiscordLineStart(line)).toBe(`\\${line}`);
    });

    test('should keep the indentation in front of the marker', () => {
      expect(escapeDiscordLineStart('  - bullet')).toBe('  \\- bullet');
    });

    test('should leave a line that begins with ordinary text alone', () => {
      expect(escapeDiscordLineStart('Half-Life 2 is out')).toBe('Half-Life 2 is out');
    });

    test('should only touch the start of the line', () => {
      expect(escapeDiscordLineStart('a - b - c')).toBe('a - b - c');
    });
  });

  describe('sanitizeTelegramMarkdown', () => {
    test('should leave ordinary text alone', () => {
      expect(sanitizeTelegramMarkdown('Patch 7.39 is live!')).toBe('Patch 7.39 is live!');
    });

    test.each(['*', '_', '`', '[', ']'])('should replace the marker %s', (char) => {
      expect(sanitizeTelegramMarkdown(char)).not.toContain(char);
    });

    test('should leave no unpaired marker behind', () => {
      // An unpaired marker is a hard API error in the legacy parse mode.
      const result = sanitizeTelegramMarkdown('2 * 3 and half_life and `code');

      expect(result).not.toMatch(/[*_`[\]]/);
    });

    test('should keep the text the same length', () => {
      const input = 'a*b_c`d[e]f';

      expect(sanitizeTelegramMarkdown(input)).toHaveLength(input.length);
    });
  });

  describe('sanitizeUrl', () => {
    test.each([
      'https://example.com',
      'http://example.com/path?a=1&b=2#frag',
      'mailto:someone@example.com',
    ])('should allow %s', (url) => {
      expect(sanitizeUrl(url)).toBe(url);
    });

    test('should keep the parentheses of a URL', () => {
      // The tree leaves no doubt where a URL ends, unlike the markdown it replaces.
      const url = 'https://en.wikipedia.org/wiki/Portal_(series)';

      expect(sanitizeUrl(url)).toBe(url);
    });

    test.each([
      'javascript:alert(1)',
      'data:text/html,<script>',
      'file:///etc/passwd',
    ])('should refuse %s', (url) => {
      expect(sanitizeUrl(url)).toBe('');
    });

    test('should refuse a URL it cannot resolve', () => {
      expect(sanitizeUrl('//example.com/a')).toBe('');
      expect(sanitizeUrl('/relative/path')).toBe('');
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl('   ')).toBe('');
    });

    test('should encode whitespace inside a URL', () => {
      expect(sanitizeUrl('https://example.com/a b')).toBe('https://example.com/a%20b');
    });

    test('should trim the URL before using it', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    test('should encode the characters that would break out of an attribute', () => {
      const result = sanitizeUrl('https://example.com/a"b');

      expect(result).not.toContain('"');
    });
  });
});
