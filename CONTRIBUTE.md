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

## Local setup

To set up the bot locally on your machine, you will first need to fork and clone the project.

Next you will need to create multiple API keys. First off navigate to `src/data/` and copy & paste `bot_config.example.json` into `bot_config.json`. You will need this file to store your API data.

**Important**: Never share your API keys with anyone! `bot_config.json` should be in the `.gitignore`, but please double check that you are not pushing your keys to any repository.

You will also have to copy & paste `subscribers.example.json` into `subscribers.json` and `updater_config.example.json` into `updater_config.json`.

You can now use the following tutorials to get the keys you need. If you don't want to use one of the features, skip the step and leave the `token` field empty. This (should) just disable this API. For the bots, you can aditionally set `autostart` to `false`, if you only want to test out a certain bot.

### Discord Bot

You will need to create a Discord bot if you want to test out the Discord notification functionalities.

To do that, first follow [this](https://discordpy.readthedocs.io/en/rewrite/discord.html) tutorial to create the bot. This will give you with a token ("Client Secret"). Copy & paste that in the `bot_config.json`, in the `bots.discord.token` field.

### Telegram Bot

You will need to create a Telegram bot if you want to test out the Telegram notification functionalities.

To do that, first follow [this](https://core.telegram.org/bots#3-how-do-i-create-a-bot) tutorial to create the bot. This will give you a token. Copy & paste that in the `bot_config.json`, in the `bots.telegram.token` field.

### Reddit API

You will need to register for the Reddit API to be able to test out the Reddit post polling.

To do that,

* Create an app for the bot, following [these](https://github.com/reddit-archive/reddit/wiki/OAuth2#getting-started) steps,
* Register for the API, using [this](https://docs.google.com/forms/d/e/1FAIpQLSezNdDNK1-P8mspSbmtC2r86Ee9ZRbC66u929cG2GX0T9UMyw/viewform) document,
* Get a refresh token, using [this](https://not-an-aardvark.github.io/reddit-oauth-helper/) generator.
* Think of a meaningful userAgent in this format: 
  
  `<platform>:<app ID>:<version string> (by /u/<reddit username>)`.

After following these steps, you should have `clientID`, `clientSecret`, `refreshToken` and `userAgent`. Copy & paste all of the, in  the `bot_config.json`, in the corresponding fields in the `reddit` object. 