import fs from 'node:fs';
import path from 'node:path';
import { textContent } from 'src/markup/ast.js';
import {
  bold,
  cell,
  code,
  doc,
  heading,
  link,
  list,
  listItem,
  paragraph,
  quote,
  row,
  separator,
  table,
} from 'src/markup/build.js';
import limitDocument, { fitDocument } from 'src/markup/limit.js';
import renderDiscord from 'src/markup/renderers/discord.js';
import renderTelegram from 'src/markup/renderers/telegram.js';
import parseBBCode from 'src/steam/bbcode/index.js';

const FIXTURE_DIR = path.resolve('tests/fixtures/steam');

const FIXTURES = fs
  .readdirSync(FIXTURE_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();

function fixtureTree(name: string) {
  const post = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, `${name}.json`), 'utf8'));

  return parseBBCode(post.contents);
}

/** Whether every emphasis marker Discord reads has a partner. */
function hasBalancedDiscordMarkers(rendered: string): boolean {
  const bare = rendered.replace(/```[\s\S]*?```/g, '').replace(/\\./g, '');

  return (['\\*\\*', '__', '~~', '\\|\\|'] as const).every(
    (marker) => (bare.match(new RegExp(marker, 'g')) ?? []).length % 2 === 0,
  );
}

/** Whether every entity marker Telegram reads has a partner. */
function hasBalancedTelegramMarkers(rendered: string): boolean {
  const outsideCode = rendered.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const outsideLinks = outsideCode.replace(/\[[^\]]*\]\([^)]*\)/g, '');

  return (
    (outsideLinks.match(/\*/g) ?? []).length % 2 === 0 &&
    (outsideLinks.match(/_/g) ?? []).length % 2 === 0
  );
}

/** Whether a link is whole, i.e. never cut halfway through. */
function hasWholeLinks(rendered: string): boolean {
  const withoutLinks = rendered.replace(/\[[^\]]*\]\([^)\s]*\)/g, '');

  return !withoutLinks.includes('](');
}

describe('Markup truncation', () => {
  describe('limitDocument', () => {
    test('should leave a document that already fits untouched', () => {
      const tree = doc(paragraph('short'));

      expect(limitDocument(tree, 100)).toBe(tree);
    });

    test('should drop the blocks that do not fit', () => {
      const tree = doc(paragraph('aaaa'), paragraph('bbbb'), paragraph('cccc'));

      // 4 + 2 for the blank line + 4, and one more for the indicator.
      expect(limitDocument(tree, 11)).toEqual(doc(paragraph('aaaa'), paragraph('bbbb…')));
    });

    test('should charge the indicator against the budget', () => {
      const tree = doc(paragraph('aaaa'), paragraph('bbbb'), paragraph('cccc'));

      expect(textContent(limitDocument(tree, 10)).length).toBeLessThanOrEqual(10);
    });

    test('should keep the text within the budget', () => {
      const tree = doc(paragraph('a'.repeat(500)));

      expect(textContent(limitDocument(tree, 100)).length).toBeLessThanOrEqual(100);
    });

    test('should cut a paragraph at a sentence boundary', () => {
      const tree = doc(paragraph('One sentence. Two sentence. Three sentence.'));

      expect(textContent(limitDocument(tree, 30))).toBe('One sentence. Two sentence.…');
    });

    test('should cut at a word boundary when no sentence fits', () => {
      const tree = doc(paragraph('alpha bravo charlie delta echo'));
      const result = textContent(limitDocument(tree, 20));

      expect(result).toBe('alpha bravo charlie…');
    });

    test('should mark the cut', () => {
      const tree = doc(paragraph('a'.repeat(50)), paragraph('dropped'));

      expect(textContent(limitDocument(tree, 20))).toContain('…');
    });

    test('should never cut inside a link', () => {
      const tree = doc(paragraph('some text ', link('https://example.com', 'a long label here')));
      const result = limitDocument(tree, 14);

      expect(textContent(result)).not.toContain('a long label');
    });

    test('should keep the whole list items that fit', () => {
      const tree = doc(list(listItem('aaaa'), listItem('bbbb'), listItem('cccc')));
      const result = limitDocument(tree, 13);

      expect(result).toEqual(doc(list(listItem('aaaa'), listItem('bbbb')), paragraph('…')));
    });

    test('should keep a code block whole or not at all', () => {
      const tree = doc(paragraph('lead in'), code('x'.repeat(100)));

      expect(limitDocument(tree, 30)).toEqual(doc(paragraph('lead in…')));
    });

    test('should reach inside a quote', () => {
      const tree = doc(quote({}, paragraph('aaaa'), paragraph('bbbb'), paragraph('cccc')));
      const result = limitDocument(tree, 10);

      expect(textContent(result)).not.toContain('cccc');
      expect(result.children[0].type).toBe('quote');
    });

    test('should keep the whole table rows that fit', () => {
      const tree = doc(table(row(cell('aaaa')), row(cell('bbbb')), row(cell('cccc'))));
      const result = limitDocument(tree, 11);

      expect(textContent(result)).not.toContain('cccc');
    });

    test('should cut inside emphasis without losing it', () => {
      const tree = doc(paragraph(bold('alpha bravo charlie delta')));
      const result = limitDocument(tree, 14);

      // The emphasis survives around what is left, and the mark sits outside it.
      expect(result).toEqual(doc(paragraph(bold('alpha bravo'), '…')));
    });

    test('should produce an empty document for a budget of nothing', () => {
      expect(limitDocument(doc(paragraph('anything')), 0)).toEqual(doc());
    });

    test('should drop a separator rather than end on one', () => {
      const tree = doc(paragraph('aaaa'), separator(), heading(1, 'a heading that will not fit'));

      expect(limitDocument(tree, 6)).toEqual(doc(paragraph('aaaa…')));
    });
  });

  describe('fitDocument', () => {
    const render = (tree: Parameters<typeof renderDiscord>[0]) =>
      renderDiscord(tree, { masked: true });

    test('should return the whole render when it already fits', () => {
      const tree = doc(paragraph('short'));

      expect(fitDocument(tree, render, 100)).toBe('short');
    });

    test('should fit the rendered string, not its text', () => {
      // The markers and the URL count against a messenger's limit too.
      const tree = doc(paragraph(link('https://example.com/a/very/long/path', 'label')));

      expect(fitDocument(tree, render, 20).length).toBeLessThanOrEqual(20);
    });

    test('should keep as much as the limit allows', () => {
      const tree = doc(paragraph('a'.repeat(50)), paragraph('b'.repeat(50)));
      const result = fitDocument(tree, render, 60);

      expect(result.length).toBeLessThanOrEqual(60);
      expect(result.length).toBeGreaterThan(40);
    });

    test('should cope with a limit nothing can fit', () => {
      const tree = doc(paragraph(link('https://example.com/very/long', 'label')));

      expect(fitDocument(tree, render, 5).length).toBeLessThanOrEqual(5);
    });
  });

  describe.each(FIXTURES)('against the %s post', (name) => {
    const tree = fixtureTree(name);
    // Enough budgets to cross every kind of boundary in a real post.
    const budgets = [16, 32, 64, 100, 250, 500, 1000, 2000, 3000, 4096];

    test.each(budgets)('should stay within a budget of %i', (budget) => {
      expect(textContent(limitDocument(tree, budget)).length).toBeLessThanOrEqual(budget);
    });

    test.each(budgets)('should say that it was shortened at %i', (budget) => {
      const limited = limitDocument(tree, budget);

      // A post short enough to fit is returned as it is, and says nothing.
      if (limited !== tree) {
        // Otherwise a cut post is indistinguishable from a complete one.
        expect(textContent(limited)).toContain('…');
      }
    });

    test.each(budgets)('should leave Discord markup intact at %i', (budget) => {
      const rendered = renderDiscord(limitDocument(tree, budget), { masked: true });

      expect(hasBalancedDiscordMarkers(rendered)).toBe(true);
      expect(hasWholeLinks(rendered)).toBe(true);
      expect(rendered).not.toMatch(/^>+$/m);
    });

    test.each(budgets)('should leave Telegram markup intact at %i', (budget) => {
      // An unpaired marker is a rejected message, not a cosmetic glitch.
      const rendered = renderTelegram(limitDocument(tree, budget));

      expect(hasBalancedTelegramMarkers(rendered)).toBe(true);
      expect(hasWholeLinks(rendered)).toBe(true);
    });

    test.each([2000, 4096])('should fit a hard limit of %i exactly', (limit) => {
      expect(
        fitDocument(tree, (t) => renderDiscord(t, { masked: true }), limit).length,
      ).toBeLessThanOrEqual(limit);
      expect(fitDocument(tree, renderTelegram, limit).length).toBeLessThanOrEqual(limit);
    });
  });
});
