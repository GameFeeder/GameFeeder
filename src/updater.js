const RSS = require('./rss');
const Discord = require('./discord');

let doUpdate = true;
const updaterDelay = 10 * 1000; // 10 second delay
let lastUpdate = new Date('2018-12-01');

/** @description Execute one update circle. */
async function update() {
  console.debug('[Updater] Starting update.');
  const feed = new RSS.Feed('http://blog.dota2.com/feed/', 'New blog post!');
  await feed.init(lastUpdate, 5);
  // Update last update date
  lastUpdate = Date.now();
  Discord.notifySubs('dota', feed);
}

/** @description Executes the update method as long as updates are enabled. */
async function updater() {
  console.debug('[Updater] Update circle...');
  if (doUpdate) {
    update();
    setTimeout(() => {
      updater();
    }, updaterDelay);
  }
}

/** @description Start the updater. */
async function start() {
  console.log('[Updater] Starting updater.');
  doUpdate = true;
  setTimeout(() => {
    updater();
  }, 2000);
}

module.exports = {
  start,
};
