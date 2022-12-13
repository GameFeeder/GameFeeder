# Setting up the bot <!-- omit in toc -->

This document will guide you through

This guide is meant to be beginner-friendly. If you run into any problems during the setup or if you have suggestions to improve this guide, please open an [issue on GitHub](https://github.com/GameFeeder/GameFeeder/issues/new/choose) and we will be happy to help you out.

## Index

- [Index](#index)
- [Local setup](#local-setup)
  - [Prerequisites](#prerequisites)
  - [Configuration](#configuration)
  - [API Keys](#api-keys)
    - [Discord Bot](#discord-bot)
    - [Telegram Bot](#telegram-bot)
    - [Reddit API](#reddit-api)
  - [Test the setup](#test-the-setup)
- [Docker containers](#docker-containers)
  - [Using the VSCode Dev Container](#using-the-vscode-dev-container)
  - [Using the production-ready Docker image \& Docker Compose](#using-the-production-ready-docker-image--docker-compose)

## Local setup

### Prerequisites

Before we can start, you first need a couple of programs and tools:

- We suggest to use [Visual Studio Code](https://code.visualstudio.com/) (*VS Code*) as code editor.
- We use [git](https://git-scm.com/) as version-control system. Ensure that *git* is installed by running `git --version` in a terminal.
- We use [node.js](https://nodejs.org/en/) as runtime environment. Take a look the `engines.node` field in [`package.json`](package.json) to see which version you need. Ensure that *node.js* is installed by running `node --version` in a terminal.
- We use [yarn](https://classic.yarnpkg.com/en/docs/install) as package manager. Please do not use *npm*! Take a look the `engines.yarn` field in [`package.json`](package.json) to see which version you need. Ensure that *yarn* is installed by runnning `yarn --version` in a terminal.

### Configuration

The next step is to configure the bot according to your needs. First, you need to download the project from GitHub. To do that run one of the following commands in the terminal, in a folder where you want to save the project:

```bash
# Clone the project using HTTPS:
$ git clone https://github.com/GameFeeder/GameFeeder.git
# Clone the project using SSH:
$ git clone git@github.com:GameFeeder/GameFeeder.git
```

This will create a new `GameFeeder` folder that you should open in *VS Code*. You should now install the recommended extensions (*VS Code* might ask you for it, otherwise navigate to the extension tab to install them).

Now, open the *VS Code* terminal and execute `yarn install` to install all packages you need to run the bot. After that, you can start the bot for the first time using `yarn dev`. The `Init Manager` will then setup the configuration and data files that you need. We use [nodemon](https://nodemon.io/) to automatically restart the bot when it crashes or when you made any changes to the code, so the bot will restart and warn you that API keys are missing. We will add those in the next section.

But first, take some time to get familiar with the configuration files. The files are in JSON format and some of them are `.example` files. Do not modify these files! The `.example` files serve as template for the `Init Manager` and get uploaded on GitHub.

The `config` folder contains files that configure the behaviour of the bot. In `config/api_config.json` you can configure the settings for the different APIs and enable or disable bot clients. In `config/updater_config.json` you can change the behaviour of the updater, e.g. the delay between each update cycle. For debugging, consider setting `autosave` to `false`. This will disable the bot to write the last time it checked for updates to the `data` files, so every time you restart the bot, it will provide you with fresh updates. Furthermore, the `games` folder contains one configuration file for each supported game. Here you can change the providers for each game. Changes in that folder will get uploaded to GitHub.

The `data` folder saves data that will change while the bot is running. In `data/subscriber_data.json`, the subscriptions and custom prefixes of each channel are stored. `data/updater_data.json` stores information such as the time of the last update.

### API Keys

Several features of the bot, such as the different messenger clients and reddit updates need API keys to work. However, you will only need to acquire the keys for the features you want to use. To disable one of the features, you can just leave the `token` fields empty or set `enabled` to `false`.

> **Important**: Never share your API keys with anyone! Make sure to never add your API tokens and secrets to the `.example` files, as they are uploaded to GitHub!

#### Discord Bot

You will need to create a Discord bot if you want to test out the Discord notification functionalities.

To do that, first follow [this](https://discordpy.readthedocs.io/en/latest/discord.html) tutorial to create an application with a bot. This will provide you with a bot token. Copy & paste that in the `config/api_config.json`, in the `bots.discord.token` field. Make sure to take the bot's token and not the application's client secret, it won't work otherwise.

Some commands require the `OWNER` role. To access those, you need to add your userID as a string to `config/api_config.json` in the `bots.discord.owners` array.
To find out your ID, you can follow [this](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) guide or use the `debug` command of our bot.

#### Telegram Bot

You will need to create a Telegram bot if you want to test out the Telegram notification functionalities.

To do that, first follow [this](https://core.telegram.org/bots#3-how-do-i-create-a-bot) tutorial to create the bot. This will give you a token. Copy & paste that in the `config/api_config.json`, in the `bots.telegram.token` field.

Some commands require the `OWNER` role. To access those, you need to add your userID as a string to `config/api_config.json` in the `bots.telegram.owners` array.
To find out your ID, you can use [@get_id_bot](https://telegram.me/get_id_bot) or use the `debug` command of our bot.

#### Reddit API

You will need to register for the Reddit API to be able to test out the Reddit post polling.

To do that,

- Create an app for the bot, following [these](https://github.com/reddit-archive/reddit/wiki/OAuth2#getting-started) steps (choose "web app" as type),
- Register for the API, using [this](https://docs.google.com/forms/d/e/1FAIpQLSezNdDNK1-P8mspSbmtC2r86Ee9ZRbC66u929cG2GX0T9UMyw/viewform) document,
- Get a refresh token, using [this](https://not-an-aardvark.github.io/reddit-oauth-helper/) generator. You need `history` and `read` permissions.

After following these steps, you should have `clientID`, `clientSecret`, `refreshToken` and your `userName`. Copy & paste all of them in `config/api_config.json`, in the corresponding fields in the `reddit` object.

### Test the setup

The bot should now work! You can now test the setup by inviting the bot client of your choice and sending it the `start` command (`!start` on Discord, `/start` on Telegram).

## Docker containers

You can use Docker containers in order to run the bot without worrying about other system dependencies. The only requirement is [Docker Engine](https://docs.docker.com/install/) 18.06.0+.

### Using the VSCode Dev Container

> Location: `/.devcontainer/Dockerfile`

This is meant to be used as a dev container. VSCode can utilize this automatically. For more information check out the [official VSCode guide](https://code.visualstudio.com/docs/remote/containers) on developing inside a container.

If you are using Windows, you can also leverage the WSL with no further configuration necessary. Just follow the steps described [here](https://code.visualstudio.com/docs/remote/wsl).

### Using the production-ready Docker image & Docker Compose

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
