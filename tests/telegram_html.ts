/** Checks that a message is one Telegram's `HTML` parse mode accepts.
 *
 * Anything it rejects is a hard API error that loses the whole message, so this
 * is the invariant that keeps messages deliverable.
 */

/** The attributes each supported tag may carry. */
const TAG_ATTRIBUTES: Record<string, RegExp> = {
  b: /^$/,
  i: /^$/,
  u: /^$/,
  s: /^$/,
  'tg-spoiler': /^$/,
  a: /^ href="[^"<>&]*(?:&(?:amp|lt|gt|quot);[^"<>&]*)*"$/,
  code: /^(?: class="language-[^"<>&]*")?$/,
  pre: /^$/,
  blockquote: /^(?: expandable)?$/,
};

const TOKEN = /<(\/?)([a-z-]*)([^>]*)>|&([^;\s]*;)?|[<>]/g;

const ENTITIES = new Set(['amp;', 'lt;', 'gt;', 'quot;']);

/** Describes the first problem with the message, or `undefined` if there is none. */
export function telegramHtmlProblem(html: string): string | undefined {
  const stack: string[] = [];

  for (const match of html.matchAll(TOKEN)) {
    const [token, closing, name, attributes, entity] = match;

    if (token.startsWith('&')) {
      if (!entity || !ENTITIES.has(entity)) {
        return `unknown entity at ${match.index}`;
      }
      continue;
    }
    if (token === '<' || token === '>') {
      return `bare ${token} at ${match.index}`;
    }
    if (!(name in TAG_ATTRIBUTES)) {
      return `unsupported tag ${token}`;
    }
    const parent = stack[stack.length - 1];

    if (closing) {
      if (attributes !== '' || parent !== name) {
        return `unbalanced ${token}`;
      }
      stack.pop();
      continue;
    }
    if (!TAG_ATTRIBUTES[name].test(attributes)) {
      return `bad attributes on ${token}`;
    }
    if (parent === 'code' || (parent === 'pre' && name !== 'code')) {
      return `${token} inside <${parent}>`;
    }
    if ((name === 'a' || name === 'blockquote') && stack.includes(name)) {
      return `nested ${token}`;
    }
    stack.push(name);
  }
  return stack.length > 0 ? `unclosed <${stack[stack.length - 1]}>` : undefined;
}

/** Whether Telegram's `HTML` parse mode accepts the message. */
export function isValidTelegramHtml(html: string): boolean {
  return telegramHtmlProblem(html) === undefined;
}
