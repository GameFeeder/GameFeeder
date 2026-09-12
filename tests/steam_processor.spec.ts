import parseHtml from 'src/markup/parsers/html.js';
import renderDiscord from 'src/markup/renderers/discord.js';
import SteamProcessor from 'src/processors/steam_processor.js';

/** Runs the Steam RSS pipeline: normalize the markup, then read it. */
function render(html: string): string {
  const processed = new SteamProcessor().process(html);

  return renderDiscord(parseHtml(processed, { preserveLineBreaks: true }), { masked: true });
}

describe('Steam processor', () => {
  describe('link filter', () => {
    test('should point a link at where it actually goes', () => {
      const sampleText =
        '<a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>';

      expect(new SteamProcessor().process(sampleText)).toEqual(
        '<a href="https://github.com">Text</a>',
      );
    });

    test('should leave an ordinary link alone', () => {
      const sampleText = '<a href="https://github.com">Text</a>';

      expect(new SteamProcessor().process(sampleText)).toEqual(sampleText);
    });
  });

  describe('boundary with the HTML parser', () => {
    // These used to be rewritten here. The HTML parser understands them
    // directly, so the processor no longer has to know about them.
    test('should leave a heading div to the HTML parser', () => {
      expect(render('<div class="bb_h2">Title</div>')).toEqual('## Title');
    });

    test('should leave a link host to the HTML parser', () => {
      const sampleText =
        '<a href="https://github.com">Repo</a><span class="bb_link_host">[github.com]</span>';

      expect(render(sampleText)).toEqual('[Repo](https://github.com)');
    });

    test('should leave paragraph splitting to the HTML parser', () => {
      expect(render('First\n\nSecond')).toEqual('First\n\nSecond');
    });

    test('should leave line breaks to the HTML parser', () => {
      expect(render('First\nSecond')).toEqual('First\nSecond');
    });
  });

  describe('sample text', () => {
    test('should read a Steam RSS description', () => {
      const sampleText =
        '<p class="bb_paragraph"><i><a class="bb_link" href="https://steamcommunity.com/linkfilter/?url=https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a><span class="bb_link_host">[factorio.com]</span></i></p><div class="bb_h1">The new tooltips</div><ul class="bb_ul"><li>Many things were changed.</li></ul>';

      expect(render(sampleText)).toEqual(
        [
          '*[Read this post on our website.](https://factorio.com/blog/post/fff-318)*',
          '',
          '# The new tooltips',
          '',
          '- Many things were changed.',
        ].join('\n'),
      );
    });
  });

  describe('boundary with the BBCode parser', () => {
    test('should leave BBCode untouched', () => {
      // Steam's RSS feeds serve HTML. Its Web API serves BBCode, which
      // `src/steam/bbcode/` handles instead of this processor.
      const sampleText = '[p]Text with [b]markup[/b] and [url="https://x.com"]a link[/url].[/p]';

      expect(new SteamProcessor().process(sampleText)).toEqual(sampleText);
    });
  });
});
