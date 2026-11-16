import { API_BASE } from './config.js';

const IMG_BASE = 'https://image.tmdb.org/t/p/w342';
const STORE_KEY = 'purrama:ratings:v1';
const STARS = 5;

const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const heading = document.getElementById('heading');
const form = document.getElementById('search');
const input = document.getElementById('q');
const tabs = document.querySelectorAll('[data-view]');

// ---- Ratings (localStorage) ------------------------------------------------

function loadRatings() {
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function saveRatings() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(ratings));
  } catch {
    statusEl.textContent = 'Could not save your rating in this browser.';
  }
}

let ratings = loadRatings();

function setRating(movie, value) {
  if (!value) delete ratings[movie.id];
  else {
    ratings[movie.id] = {
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date || '',
      poster_path: movie.poster_path || null,
      rating: value,
      ratedAt: Date.now(),
    };
  }
  saveRatings();
}

// ---- API -------------------------------------------------------------------

async function api(path, params = {}) {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) url.searchParams.set(key, value);
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// ---- Rendering (textContent only: TMDB text is never parsed as HTML) -------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function posterUrl(path) {
  return typeof path === 'string' && /^\/[\w.-]+$/.test(path) ? IMG_BASE + path : null;
}

function starRow(movie) {
  const row = el('div', 'stars');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', `Your rating for ${movie.title}`);
  const current = ratings[movie.id]?.rating || 0;
  for (let i = 1; i <= STARS; i++) {
    const star = el('button', 'star', i <= current ? '★' : '☆');
    star.type = 'button';
    star.setAttribute('aria-label', `${i} of ${STARS}`);
    star.setAttribute('aria-pressed', String(i === current));
    star.addEventListener('click', () => {
      setRating(movie, i === current ? 0 : i);
      if (currentView === 'mine') showMine();
      else row.replaceWith(starRow(movie));
    });
    row.append(star);
  }
  return row;
}

function card(movie) {
  const item = el('li', 'card');
  const src = posterUrl(movie.poster_path);
  if (src) {
    const img = el('img', 'poster');
    img.src = src;
    img.alt = `Poster for ${movie.title}`;
    img.loading = 'lazy';
    img.width = 342;
    img.height = 513;
    item.append(img);
  } else {
    item.append(el('div', 'poster placeholder', 'No poster'));
  }
  const body = el('div', 'card-body');
  body.append(el('h3', 'title', movie.title || 'Untitled'));
  const year = (movie.release_date || '').slice(0, 4);
  if (year) body.append(el('p', 'year', year));
  body.append(starRow(movie));
  item.append(body);
  return item;
}

function render(movies, emptyText) {
  grid.replaceChildren(...movies.map(card));
  statusEl.textContent = movies.length ? '' : emptyText;
}

// ---- Views -----------------------------------------------------------------

let currentView = 'trending';
let requestId = 0;

function setView(view, title) {
  currentView = view;
  heading.textContent = title;
  for (const tab of tabs) tab.setAttribute('aria-pressed', String(tab.dataset.view === view));
}

async function load(view, title, path, params) {
  setView(view, title);
  const id = ++requestId;
  statusEl.textContent = 'Loading…';
  grid.replaceChildren();
  try {
    const data = await api(path, params);
    if (id !== requestId) return; // a newer request replaced this one
    render(Array.isArray(data.results) ? data.results : [], 'No movies found.');
  } catch (err) {
    if (id !== requestId) return;
    statusEl.textContent = `Could not load movies. ${err.message}`;
  }
}

function showTrending() {
  return load('trending', 'Trending this week', '/trending/movie/week');
}

function showMine() {
  requestId++;
  setView('mine', 'My ratings');
  const mine = Object.values(ratings).sort((a, b) => b.ratedAt - a.ratedAt);
  render(mine, 'You have not rated any movies yet.');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) load('search', `Results for “${query}”`, '/search/movie', { query, include_adult: 'false' });
});

for (const tab of tabs) {
  tab.addEventListener('click', () => (tab.dataset.view === 'mine' ? showMine() : showTrending()));
}

window.addEventListener('storage', (event) => {
  if (event.key === STORE_KEY) {
    ratings = loadRatings();
    if (currentView === 'mine') showMine();
  }
});

showTrending();
