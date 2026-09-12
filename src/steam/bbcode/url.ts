/** Base URL that Steam's clan image placeholders expand to. */
export const STEAM_CLAN_IMAGE_URL =
  'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans';

/** Placeholders Steam uses in image URLs. Both resolve to the same location. */
const CLAN_IMAGE_PLACEHOLDERS = /\{STEAM_CLAN_(?:LOC_)?IMAGE\}/g;

/** `https://steamcommunity.com/linkfilter/?url=<target>` wrappers. */
const LINK_FILTER = /^https?:\/\/steamcommunity\.com\/linkfilter\/\?url=(.*)$/;

/** Expands Steam's placeholders and unwraps its link filter.
 *
 * The parser applies this so that the tree carries URLs a renderer can use
 * without knowing anything about Steam.
 *
 * @param raw - The URL as it appears in the post.
 */
export function resolveSteamUrl(raw: string): string {
  let url = raw.trim();

  // Some posts wrap the URL in quotes on top of the tag syntax.
  if (url.length >= 2 && (url.startsWith('"') || url.startsWith("'"))) {
    const quote = url[0];
    if (url.endsWith(quote)) {
      url = url.slice(1, -1).trim();
    }
  }

  url = url.replace(CLAN_IMAGE_PLACEHOLDERS, STEAM_CLAN_IMAGE_URL);

  const filtered = LINK_FILTER.exec(url);
  if (filtered) {
    try {
      url = decodeURIComponent(filtered[1]);
    } catch {
      // Malformed percent-encoding: keep the target as-is rather than dropping it.
      url = filtered[1];
    }
  }

  return url;
}

/** `https://store.steampowered.com/app/251570/7_Days_to_Die/` */
const STEAM_APP_URL = /\/app\/\d+\/([^/?#]+)/;

/** Derives a label for a tag that carries no text of its own.
 *
 * `[dynamiclink]` and a bare `[url=...][/url]` are both common in Steam posts.
 * A store link becomes the app's name, anything else a readable form of the URL
 * itself, which reads far better than a generic placeholder.
 *
 * @param url - The resolved URL.
 * @returns The label, or an empty string if none could be derived.
 */
export function labelFromUrl(url: string): string {
  const app = STEAM_APP_URL.exec(url);

  if (app) {
    const name = decodeURIComponent(app[1]).replace(/_/g, ' ').trim();
    if (name !== '') {
      return name;
    }
  }
  return url
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}
