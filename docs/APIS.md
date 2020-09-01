# APIs

This documents aims to collect information about the APIs that we use for the bot.

## Steam Web API

The Steam Web API is used to retrieve updates posted to Steam.
Specifically, we use the [_GetNewsForApp_](https://developer.valvesoftware.com/wiki/Steam_Web_API#GetNewsForApp_.28v0002.29) GET request.
This request does not require an API key.

According to [Terms of Use](https://steamcommunity.com/dev/apiterms), the The API is limited to 100,000 calls per day.
That's about 4,166 per hour, 69 per minute or 1 per second.
