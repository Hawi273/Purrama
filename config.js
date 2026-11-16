// Where the site finds the API proxy (worker/). No keys or tokens belong here:
// this file is public on GitHub Pages.
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = LOCAL
  ? 'http://localhost:8787'
  : 'https://purrama-api.YOUR-SUBDOMAIN.workers.dev'; // set after `wrangler deploy`
