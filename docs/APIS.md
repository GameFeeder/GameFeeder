# APIs <!-- omit in toc -->

This documents aims to collect information about the APIs that we use for the bot.

## Contents <!-- omit in toc -->

- [Telegram Bot API](#telegram-bot-api)
  - [Rate Limit](#rate-limit)
- [Discord Bot API](#discord-bot-api)
  - [Rate Limit](#rate-limit-1)
- [Steam Web API](#steam-web-api)
  - [Rate Limit](#rate-limit-2)
- [Reddit API](#reddit-api)
  - [Rate Limit](#rate-limit-3)

## Telegram Bot API

The [Telegram Bot API](https://core.telegram.org/bots/api) is used to interact with Telegram.

### Rate Limit

The rate limit is partially specified in the [FAQ](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this).

Sending messages inside a particular chat (bursts allowed):

| Day    | Hour  | Minute | Second |
| ------ | ----- | ------ | ------ |
| 86,400 | 3,600 | 60     | **1**  |

Sending bulk notifications to multiple users (should be spread out):

| Day       | Hour    | Minute | Second |
| --------- | ------- | ------ | ------ |
| 2,592,000 | 108,000 | 1,800  | **30** |

Sending messages to the same group:

| Day    | Hour  | Minute | Second |
| ------ | ----- | ------ | ------ |
| 28,800 | 1,200 | **20** | 0.3    |

## Discord Bot API

The [Discord Bot API](https://discord.com/developers/docs/intro) is used to interact with Discord.

### Rate Limit

The rate limit is specified in the [Developer Documentation](https://discord.com/developers/docs/topics/rate-limits).
They are sent in the API response headers.

## Steam Web API

The [Steam Web API](https://steamcommunity.com/dev) is used to retrieve updates posted to Steam.
Specifically, we use the [GetNewsForApp](https://developer.valvesoftware.com/wiki/Steam_Web_API#GetNewsForApp_.28v0002.29) GET request.
This request does not require an API key.

### Rate Limit

The rate limit is specified in the [Terms of Use](https://steamcommunity.com/dev/apiterms).

| Day         | Hour    | Minute | Second |
| ----------- | ------- | ------ | ------ |
| **100,000** | 4,166.7 | 69.4   | 1.2    |

## Reddit API

The [Reddit API](https://www.reddit.com/dev/api) is used to retrieve updates posted to Reddit.

### Rate Limit

The rate limit is specified in the [Rules](https://github.com/reddit-archive/reddit/wiki/API#rules).

| Day    | Hour  | Minute | Second |
| ------ | ----- | ------ | ------ |
| 86,400 | 3,600 | **60** | 1      |
