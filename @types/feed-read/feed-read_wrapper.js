// De-spaghettify the object mess for proper TS typing
const feed = require('feed-read');

function parseURL(url, callback) { feed(url, callback); }
function parseRSS(rss_string, callback) { feed.rss(rss_string, callback); }
function parseAtom(atom_string, callback) { feed.atom(atom_string, callback); }

export default FeedReader = { parseURL, parseRSS, parseAtom };
