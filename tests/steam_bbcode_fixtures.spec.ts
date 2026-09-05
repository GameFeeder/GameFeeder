import fs from 'node:fs';
import path from 'node:path';
import DiscordBot from 'src/bots/discord.js';
import TelegramBot from 'src/bots/telegram.js';
import bbcodeToMarkdown from 'src/steam/bbcode/index.js';
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

function loadExpected(name: string): string {
  return fs.readFileSync(path.join(FIXTURE_DIR, `${name}.md`), 'utf8').replace(/\n$/, '');
}

/** Strips the parts of the markdown where brackets are legitimate. */
function withoutLinksAndCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/\[([^\]]*)\]\(/g, '(');
}

describe('Steam BBCode against real posts', () => {
  test('should have found the fixtures', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(5);
  });

  describe.each(FIXTURES)('%s', (name) => {
    const post = loadPost(name);
    const markdown = bbcodeToMarkdown(post.contents);

    test('should match the recorded markdown', () => {
      expect(markdown).toEqual(loadExpected(name));
    });

    test('should not leave any BBCode behind', () => {
      expect(withoutLinksAndCode(markdown)).not.toMatch(BBCODE_TAG);
    });

    test('should not leave the image placeholders unresolved', () => {
      expect(markdown).not.toMatch(/\{STEAM_CLAN_(?:LOC_)?IMAGE\}/);
    });

    test('should be trimmed and free of blank line runs', () => {
      expect(markdown).toBe(markdown.trim());
      expect(markdown).not.toMatch(/\n{3,}/);
      expect(markdown).not.toMatch(/[ \t]\n/);
    });

    test('should be what the news item exposes as its contents', () => {
      expect(new SteamNewsItem(post).contents).toEqual(markdown);
    });

    test('should survive transcoding to Discord and Telegram', () => {
      // The renderer targets the dialect `MDRegex` understands, so nothing
      // should be left in the generic syntax after either bot converts it.
      const discord = DiscordBot.msgFromMarkdown(markdown, true);
      const telegram = TelegramBot.msgFromMarkdown(markdown);

      expect(discord).toContain('](');
      expect(telegram).toContain('](');
      expect(telegram).not.toContain('**');
      expect(discord).not.toMatch(/^#{1,6} /m);
      expect(telegram).not.toMatch(/^#{1,6} /m);
    });
  });

  describe('the reported Dota 2 post', () => {
    const markdown = bbcodeToMarkdown(loadPost('dota_ti_champions').contents);

    test('should no longer start with a raw paragraph tag', () => {
      expect(markdown).not.toContain('[p]');
      expect(markdown.startsWith('![Image](')).toBe(true);
    });

    test('should resolve the localised clan image', () => {
      expect(markdown).toContain(
        '![Image](https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/3703047/bab4343d906943ef2117ae553347d8f8991ebca3.png)',
      );
    });

    test('should keep quotes out of a link target', () => {
      expect(markdown).toContain('[Dota 2 YouTube channel](https://www.youtube.com/user/dota2)');
    });

    test('should render the heading', () => {
      expect(markdown).toContain('### Until Next Time');
    });

    test('should merge the champion roster into one list', () => {
      expect(markdown).toContain(
        [
          '- Illia "Yatoro" Muliarchuk',
          '- Denis "Larl" Sigitov',
          '- Magomed "Collapse" Khalilov',
          '- Alexey "not_me" Kosmynin',
          '- Alexander "rue" Filin',
        ].join('\n'),
      );
    });
  });
});
