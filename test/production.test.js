// What ships to production must not carry local-development leftovers:
// the page's CSP and the deployed Worker's allowed origins are production-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const toml = fs.readFileSync(new URL('../worker/wrangler.toml', import.meta.url), 'utf8');

test('production CSP allows only the production Worker', () => {
  const connect = /connect-src ([^;"]+)/.exec(html)?.[1]?.trim();
  assert.equal(connect, 'https://purrama-api.syzmon-hawajski.workers.dev');
  assert.doesNotMatch(html, /localhost|127\.0\.0\.1/);
});

test('the deployed Worker allows only the GitHub Pages origin', () => {
  // Top-level [vars] is what `wrangler deploy` (no --env) ships; [env.dev] is local only.
  const topLevel = toml.split(/^\[env\./m)[0] ?? '';
  const origins = /ALLOWED_ORIGINS\s*=\s*"([^"]*)"/.exec(topLevel)?.[1];
  assert.equal(origins, 'https://hawi273.github.io');
});
