# Contributing to this project <!-- omit in toc -->

First of, thanks for your help!

In most cases, you will need to setup the bot locally to contribute to this project. To do this, visit our in-depth [setup guide](SETUP.md).

## Index

- [Index](#index)
- [Debugging and configurations](#debugging-and-configurations)
- [Testing](#testing)

## Debugging and configurations

To test out the bot in development, use the `yarn dev` command. The bot will try to make sure that the `config/` and `data/` files are up-to-date and launch all enabled bots and the updater. The bot will restart on any `config/` or code changes.

Several `config/` changes are recommended for testing and debugging:

- In `config/updater_config.json`:
  - Setting `autosave` to `false` will reset the updater date on restart. This way you can configure a `lastUpdate` date in `data/updater_data.json` for your testing needs without it being overwritten by the updater
  - It might be necessary to increase the `limit` to test out an older update
  - If your work is unrelated to the updater, you can disable it by setting `enabled` to `false`
- In `api_config.json`:
  - You can disable one of the bots or reddit updates by setting its `enabled` value to `false`

To test out the bot's functionality, we recommend to try the following steps:

- Use the `start` command to test basic command functionality
- Make sure you are subscribed to a game (`subscribe` or `sub`) and start the updater. Make sure you receive the notifications

## Testing

You can use `yarn test` to run the unit tests to make sure that you didn't break anything. Please provide unit tests for your code if applicable.
