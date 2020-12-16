# Changelog

### v0.17.4
- Fixed Steam image and video formatting

### v0.17.3
- Fixed `!games` sorting

### v0.17.2
- Added new games:
  - Fall Guys: Ultimate Knockout
  - Cyberpunk 2077

### v0.17.1
- Fixed tagging and CI workflow

### v0.17.0
- Added pubsub between updater and bots

### v0.16.3
- Updated Typescript to 4.1
- Updated node-html-parser to 2.0
- Multiple other package updates

### v0.16.2
- Fixed Steam API formatting
- Added Steam post content to notifications
- Updated `turndown` to 7.0.0

### v0.16.1
- Removed all circular dependencies
- Added check for circular dependencies in CI flow

### v0.16.0
- Renamed dota updater to dota_patches
- Refactored providers to not need updaters to function
- Added dota_patches change migration

### v0.15.6
- Moved try-catch block to main instead of start
- Added padding between class methods linter rule

### v0.15.5
- Added 7 more games:
  - Among Us
  - Dead by Daylight
  - Forager
  - Hades
  - Microsoft Flight Simulator 2020
  - Minecraft
  - Rainbow Six Siege

### v0.15.4
- Replaced telegram-node-api with telegraf

### v0.15.3
- Replaced cheerio with node-html-parser

### v0.15.2
- Replaced request and axios with node-fetch

### v0.15.1

### v0.15.0
- Changed last update to be saved per provider

### v0.14.3
- Switched to GitHub registry
- Added codecov integration

### v0.14.2
- Limited Discord embed titles if they exceed the maximum length

### v0.14.1
- Added shorthand for constructor properties

### v0.14.0
- Split updater per provider for better throttling

### v0.13.11

### v0.13.10
- Added 7 new games:
  - Cities: Skylines
  - Civilization VI
  - Dead Cells
  - Don't Starve Together
  - Payday 2
  - PUBG
  - Risk of Rain 2
  - Stardew Valley
- Changed the CS:GO label to Counter-Strike: Global Offensive

### v0.13.9
- Added new game: Veloren

### v0.13.8
- Added new game: Satisfactory

### v0.13.7
- Changed the Artifact Steam provider to the 2.0 Beta

### v0.13.6
- Fixed files not being created

### v0.13.5
- Fixed bug with unsubscribed users

### v0.13.4
- Updated dependencies

### v0.13.3
- Limited Reddit error messages to 5000 characters

### v0.13.2
- Fixed multiline command arguments not working

### v0.13.1
- Changed the host of the game icons to Imgur to ensure persistence

### v0.13.0
- Add messages to a queue before sending them to avoid hitting the
  telegram API rate limit
- Retry sending messages for failed attempts up to max retries
- After max retries have been reached, disable the subscriber
- Skip sending automated messages to subscribers
- Re-enable subscriber if he sends any command

### v0.12.2
- Fixed label command when providing wrong bot

### v0.12.1
- Added the Dota Underlords Steam feed as a provider

### v0.12.0
- Ops - Added games inside the image

### v0.11.1

### v0.11.0
- Added support for the SteamWeb API and added the Steam blogs for Artifact and Factorio

### v0.10.3
- Added support for the Discord presence, showing the bot's current version

### v0.10.2
- Removed removing channel data on Telegram errors while sending messages
- Adjusted channel label format

### v0.10.1
- Removed Telegram permission check when sending notifications
- Added `label <bot name> <channel id> <channel label>` command to add custom labels to channels for easier debugging

### v0.10.0
- Restructured commands. Commands can now be grouped in command groups for easier organization and default actions

### v0.9.5
- Upgraded packages

### v0.9.4
- Fix handling for `400` and `403` errors when sending a message to Telegram chats

### v0.9.3
- Change bot messages to be sent synchronously to avoid hitting the API limit

### v0.9.2
- Changed /u/TheZett title filter on /r/DotA2 from 'Update' to 'Dota 2 Update' per their request

### v0.9.1
- Updated packages
- Updated contribution guidelines
- Adjusted Dota providers to catch more updates

### v0.9.0

### v0.8.5
- Added `ping`, `debug` and `telegramCmd` commands
- Improved permission and error handling
  - Check for writing permissions before sending messages
  - Remove data from channels that got deleted or removed the bot permissions

### v0.8.4

### v0.8.3
- Greatly improved performance:
  - Do provider updates asynchronously
  - Do game updates asynchronously
  - Start bots asynchronously
  - Register commands asynchronously
  - Do reddit updates asynchronously
- In total, an update cycle got improved from 10 seconds to 1.5 seconds.

### v0.8.2

### v0.8.1
- Fixed user count returning `NaN` when the bot has been removed from a Telegram channel.

### v0.8.0
- Added `stats` command to display bot statistics
- Added `flip` command to flip a coin
- Added `roll` command to roll some dice
- Avoid duplicate reddit posts
- Filter out deleted reddit posts

### v0.7.6

### v0.7.5

### v0.7.4

### v0.7.3

### v0.7.2

### v0.7.1
- Fixed RSS HTML to MD conversion throwing an error on empty content

### v0.7.0
- Improved scripts and hooks
- Reworked game configuration
- Made reddit provider field in game config optional
- Added config option to disable reddit updates
- Improved Steam Blog formatting

### v0.6.4

### v0.6.3

### v0.6.2

### v0.6.1

### v0.6.0
- Added new game: Factorio
- Fixed notification commands only sending the first paragraph
- Added indicator to cut off messages

### v0.5.4

### v0.5.3

### v0.5.2

### v0.5.1

### v0.5.0
- Updated the bot naming across the project

### v0.4.0
- Improved markdown formatting for both Discord and Telegram
- Implemented Telegram Instant View templates

### v0.3.1

### v0.3.0

### v0.2.5

### v0.2.4

### v0.2.3

### v0.2.2

### v0.2.1

### v0.2.0

### v0.1.5

### v0.1.4

### v0.1.3

### v0.1.2

### v0.1.1

### v0.1.0
