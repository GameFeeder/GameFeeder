# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GameFeeder is a TypeScript ESM Node.js bot that polls game news sources (Steam, RSS, Dota patch page) and pushes notifications to subscribed Discord and Telegram channels.

## Commands

```bash
npm run dev          # run with nodemon + ts-node (restarts on src/config changes)
npm run build        # tsc --build → dist/
npm test             # jest (needs NODE_OPTIONS='--experimental-vm-modules', script sets it)
npm test -- tests/game.spec.ts   # run a single test file
npm run coverage     # jest --coverage
npm run biome:check  # lint + format check (CI mode)
npm run biome:fix    # auto-fix lint/format
```

Biome is the linter/formatter (config in `biome.json`): single quotes, 100-char lines, `noExplicitAny` is an error.

## ESM gotchas

- `"type": "module"` — all relative imports **must use the `.js` extension** even though sources are `.ts` (e.g. `import Game from './game.js'`). Dev mode runs `.ts` directly via `register.mjs` (ts-node/esm hook); production runs compiled `dist/`.
- Jest maps `.js` imports back to `.ts` via `moduleNameMapper` in `jest.config.js`. Tests live in `tests/*.spec.ts`; manual mocks in `tests/__mocks__/` (node-fetch) and `src/util/__mocks__/` (rollbar_client, auto-applied by `tests/_test-setup.ts`).

## Architecture

`docs/ARCHITECTURE.md` has a full mermaid diagram; `docs/APIS.md` documents API rate limits. The short version:

**Entry**: `src/_main.ts` → `InitManager.initAll()` (creates `config/` user files from `.example.json` templates) → register commands on bots → start bots → start updaters.

**Update pipeline (the core loop)**: Each key in `config/updater_config.json` (`steam`, `rss`, `dota_patches`) becomes one `Updater` instance (`src/updater.ts`). Every cycle, an updater iterates all games and looks up `game.providers[this.key]` — **the updater key must match a provider key in the game's config**. The provider (`src/providers/`) fetches and returns `Notification[]`; the updater persists the last timestamp/version per game via `DataManager` and publishes each notification on PubSub topic `Updater.UPDATER_TOPIC`.

**Delivery**: Each `BotClient` (`src/bots/bot.ts`) subscribes to `UPDATER_TOPIC` and sends the notification to channels subscribed to that game (subscriptions stored in the SQLite DB via `DataManager`).

**Games**: Defined declaratively in `config/games/*.json` (name, aliases, color, icon, providers). `src/game.ts` loads them all and instantiates providers; the Dota game additionally gets a hardcoded `DotaProvider`. To add a game, add a JSON file there — no code change needed unless it needs a new provider type.

**Commands**: All user commands are defined in one file, `src/commands/commands.ts`, as instances of the class hierarchy in `src/commands/` (`Command` → `SimpleAction`/`NoLabelAction`/`TwoPartCommand`, grouped by `CommandGroup`). Role gating (USER/ADMIN/OWNER) via `src/permissions.ts`; owners are configured in `config/api_config.json`.

**Bots**: `src/bots/bots.ts` returns the singletons `DiscordBot` (discord.js) and `TelegramBot` (telegraf), both extending abstract `BotClient`. Platform-specific message formatting lives in these classes; `Notification` is platform-neutral.

**Managers** (`src/managers/`, all static/singleton): `ConfigManager` reads `config/`, `DataManager` reads/writes `data/`, `FileManager` does raw I/O, `InitManager` bootstraps user files from examples, `ProjectManager` exposes name/version.

**Errors/logging**: `Logger` (winston, per-class instances with a name label) + `rollbar_client` singleton for error reporting (disabled unless configured).

## Config & data files

- `config/` = behavior (checked-in `.example.json` templates; real `.json` files are gitignored and generated on first run). `api_config.json`: bot tokens, enable flags, owners. `updater_config.json`: per-updater intervals/limits.
- `data/` = runtime state in `gamefeeder.db` (SQLite via `node:sqlite`, all inside `DataManager`): tables `channels` + `subscriptions` (per-platform channel settings and game subs) and `providers` + `provider_updates` (healthcheck + last-update timestamps per updater/game). Created and seeded from the updater config on first access; legacy `data/*.json` files are auto-imported once and renamed to `.bak`. `DataManager.closeDb()` exists for tests.
- Never put real tokens in `.example.json` files — they are committed.

## Debugging tips (from CONTRIBUTING.md)

- Set `autosave: false` in `updater_config.json` so the last-update date isn't overwritten, then set `published_at` in the `provider_updates` table of `data/gamefeeder.db` to replay old updates; raise `limit` to fetch more.
- Disable the updater (`enabled: false`) or a bot client (`api_config.json`) when not needed.
