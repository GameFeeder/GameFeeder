import fs from 'node:fs';
import path from 'node:path';
import renderDiscord from 'src/markup/renderers/discord.js';
import renderTelegram from 'src/markup/renderers/telegram.js';
import parseBBCode from 'src/steam/bbcode/index.js';
import type { SteamNewsItemResponse } from 'src/steam/steam_app_news.js';
import { SteamNewsItem } from 'src/steam/steam_app_news.js';

const FIXTURE_DIR = path.resolve('tests/fixtures/steam');

/** Every tag of the Steam BBCode flavor, used to prove none of them survive. */
const BBCODE_TAG =
  /\[\/?(?:p|b|i|u|h[1-6]|list|olist|url|img|table|tr|td|th|quote|code|spoiler|strike|noparse|expand|previewyoutube|previewimg|dynamiclink|video|hr|\*)\b[^\]\n]*\]/i;

const FIXTURES = fs
  .readdirSync(FIXTURE_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();

function loadPost(name: string): SteamNewsItemResponse {
  return JSON.parse(
    fs.readFileSync(path.join(FIXTURE_DIR, `${name}.json`), 'utf8'),
  ) as SteamNewsItemResponse;
}

function loadExpected(name: string, target: string): string {
  return fs.readFileSync(path.join(FIXTURE_DIR, `${name}.${target}.md`), 'utf8').replace(/\n$/, '');
}

/** Strips the parts of the output where brackets are legitimate. */
function withoutLinksAndCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/\[([^\]]*)\]\(/g, '(');
}

/** Whether every emphasis marker Discord reads has a partner. */
function hasBalancedDiscordMarkers(rendered: string): boolean {
  const bare = rendered.replace(/```[\s\S]*?```/g, '').replace(/\\./g, '');

  return (['\\*\\*', '__', '~~', '\\|\\|'] as const).every(
    (marker) => (bare.match(new RegExp(marker, 'g')) ?? []).length % 2 === 0,
  );
}

/** Whether every entity marker Telegram reads has a partner.
 *
 * An unpaired one is a hard API error in the legacy parse mode, not merely a
 * rendering glitch, so this is the invariant that keeps messages deliverable.
 */
function hasBalancedTelegramMarkers(rendered: string): boolean {
  const outsideCode = rendered.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const outsideLinks = outsideCode.replace(/\[[^\]]*\]\([^)]*\)/g, '');

  return (
    (outsideLinks.match(/\*/g) ?? []).length % 2 === 0 &&
    (outsideLinks.match(/_/g) ?? []).length % 2 === 0
  );
}

describe('Steam BBCode against real posts', () => {
  test('should have found the fixtures', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(5);
  });

  describe.each(FIXTURES)('%s', (name) => {
    const post = loadPost(name);
    const tree = parseBBCode(post.contents);
    const outputs = {
      discord: renderDiscord(tree, { masked: true }),
      telegram: renderTelegram(tree),
    };

    test('should be the tree the news item exposes as its contents', () => {
      expect(new SteamNewsItem(post).contents).toEqual(tree);
    });

    describe.each(['discord', 'telegram'] as const)('%s', (target) => {
      const rendered = outputs[target];

      test('should match the recorded output', () => {
        expect(rendered).toEqual(loadExpected(name, target));
      });

      test('should not leave any BBCode behind', () => {
        expect(withoutLinksAndCode(rendered)).not.toMatch(BBCODE_TAG);
      });

      test('should not leave the image placeholders unresolved', () => {
        expect(rendered).not.toMatch(/\{STEAM_CLAN_(?:LOC_)?IMAGE\}/);
      });

      test('should be trimmed and free of blank line runs', () => {
        expect(rendered).toBe(rendered.trim());
        expect(rendered).not.toMatch(/\n{3,}/);
        // A line of quote markers keeps its trailing space, which is syntax.
        for (const line of rendered.split('\n')) {
          if (!/^(?:> )+$/.test(line)) {
            expect(line).not.toMatch(/[ \t]$/);
          }
        }
      });

      test('should leave no quote marker stranded on its own', () => {
        // Discord reads a bare `>` as text and ends the quote at that line.
        expect(rendered).not.toMatch(/^>+$/m);
      });

      test('should put no raw whitespace inside a URL', () => {
        for (const [, url] of rendered.matchAll(/\]\(([^)]*)\)/g)) {
          expect(url).not.toMatch(/\s/);
        }
      });

      test('should keep something to read', () => {
        expect(rendered.length).toBeGreaterThan(100);
      });
    });

    test('should leave the Discord markers balanced', () => {
      expect(hasBalancedDiscordMarkers(outputs.discord)).toBe(true);
    });

    test('should leave the Telegram markers balanced', () => {
      expect(hasBalancedTelegramMarkers(outputs.telegram)).toBe(true);
    });

    test('should render no heading syntax for Telegram, which has none', () => {
      expect(outputs.telegram).not.toMatch(/^#{1,6} /m);
    });
  });

  describe('the reported Dota 2 post', () => {
    const rendered = renderDiscord(parseBBCode(loadPost('dota_ti_champions').contents), {
      masked: true,
    });

    test('should no longer start with a raw paragraph tag', () => {
      expect(rendered).not.toContain('[p]');
      expect(rendered.startsWith('[Image](')).toBe(true);
    });

    test('should resolve the localised clan image', () => {
      expect(rendered).toContain(
        '[Image](https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/bab4343d906943ef2117ae553347d8f8991ebca3.png)',
      );
    });

    test('should keep quotes out of a link target', () => {
      expect(rendered).toContain('[Dota 2 YouTube channel](https://www.youtube.com/user/dota2)');
    });

    test('should render the heading', () => {
      expect(rendered).toContain('### Until Next Time');
    });

    test('should merge the champion roster into one list', () => {
      expect(rendered).toContain(
        [
          '- Illia "Yatoro" Muliarchuk',
          '- Denis "Larl" Sigitov',
          '- Magomed "Collapse" Khalilov',
          '- Alexey "not\\_me" Kosmynin',
          '- Alexander "rue" Filin',
        ].join('\n'),
      );
    });
  });
});
