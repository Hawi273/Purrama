// scripts/release.mjs: the import map versions every module, the CSP hash
// matches the inline script, and the committed index.html is current.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { buildRelease } from '../scripts/release.mjs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('committed index.html is current with the source files', () => {
  assert.equal(buildRelease(html).html, html, 'run: npm run release');
});

test('every module is in the import map with the same version as the entry and styles', () => {
  const { html: out, version } = buildRelease(html);
  const map = JSON.parse(/<script type="importmap">([\s\S]*?)<\/script>/.exec(out)?.[1] ?? '{}');
  for (const file of ['./config.js', './src/main.js', './src/pages/title.js', './src/ui/dom.js']) {
    assert.equal(map.imports[file], `${file}?v=${version}`);
  }
  assert.ok(out.includes(`src/main.js?v=${version}"`));
  assert.ok(out.includes(`styles/app.css?v=${version}"`));
});

test('the CSP hash allows exactly the inline import map', () => {
  const { html: out } = buildRelease(html);
  const script = /<script type="importmap">([\s\S]*?)<\/script>/.exec(out)?.[1] ?? '';
  const sha = createHash('sha256').update(script).digest('base64');
  assert.ok(out.includes(`script-src 'self' 'sha256-${sha}'`));
  assert.equal((out.match(/'sha256-/g) ?? []).length, 1);
});
