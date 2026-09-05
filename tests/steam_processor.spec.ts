import SteamProcessor from 'src/processors/steam_processor.js';

describe('Steam processor', () => {
  // Link filter
  describe('link filter', () => {
    test('should remove linkfilters', () => {
      const sampleText =
        '<a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>';
      const expected = '<p><a href="https://github.com">Text</a></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // BB Headers
  describe('bb header', () => {
    test.each([1, 2, 3, 4])('should parse bb h%i header', (level) => {
      const sampleText = `<div class="bb_h${level}">Text</div>`;
      const expected = `<p><h${level}>Text</h${level}></p>`;

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // BB Link Hosts
  describe('bb link host', () => {
    test('should remove bb link hosts', () => {
      const sampleText = '<p><span class="bb_link_host">[github.com]</span></p>';
      const expected = '<p><p></p></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Paragraphs and line breaks
  describe('paragraphs and line breaks', () => {
    test('should convert double line break to paragraph', () => {
      const sampleText = 'First\n\nSecond';
      const expected = '<p>First</p><p>Second</p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });

    test('should convert line break to <br>', () => {
      const sampleText = 'First\nSecond';
      const expected = '<p>First<br>Second</p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });

  describe('sample text', () => {
    test('should normalize a Steam RSS description', () => {
      const sampleText =
        '<p class="bb_paragraph"><i><a class="bb_link" href="https://steamcommunity.com/linkfilter/?url=https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a><span class="bb_link_host">[factorio.com]</span></i></p><div class="bb_h1">The new tooltips</div><ul class="bb_ul"><li>Many things were changed.</li></ul>';

      const expected =
        '<p><p class="bb_paragraph"><i><a class="bb_link" href="https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a></i></p><h1>The new tooltips</h1><ul class="bb_ul"><li>Many things were changed.</li></ul></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });

  describe('boundary with the BBCode parser', () => {
    test('should leave BBCode untouched', () => {
      // Steam's RSS feeds serve HTML. Its Web API serves BBCode, which
      // `src/steam/bbcode/` handles instead of this processor.
      const sampleText = '[p]Text with [b]markup[/b] and [url="https://x.com"]a link[/url].[/p]';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(`<p>${sampleText}</p>`);
    });
  });
});
