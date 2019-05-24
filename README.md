[![Build Status](https://travis-ci.com/TimJentzsch/valveGamesAnnouncerBot.svg?branch=develop)](https://travis-ci.com/TimJentzsch/valveGamesAnnouncerBot)

# valveGamesAnnouncerBot <!-- omit in toc -->

A notification bot for Valve's games.
Available on Telegram and Discord soon<sup>TM</sup>.

A TypeScript port of the [dota2UpdatesBot](https://github.com/zachkont/dotaUpdatesBot) by [/u/karaflix](https://www.reddit.com/message/compose/?to=karaflix), supporting multiple clients and games.

---
## Index <!-- omit in toc -->
- [About this project](#about-this-project)
  - [Commands](#commands)
    - [Permissions](#permissions)
  - [Games](#games)
  - [Contributing](#contributing)
- [Miscellaneous](#miscellaneous)
  - [Privacy](#privacy)
  - [License](#license)
  - [Disclaimer](#disclaimer)

## About this project

### Commands

So far, we are providing the following commands:

- The default prefix on Telegram is `/`.
- The default prefix on Discord is `!`.

| Command                                  | Permission | Summary                                         |
| ---------------------------------------- | ---------- | ----------------------------------------------- |
| `help`                                   | User       | Display all available commands.                 |
| `about`                                  | User       | Display information about this bot.             |
| `games`                                  | User       | Display a list of all available games.          |
| `subscribe <game name>`                  | Admin      | Subscribe to a game's feed.                     |
| `unsubscribe <game name>`                | Admin      | Unsubscribe from a game's feed.                 |
| `prefix <new prefix>`                    | Admin      | Change the prefix the bot uses on this channel. |
| `notifyAll <message>`                    | Owner      | Send a message to all subscribers.              |
| `notifyGameSubs (<game name>) <message>` | Owner      | Send a message to all subscribers of a game.    |
| `stats`                                  | Owner      | Display statistics about the bot.               |

#### Permissions

- **User**: Any user can execute this command
- **Admin**: Only admins on this server can execute this command
- **Owner**: Only the owner of the bot can execute this command

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

### Contributing

We are thankful for your help! Please refer to the [contributing guidelines](CONTRIBUTE.md).

---

## Miscellaneous

### Privacy

As long as you have subscriptions active or a custom prefix defined, we are storing the ID of that channel (unencrypted) on our server.

You can remove it again by unsubscribing from every feed and resetting the prefix.

### License

We are providing the bot under the GPL-3.0 License. Read more [here](LICENSE).

### Disclaimer

Please note that this project is not affiliated with Valve Corporation.

**Artifact**, **Dota 2**, **CS:GO** and **Team Fortress 2** are registered trademarks of Valve Corporation.