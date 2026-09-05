import { isKnownTag, tagSpec } from './tags.js';

/** A run of literal text. */
export type TextToken = {
  kind: 'text';
  value: string;
};

/** An opening tag, e.g. `[b]`, `[url=...]` or `[img src="..."]`. */
export type OpenToken = {
  kind: 'open';
  /** The lower case name of the tag. */
  name: string;
  /** The value of the `[tag=value]` form, with any quotes removed. */
  value?: string;
  /** The attributes of the `[tag key="value"]` form, keyed by lower case name. */
  attrs: Map<string, string>;
  /** The exact source of the tag, so that it can be restored verbatim. */
  raw: string;
};

/** A closing tag, e.g. `[/b]`. */
export type CloseToken = {
  kind: 'close';
  /** The lower case name of the tag. */
  name: string;
  /** The exact source of the tag, so that it can be restored verbatim. */
  raw: string;
};

export type Token = TextToken | OpenToken | CloseToken;

/** Tags longer than this are treated as literal text. */
const MAX_TAG_LENGTH = 2048;

type TagMatch = {
  token: OpenToken | CloseToken;
  /** The index just past the closing bracket. */
  end: number;
};

function isNameStart(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}

function isNameChar(char: string): boolean {
  return isNameStart(char) || (char >= '0' && char <= '9');
}

function isAttrNameChar(char: string): boolean {
  return isNameChar(char) || char === '-' || char === '_' || char === ':' || char === '.';
}

function isSpace(char: string): boolean {
  return char === ' ' || char === '\t';
}

/** Reads a quoted value, returning the value and the index just past the closing quote. */
function readQuoted(input: string, start: number): { value: string; end: number } | null {
  const quote = input[start];
  const end = input.indexOf(quote, start + 1);

  if (end === -1) {
    return null;
  }
  const value = input.slice(start + 1, end);

  // A tag never spans lines, so an unterminated quote must not swallow the rest of the post.
  if (value.includes('\n')) {
    return null;
  }
  return { value, end: end + 1 };
}

/** Reads the attribute list of an opening tag, up to and including the closing bracket. */
function readAttributes(input: string, start: number, attrs: Map<string, string>): number | null {
  let index = start;

  for (;;) {
    while (isSpace(input[index])) {
      index += 1;
    }
    if (input[index] === ']') {
      return index + 1;
    }
    if (index >= input.length || input[index] === '\n') {
      return null;
    }

    // Attribute name
    const nameStart = index;
    while (index < input.length && isAttrNameChar(input[index])) {
      index += 1;
    }
    if (index === nameStart) {
      return null;
    }
    const name = input.slice(nameStart, index).toLowerCase();

    // Optional value
    let value = '';
    while (isSpace(input[index])) {
      index += 1;
    }
    if (input[index] === '=') {
      index += 1;
      while (isSpace(input[index])) {
        index += 1;
      }
      if (input[index] === '"' || input[index] === "'") {
        const quoted = readQuoted(input, index);
        if (!quoted) {
          return null;
        }
        value = quoted.value;
        index = quoted.end;
      } else {
        const valueStart = index;
        while (index < input.length && !isSpace(input[index]) && input[index] !== ']') {
          if (input[index] === '\n') {
            return null;
          }
          index += 1;
        }
        value = input.slice(valueStart, index);
      }
    }
    attrs.set(name, value);
  }
}

/** Attempts to read a tag starting at the given `[`. Returns null if there is none. */
function readTag(input: string, start: number): TagMatch | null {
  let index = start + 1;
  const closing = input[index] === '/';

  if (closing) {
    index += 1;
  }

  // Tag name
  let name: string;
  if (input[index] === '*') {
    name = '*';
    index += 1;
  } else {
    const nameStart = index;
    if (!isNameStart(input[index] ?? '')) {
      return null;
    }
    while (index < input.length && isNameChar(input[index])) {
      index += 1;
    }
    name = input.slice(nameStart, index).toLowerCase();
  }

  // Unknown names are prose, not markup: `[YOUR NAME]`, `[count=100]`, `[MEDIA=youtube]`.
  if (!isKnownTag(name)) {
    return null;
  }

  if (closing) {
    while (isSpace(input[index])) {
      index += 1;
    }
    if (input[index] !== ']') {
      return null;
    }
    const end = index + 1;
    return { token: { kind: 'close', name, raw: input.slice(start, end) }, end };
  }

  const attrs = new Map<string, string>();
  let value: string | undefined;
  let end: number;

  if (input[index] === ']') {
    end = index + 1;
  } else if (input[index] === '=') {
    // The `[tag=value]` form, e.g. `[url=https://x]`, `[url="https://x"]`, `[previewyoutube=id;full]`.
    index += 1;
    if (input[index] === '"' || input[index] === "'") {
      const quoted = readQuoted(input, index);
      if (!quoted) {
        return null;
      }
      value = quoted.value;
      index = quoted.end;

      // A quoted value may be followed by attributes, as in
      // `[url="https://..." style="pill" buttoncolor="#ffe800"]`.
      if (input[index] === ']') {
        end = index + 1;
      } else {
        const attrEnd = readAttributes(input, index, attrs);
        if (attrEnd === null) {
          return null;
        }
        end = attrEnd;
      }
    } else {
      const valueEnd = input.indexOf(']', index);
      if (valueEnd === -1) {
        return null;
      }
      value = input.slice(index, valueEnd).trim();
      if (value.includes('\n')) {
        return null;
      }
      end = valueEnd + 1;
    }
  } else if (isSpace(input[index])) {
    const attrEnd = readAttributes(input, index, attrs);
    if (attrEnd === null) {
      return null;
    }
    end = attrEnd;
  } else {
    return null;
  }

  if (end - start > MAX_TAG_LENGTH) {
    return null;
  }
  return { token: { kind: 'open', name, value, attrs, raw: input.slice(start, end) }, end };
}

/** Finds the closing tag of a raw tag such as `[code]`, ignoring case. */
function findRawCloser(input: string, start: number, name: string): number {
  const needle = `[/${name}]`;
  return input.toLowerCase().indexOf(needle, start);
}

/** Splits a Steam BBCode post into a flat sequence of text and tag tokens.
 *
 * The scan is a single linear pass. A `[` that does not begin a known tag is
 * emitted as literal text, which is what keeps bracketed prose intact.
 *
 * @param input - The raw `contents` of a Steam news item.
 */
export default function tokenize(input: string): Token[] {
  const source = input.replace(/\r\n?/g, '\n');
  const tokens: Token[] = [];
  let pending = '';
  let index = 0;

  const flush = (): void => {
    if (pending) {
      tokens.push({ kind: 'text', value: pending });
      pending = '';
    }
  };

  while (index < source.length) {
    if (source[index] !== '[') {
      pending += source[index];
      index += 1;
      continue;
    }

    const match = readTag(source, index);
    if (!match) {
      pending += '[';
      index += 1;
      continue;
    }

    flush();
    tokens.push(match.token);
    index = match.end;

    // The body of a raw tag is captured verbatim, without scanning for tags.
    const spec = tagSpec(match.token.name);
    if (match.token.kind === 'open' && spec?.kind === 'raw') {
      const closer = findRawCloser(source, index, match.token.name);
      const bodyEnd = closer === -1 ? source.length : closer;
      const body = source.slice(index, bodyEnd);

      if (body) {
        tokens.push({ kind: 'text', value: body });
      }
      if (closer === -1) {
        index = source.length;
      } else {
        index = closer + match.token.name.length + 3;
        tokens.push({ kind: 'close', name: match.token.name, raw: `[/${match.token.name}]` });
      }
    }
  }
  flush();

  return tokens;
}
