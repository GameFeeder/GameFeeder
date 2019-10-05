# Contributing to this project

First of, thanks for your help!

This document will guide you through setting up the bot on your PC, editing the project and creating a pull request for your changes.

## Index

- [Contributing to this project](#contributing-to-this-project)
  - [Index](#index)
  - [Local setup](#local-setup)
    - [Discord Bot](#discord-bot)
    - [Telegram Bot](#telegram-bot)
    - [Reddit API](#reddit-api)
    - [Docker containers](#docker-containers)
      - [Using the VSCode Dev Container](#using-the-vscode-dev-container)
      - [Using the production-ready Docker image & Docker Compose](#using-the-production-ready-docker-image--docker-compose)
  - [Debugging and configurations](#debugging-and-configurations)
  - [Testing](#testing)

## Local setup

To set up the bot locally on your machine, you will first need to fork and clone the project.

Next you will need to create multiple API keys. First, run the bot (`yarn dev`) once to initialize the config files. The bot will copy all example files in `data/` and `config/`, to enable your personal configuration files.
The bot should warn you that you have missing bot and reddit tokens.

**Important**: Never share your API keys with anyone! Make sure to never add your api tokens and secrets to the example files, as they are uploaded to GitHub!

You can now use the following tutorials to get the keys you need. If you don't want to use one of the features, skip the step and leave the `token` field empty. This (should) just disable this API. For the bots, you can aditionally set `autostart` to `false`, if you only want to test out a certain bot.

### Discord Bot

You will need to create a Discord bot if you want to test out the Discord notification functionalities.

To do that, first follow [this](https://discordpy.readthedocs.io/en/latest/discord.html) tutorial to create an application with a bot. This provide you with a bot token. Copy & paste that in the `config/api_config.json`, in the `bots.discord.token` field. Make sure to take the bot's token and not the application's client secret, it won't work otherwise.

Some commands require `OWNER` permissions. To access those, you need to add your userID to `config/api_config.json` in the `bots.discord.owners` array.
To find out your ID, you can follow [this](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) guide.

### Telegram Bot

You will need to create a Telegram bot if you want to test out the Telegram notification functionalities.

To do that, first follow [this](https://core.telegram.org/bots#3-how-do-i-create-a-bot) tutorial to create the bot. This will give you a token. Copy & paste that in the `config/api_config.json`, in the `bots.telegram.token` field.

Some commands require `OWNER` permissions. To access those, you need to add your userID to `config/api_config.json` in the `bots.telegram.owners` array.
To find out your ID, you can use [@get_id_bot](https://telegram.me/get_id_bot).

### Reddit API

You will need to register for the Reddit API to be able to test out the Reddit post polling.

To do that,

- Create an app for the bot, following [these](https://github.com/reddit-archive/reddit/wiki/OAuth2#getting-started) steps (choose "web app" as type),
- Register for the API, using [this](https://docs.google.com/forms/d/e/1FAIpQLSezNdDNK1-P8mspSbmtC2r86Ee9ZRbC66u929cG2GX0T9UMyw/viewform) document,
- Get a refresh token, using [this](https://not-an-aardvark.github.io/reddit-oauth-helper/) generator.

After following these steps, you should have `clientID`, `clientSecret`, `refreshToken` and your `userName`. Copy & paste all of the, in the `config/api_config.json`, in the corresponding fields in the `reddit` object.

### Docker containers

You can use Docker containers in order to run the bot without worrying about other system dependencies. The only requirement is [Docker Engine](https://docs.docker.com/install/) 18.06.0+.

#### Using the VSCode Dev Container

> Location: `/.devcontainer/Dockerfile`

This is meant to be used as a dev container. VSCode can utilize this automatically. For more information check out the [official VSCode guide](https://code.visualstudio.com/docs/remote/containers) on developing inside a container.

If you are using Windows, you can also leverage the WSL with no further configuration necessary. Just follow the steps described [here](https://code.visualstudio.com/docs/remote/wsl).

#### Using the production-ready Docker image & Docker Compose

> Location: `/Dockerfile`

The `Dockerfile` provided in the root folder along with the `docker-compose.yml` can be used to try the bot in production mode. In addition to the Docker engine, you will need [Docker Compose](https://docs.docker.com/compose/install/) 1.22.0+.

To run the bot locally (for example to test your changes), follow these steps:

- make sure you are in the root directory of the project
- make sure you have set up the configuration files as described above
- `docker-compose up --build -d` to build the image and run the container in the background
- `docker-compose ps` to check that it's actually up and running
- `docker-compose logs -f bot` to observe the log output of the bot

To tear down the container, simply run:

- `docker-compose down`

## Debugging and configurations

To test out the bot in development, use the `yarn dev` command. The bot will try to make sure that the `config/` and `data/` files are up-to-date and launch all enabled bots and the updater. The bot will restart on any `config/` or code changes.

Several `config/` changes are recommeded for testing and debugging:

- In `config/updater_config`:
  - Setting `autosave` to `false` will reset the updater date on restart. This way you can configure a `lastUpdate` date in `data/updater_data.json` for your testing needs without it being overwritten by the updater
  - It might be necessary to increase the `limit` to test out an older update
  - If your work is unreleated to the updater, you can disable it by setting `autostart` to `false`
- In `api_config.json`:
  - You can disable one of the bots by setting its `autostart` value to `false`

To test out the bot's functionality, we recommend to try the following steps:

- Use the `start` command to test basic command functionality
- Make sure you are subscribed to a game (`subscribe` or `sub`) and start the updater. Make sure you recieve the notifications

## Testing

You can use `yarn test` to run the unit tests to make sure that you didn't break anything. Please provide unittests for your code if applicable.
