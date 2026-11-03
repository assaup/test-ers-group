// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = join(import.meta.dirname, '../src');
const tokensPath = join(srcDir, 'styles/tokens.css');

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

const definedTokens = new Set(
  [...readFileSync(tokensPath, 'utf8').matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]),
);

// Guards the convention "colors, spacing and radii only through tokens" (agents/conventions.md)
describe('design tokens', () => {
  const components = cssFiles(srcDir).filter((path) => path !== tokensPath);

  it('finds the stylesheets', () => {
    expect(components.length).toBeGreaterThan(0);
  });

  it.each(components.map((path) => [relative(srcDir, path), path]))(
    '%s only uses defined tokens',
    (_name, path) => {
      const css = readFileSync(path, 'utf8');
      const used = [...css.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]);

      expect(used.filter((token) => !definedTokens.has(token))).toEqual([]);
    },
  );

  it.each(components.map((path) => [relative(srcDir, path), path]))(
    '%s has no hard-coded colors',
    (_name, path) => {
      const css = readFileSync(path, 'utf8');

      expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi) ?? []).toEqual([]);
    },
  );

  it('defines a dark variant for every color token', () => {
    const tokens = readFileSync(tokensPath, 'utf8');
    const [light = '', dark = ''] = tokens.split('@media (prefers-color-scheme: dark)');
    const names = (css: string) =>
      new Set([...css.matchAll(/(--(?:color|dept)-[\w-]+)\s*:/g)].map((match) => match[1]));

    expect([...names(light)].filter((name) => !names(dark).has(name))).toEqual([]);
  });
});
