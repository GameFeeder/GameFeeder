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
- You can also use the bot's tag as prefix.

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

- <img src="https://artifactwiki.com/wiki/Special:Redirect/file/Artifact_Cutout.png" align="left" height="17px"/> **Artifact**
  - Reddit posts by [/u/Magesunite](https://www.reddit.com/user/Magesunite/posts/) and [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/Artifact](https://www.reddit.com/r/Artifact/)
- <img src="http://media.steampowered.com/apps/csgo/blog/images/tags/csgo_blog_tag.png" align="left" height="17px"/> **CS:GO**
  - Reddit posts by [/u/wickedplayer494](https://www.reddit.com/user/wickedplayer494/posts/) on [/r/csgo](https://www.reddit.com/r/csgo/)
  - Posts on the [CS:GO blog](https://blog.counter-strike.net/)
- <img src="http://cdn.dota2.com/apps/dota2/images/reborn/day1/Dota2OrangeLogo.png" align="left" height="17px"/> **Dota 2**
  - Reddit posts by [/u/Magesunite](https://www.reddit.com/user/Magesunite/posts/) and [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/DotA2](https://www.reddit.com/r/DotA2/)
- <img src="https://pbs.twimg.com/profile_images/887778636102721536/Nxgl7xz4_400x400.jpg" align="left" height="17px"/> **Steam**
  - Reddit posts by [/u/wickedplayer494](https://www.reddit.com/user/wickedplayer494/posts/) on [/r/Steam](https://www.reddit.com/r/Steam/)
  - Posts on the [Steam blog](https://steamcommunity.com/app/593110/announcements/)
- <img src="http://icons.iconarchive.com/icons/papirus-team/papirus-apps/256/team-fortress-2-icon.png" align="left" height="17px"/> **Team Fortress 2**
  - Posts on the [TF2 blog](http://www.teamfortress.com/?tab=blog)
- <img src="https://pbs.twimg.com/profile_images/1139243347237691392/PzgWEKp7_400x400.png" align="left" height="17px"/> **Dota Underlords**
  - Reddit posts by [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/underlords](https://www.reddit.com/r/underlords/)

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