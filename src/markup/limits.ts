/** The character limits each messenger imposes.
 *
 * Collected here because they are the budget that truncation works against, and
 * because getting them wrong is invisible until a real post is long enough to
 * hit one.
 */

/** The longest a plain Discord message may be. */
export const DISCORD_MESSAGE = 2000;

/** The longest an embed's title may be. */
export const DISCORD_EMBED_TITLE = 256;

/** The longest an embed's description may be. */
export const DISCORD_EMBED_DESCRIPTION = 4096;

/** The longest an embed's author name may be. */
export const DISCORD_EMBED_AUTHOR = 256;

/** The longest an embed's footer may be. */
export const DISCORD_EMBED_FOOTER = 2048;

/** The most characters an embed may contain across *all* of its fields.
 *
 * Discord rejects the whole embed on this sum, so limiting each field on its
 * own is not enough.
 */
export const DISCORD_EMBED_TOTAL = 6000;

/** The longest a Telegram message may be. */
export const TELEGRAM_MESSAGE = 4096;
