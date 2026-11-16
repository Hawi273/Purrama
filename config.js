// Where the site finds the API proxy (worker/). No keys or tokens belong here:
// this file is public on GitHub Pages.
const host = typeof location === 'undefined' ? '' : location.hostname;
const LOCAL = host === 'localhost' || host === '127.0.0.1';

export const API_BASE = LOCAL
  ? 'http://127.0.0.1:8787'
  : 'https://purrama-api.syzmon-hawajski.workers.dev';
