![Build status](https://github.com/GameFeeder/GameFeeder/workflows/ci-flow/badge.svg)

# GameFeeder <!-- omit in toc -->

You can use this bot to get notified about updates and blog posts for multiple games. With the commands you can modify which notifications you want to receive.

Available on Discord and Telegram soon<sup>TM</sup>.

A TypeScript port of the [dota2UpdatesBot](https://github.com/zachkont/dotaUpdatesBot) by [/u/karaflix](https://www.reddit.com/message/compose/?to=karaflix), supporting multiple clients and games.

---

## Index <!-- omit in toc -->

- [About this project](#about-this-project)
  - [Usage](#usage)
    - [Discord](#discord)
    - [Telegram](#telegram)
    - [Local setup](#local-setup)
  - [Commands](#commands)
    - [Permissions](#permissions)
  - [Games](#games)
  - [Contributing](#contributing)
- [Miscellaneous](#miscellaneous)
  - [Privacy](#privacy)
  - [License](#license)
  - [Disclaimer](#disclaimer)

## About this project

### Usage

The quickest way to use the bot is via our public bots and servers:

#### Discord

On Discord, the bot runs publicly as **@GameFeeder#5446**. The best way to use the bot is to join our [Discord server](https://discord.gg/hFNRHE5) (make sure to mute the channels you are not interested in). You can also add the bot to your own servers via this [invite link](https://discordapp.com/oauth2/authorize?&client_id=626677125105188884&scope=bot&permissions=18432).

![Discord Preview](https://imgur.com/62T4GBa.png)

#### Telegram

On Telegram, the bot runs publicly as **@AnnounceBot**. The best way to use the bot is to [add it directly](https://telegram.me/AnnounceBot) (don't forget to subscribe to the games you are interested in). If you are only interested in Dota 2, you can also use the old [Dota 2 Feeder channel](https://t.me/dota2feeder).

![Telegram Preview](https://imgur.com/7uRNQ8k.png)

#### Local setup

You can also download production-ready images from the [dockerhub repo](https://hub.docker.com/r/gamefeeder/gamefeeder/tags). You will still need your own configuration and data files for it to work (more info about how to do that in [CONTRIBUTING.md](CONTRIBUTING.md)).

### Commands

So far, we are providing the following commands:

- The default prefix on Telegram is `/`.
- The default prefix on Discord is `!`.
- You can also use the bot's tag as prefix.

| Command                                    | Permission | Summary                                                            |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------ |
| `start`                                    | User       | Get started with the GameFeeder.                                   |
| `help`                                     | User       | Display all available commands.                                    |
| `about`                                    | User       | Display information about this bot.                                |
| `settings`                                 | User       | Display an overview of the settings you can configure for the bot. |
| `games`                                    | User       | Display a list of all available games.                             |
| `stats`                                    | User       | Display some stats about the bot.                                  |
| `flip`                                     | User       | Flip a coin.                                                       |
| `roll <dice count> <dice type> <modifier>` | User       | Roll some dice.                                                    |
| `subscribe <game name>`                    | Admin      | Subscribe to a game's feed.                                        |
| `unsubscribe <game name>`                  | Admin      | Unsubscribe from a game's feed.                                    |
| `prefix <new prefix>`                      | Admin      | Change the prefix the bot uses on this channel.                    |
| `notifyAll <message>`                      | Owner      | Send a message to all subscribers.                                 |
| `notifyGameSubs (<game name>) <message>`   | Owner      | Send a message to all subscribers of a game.                       |

**Note:** The messages in the notification commands should be provided in the raw markdown format, they will be reformatted for the different clients. Discord should be used for these commands, as some formatting information gets lost in Telegram (when Telegram uses the same format).

#### Permissions

- **User**: Any user can execute this command
- **Admin**: Only admins on this server can execute this command
- **Owner**: Only the owner of the bot can execute this command

### Games

So far, we are supporting the following games:

- <strong align="left">Artifact</strong> <img src="https://artifactwiki.com/wiki/Special:Redirect/file/Artifact_Cutout.png" height="17px"/>
  - Reddit posts by [/u/Magesunite](https://www.reddit.com/user/Magesunite/posts/) and [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/Artifact](https://www.reddit.com/r/Artifact/)
- <strong align="left">CS:GO</strong> <img src="http://media.steampowered.com/apps/csgo/blog/images/tags/csgo_blog_tag.png" height="17px"/>
  - Reddit posts by [/u/wickedplayer494](https://www.reddit.com/user/wickedplayer494/posts/) on [/r/csgo](https://www.reddit.com/r/csgo/)
  - Posts on the [CS:GO blog](https://blog.counter-strike.net/)
- <strong align="left">Dota 2</strong> <img src="http://cdn.dota2.com/apps/dota2/images/reborn/day1/Dota2OrangeLogo.png" height="17px"/>
  - Reddit posts by [/u/Kappa_Man](https://www.reddit.com/user/Kappa_Man/posts/), [/u/Magesunite](https://www.reddit.com/user/Magesunite/posts/), [/u/wickedplayer494](https://www.reddit.com/user/wickedplayer494/posts/) and [/u/wykrhm](https://www.reddit.com/user/wykrhm/posts/) on [/r/DotA2](https://www.reddit.com/r/DotA2/)
  - Gamplay updates on the [Dota 2 patch page](https://www.dota2.com/patches)
  - Blog posts on the [Dota 2 Blog](http://blog.dota2.com/?l=english)
- <strong align="left">Factorio</strong> <img src="https://wiki.factorio.com/images/Factorio-icon.png" height="17px"/>
  - Posts on the [Steam feed](https://steamcommunity.com/games/427520/announcements)
- <strong align="left">Steam</strong> <img src="https://pbs.twimg.com/profile_images/887778636102721536/Nxgl7xz4_400x400.jpg" height="17px"/>
  - Reddit posts by [/u/wickedplayer494](https://www.reddit.com/user/wickedplayer494/posts/) on [/r/Steam](https://www.reddit.com/r/Steam/)
  - Posts on the [Steam blog](https://steamcommunity.com/app/593110/announcements/)
- <strong align="left">Team Fortress 2</strong> <img src="http://icons.iconarchive.com/icons/papirus-team/papirus-apps/256/team-fortress-2-icon.png" height="17px"/>
  - Posts on the [TF2 blog](http://www.teamfortress.com/?tab=blog)
- <strong align="left">Dota Underlords</strong> <img src="https://pbs.twimg.com/profile_images/1139243347237691392/PzgWEKp7_400x400.png" height="17px"/>
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

Please note that this project is not affiliated with any games or corporations it posts updates for.

**Artifact**, **CS:GO**, **Dota 2**, **Steam**, **Team Fortress 2** and **Dota Underlords** are registered trademarks of Valve Corporation.
