// Version every module, stylesheet and the entry script in index.html so a
// browser never runs a new page with JS or CSS cached from an older release
// (GitHub Pages lets browsers cache files for 10 minutes; there is no build).
//
// The version is a hash of the files' contents, so it only changes when they do.
// - An import map (inline, allowed by its sha256 in the CSP) maps every module
//   URL to "<url>?v=<hash>", which also covers relative and dynamic imports.
// - The stylesheet and entry links get the same ?v=.
//
// Usage:  npm run release          rewrite index.html
//         node scripts/release.mjs --check   exit 1 if index.html is out of date (used by npm run check)
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');

/** @param {string} dir @returns {string[]} repo-relative posix paths */
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return walk(rel);
    return entry.name.endsWith('.js') ? [rel] : [];
  });
}

export function buildRelease(html) {
  const modules = ['config.js', ...walk('src')].sort();
  const styles = ['styles/purrama.css', 'styles/app.css'];
  const hash = createHash('sha256');
  for (const file of [...modules, ...styles]) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(root, file)).toString().replace(/\r\n/g, '\n'));
  }
  const version = hash.digest('hex').slice(0, 10);

  const imports = Object.fromEntries(modules.map((file) => [`./${file}`, `./${file}?v=${version}`]));
  const mapJson = JSON.stringify({ imports }, null, 2).split('\n').map((line, i) => (i ? `    ${line}` : line)).join('\n');
  const scriptText = `\n    ${mapJson}\n  `;
  const sha = createHash('sha256').update(scriptText).digest('base64');

  let out = html.replace(/<!-- importmap:start -->[\s\S]*?<!-- importmap:end -->/,
    `<!-- importmap:start -->\n  <script type="importmap">${scriptText}</script>\n  <!-- importmap:end -->`);
  out = out.replace(/script-src 'self'( 'sha256-[A-Za-z0-9+/=]+')?/, `script-src 'self' 'sha256-${sha}'`);
  out = out.replace(/(href="styles\/[\w-]+\.css)(\?v=[\w]+)?"/g, `$1?v=${version}"`);
  out = out.replace(/(src="src\/main\.js)(\?v=[\w]+)?"/, `$1?v=${version}"`);
  return { html: out, version, modules: modules.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const current = fs.readFileSync(indexPath, 'utf8');
  if (!current.includes('<!-- importmap:start -->')) {
    console.error('index.html has no <!-- importmap:start --> marker.');
    process.exit(1);
  }
  const { html, version, modules } = buildRelease(current);
  if (process.argv.includes('--check')) {
    if (html !== current) {
      console.error('index.html is out of date with the source files. Run: npm run release');
      process.exit(1);
    }
    console.log(`index.html is current (v=${version}, ${modules} modules).`);
  } else {
    fs.writeFileSync(indexPath, html);
    console.log(`index.html updated: v=${version}, ${modules} modules versioned.`);
  }
}
