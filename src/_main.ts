import bots from './bots';
import { games } from './game';
import { updater } from './updater';

// Register commands
bots.forEach((bot) => {
  const botPrefix = `${bot.prefix}`;

  // Test
  bot.registerCommand(new RegExp(`${botPrefix}test`), (channel) => {
    bot.logDebug('Command: Test.');
    bot.sendMessageToChannel(channel,
      'Test!\n*Italic*\n**Bold**\n[Link](https://github.com/TimJentzsch/valveGamesAnnouncerBot)');
  });

  // About
  bot.registerCommand(new RegExp(`${botPrefix}about`), (channel) => {
    bot.logDebug('Command: About.');
    const gitLink = `https://github.com/TimJentzsch/valveGamesAnnouncerBot`;
    bot.sendMessageToChannel(channel, `A notification bot for Valve's games. Learn more on [GitHub](${gitLink}).`);
  });

  // Subscribe
  bot.registerCommand(new RegExp(`${botPrefix}sub(scribe)?(?<alias>.*)`), (channel, match: any) => {
    bot.logDebug('Command: Subscribe.');

    let { alias } = match.groups;
    alias = alias.trim();

    for (const game of games) {
      if (game.hasAlias(alias)) {
        if (bot.addSubscriber(channel, game)) {
          bot.sendMessageToChannel(channel,
            `You are now subscribed to the **${game.label}** feed!`);
        } else {
          bot.sendMessageToChannel(channel,
            `You have already subscribed to the **${game.label}** feed!`);
        }
        break;
      }
    }
  });

  // Unsubscribe
  bot.registerCommand(new RegExp(`${bot.prefix}unsub(scribe)?(?<alias>.*)`),
                     (channel, match: any) => {
    bot.logDebug('Command: Unsubscribe.');

    let { alias } = match.groups;
    alias = alias.trim();

    for (const game of games) {
      if (game.hasAlias(alias)) {
        if (bot.removeSubscriber(channel, game)) {
          bot.sendMessageToChannel(channel,
            `You are now unsubscribed from the **${game.label}** feed!`);
        } else {
          bot.sendMessageToChannel(channel,
            `You have never subscribed to the **${game.label}** feed in the first place!`);
        }
        break;
      }
    }
  });
});

// Start bots
bots.forEach((bot) => {
  if (bot.start()) {
    bot.logInfo('Started bot.');
  } else {
    bot.logWarn('Bot did not start. Did you provide a token in "bot_config.json"?');
  }
});

// Start updater
updater.start();
