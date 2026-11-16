// Local static server for the site (same files GitHub Pages serves).
// Usage: npm run dev:site  →  http://localhost:8000
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8000;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};
// Never serve tooling, secrets or dependencies, even locally.
const blocked = /(^|[\\/])(\.git|\.dev\.vars|\.env|node_modules|\.wrangler|\.gstack)([\\/]|$)/;

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  let file = path.join(root, pathname);
  if (!file.startsWith(root) || blocked.test(path.relative(root, file))) {
    res.writeHead(404); res.end(); return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Purrama site on http://localhost:${port}`));
