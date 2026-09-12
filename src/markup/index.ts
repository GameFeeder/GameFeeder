/** The shared markup model.
 *
 * Every news source is parsed into the tree defined by `ast.ts`, and every
 * messenger client renders that tree into its own flavor. Nothing formatted
 * passes between the two as a string, so no formatting is lost on the way and
 * each client is free to make its own decisions about how to say things.
 */

export * from './ast.js';
export * from './build.js';
export * from './escape.js';
export type { LimitOptions } from './limit.js';
export { default as limitDocument, fitDocument } from './limit.js';
export * as limits from './limits.js';
export { default as normalize } from './normalize.js';
export type { DiscordRenderOptions } from './renderers/discord.js';
export { default as renderDiscord } from './renderers/discord.js';
export type { PlainRenderOptions } from './renderers/plain.js';
export { default as renderPlain } from './renderers/plain.js';
export type { TelegramRenderOptions } from './renderers/telegram.js';
export { default as renderTelegram } from './renderers/telegram.js';
