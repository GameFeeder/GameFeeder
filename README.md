# valveGamesAnnouncerBot

A notification bot for Valve's games.
Available on Telegram and Discord soon<sup>TM</sup>.

A TypeScript port of the [dota2UpdatesBot](https://github.com/zachkont/dotaUpdatesBot/blob/development/updater.py) by /u/karaflix, supporting multiple clients and games.

---
## Index
- [valveGamesAnnouncerBot](#valvegamesannouncerbot)
  - [Index](#index)
  - [About this project](#about-this-project)
    - [Commands](#commands)
    - [Games](#games)
  - [Miscellaneous](#miscellaneous)
    - [Privacy](#privacy)
    - [Disclaimer](#disclaimer)

## About this project

### Commands

So far, we are providing the following commands (with `/` as prefix):

| Command                    | Summary                                         |
| -------------------------- | ----------------------------------------------- |
| `/help`                    | Display all available commands.                 |
| `/about`                   | Display information about this bot.             |
| `/games`                   | Display a list of all available games.          |
| `/subscribe <game name>`   | Subscribe to a game's feed.                     |
| `/unsubscribe <game name>` | Unsubscribe from a game's feed.                 |
| `/prefix <new prefix>`     | Change the prefix the bot uses on this channel. |

* The default prefix on Telegram is `/`.
* The default prefix on Discord is `!`.

### Games

So far, we are supporting the following games:

- Artifact
  - Reddit posts by [/u/Magesunite](https://www.reddit.com/user/Magesunite/posts/) and [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/Artifact](https://www.reddit.com/r/Artifact/)
- CS:GO
  - Reddit posts by [/u/wickedplayer494](https://www.reddit.com/user/wickedplayer494/posts/) on [/r/csgo](https://www.reddit.com/r/csgo/)
  - Posts on the [CS:GO blog](https://blog.counter-strike.net/)
- Dota 2
  - Reddit posts by [/u/Magesunite](https://www.reddit.com/user/Magesunite/posts/) and [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/DotA2](https://www.reddit.com/r/DotA2/)
  - Posts on the [Dota 2 blog](http://blog.dota2.com/)
- Team Fortress 2
  - Posts on the [TF2 blog](http://www.teamfortress.com/?tab=blog)


---

## Miscellaneous

### Privacy

As long as you have subscriptions active or a custom prefix defined, we are storing the ID of that channel (unencrypted) on our server.

You can remove it again by unsubscribing from every feed and resetting the prefix.


### Disclaimer

Please note that this project is not affiliated with *Valve Corporation*.

**Artifact**, **Dota 2**, **CS:GO** and **Team Fortress 2** are registered trademarks of *Valve Corporation*.