# Steam news fixtures

Real, unmodified news items from the Steam Web API, used to validate the whole
Steam pipeline — [`src/steam/bbcode/`](../../../src/steam/bbcode) parsing a post
into the shared tree, and [`src/markup/renderers/`](../../../src/markup/renderers)
rendering that tree for each messenger — against posts Steam actually produces.

Each case is a triple:

- `<name>.json` — one verbatim entry of `appnews.newsitems` from the API.
- `<name>.discord.md` — what a Discord embed is expected to show.
- `<name>.telegram.md` — what a Telegram message is expected to show.

| Fixture | Game (appid) | What it covers |
| --- | --- | --- |
| `dota_ti_champions` | Dota 2 (570) | `[p]`, `[img src=]` with `{STEAM_CLAN_LOC_IMAGE}`, consecutive single item lists, `[h3]`, quoted `[url="..."]`, empty `[p][/p]` spacers |
| `dota_ti_qualifiers` | Dota 2 (570) | unclosed `[*]` items holding an `[expand type=details]` block, bare `[img]{STEAM_CLAN_IMAGE}[/img]`, blank line paragraphs |
| `pubg_pgs9_finals` | PUBG (578080) | `[table equalcells="1" colwidth=",,,"]` with `[tr]`/`[td]`, `[dynamiclink href="..."]`, `[u]` inside a link |
| `terraria_design_works` | Terraria (105600) | the older tag-free paragraph style, `[url=...][img]...[/img][/url]` split over lines, `[h1][b]...[/b][/h1]` |
| `rust_community_update` | Rust (252490) | `[previewyoutube="id;full"]`, `[img src="..." style="..."]` with punctuation in the attribute, runs of empty paragraphs |

## Refreshing a fixture

Fixtures are committed and never fetched while the tests run. To capture a post:

```sh
curl -s "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=<appid>&count=60&feeds=steam_community_announcements" \
  | jq --arg g "<gid>" '.appnews.newsitems[] | select(.gid==$g)' > <name>.json
```

The `gid` of each fixture is stored in its own JSON file. After changing the
parser or a renderer, regenerate the `.discord.md` and `.telegram.md` files and
**read the diff** — they are the record of what the bots will post, so a change
there is a change to every Steam game feed.
