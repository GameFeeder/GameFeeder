# valveGamesAnnouncerBot

A notification bot for Dota 2 and Artifact.
Available on Telegram and Discord soon<sup>TM</sup>.

A TypeScript port of the [dota2UpdatesBot](https://github.com/zachkont/dotaUpdatesBot/blob/development/updater.py), supporting multiple clients and games.

---
## Index
- [valveGamesAnnouncerBot](#valvegamesannouncerbot)
  - [Index](#index)
  - [About this project](#about-this-project)
    - [Commands](#commands)
  - [Miscellaneous](#miscellaneous)
    - [Privacy](#privacy)
    - [Disclamer](#disclamer)

## About this project

### Commands

So far, we are providing the following commands (with `/` as prefix):

| Command                    | Summary                         |
| -------------------------- | ------------------------------- |
| `/subscribe <game name>`   | Subscribe to a game's feed.     |
| `/unsubscribe <game name>` | Unsubscribe from a game's feed. |

* The default prefix on Telegram is `/`.
* The default prefix on Discord is `!`.

---

## Miscellaneous

### Privacy

When you subscribe to a game's feed, we are storing the ID of the chat you subscribed in on our server. This is nessecary to notify you on any updates.

When you unsubscribe, the ID of that chat gets deleted again.


### Disclamer

Please note that this project is not affiliated with *Valve Corporation*.

*Dota 2* and *Artifact* are registered trademarks of *Valve Corporation*.