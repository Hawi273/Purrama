// Person profile: photo, biography, facts, known for, and credits split into
// acting, directing and other crew work.

import { h, mount } from '../ui/dom.js';
import { chip, filmRow, longDate, titleCard, yearOf, sectionHead } from '../ui/components.js';
import { rail } from '../ui/rail.js';
import { errorState } from '../ui/feedback.js';
import { imageUrl } from '../api/images.js';
import * as tmdb from '../api/tmdb.js';
import { href } from '../router.js';
import { setMeta, uniqueBy } from './common.js';
import { pageSignal } from '../ui/lifecycle.js';

/** @typedef {import('../router.js').Route} Route */
/** @typedef {import('../api/types.js').PersonCredit} PersonCredit */

/**
 * @param {HTMLElement} main
 * @param {Route} route
 */
export async function render(main, route) {
  const id = Number(route.params.id);
  const signal = pageSignal(); // aborted if the visitor navigates away while this loads
  /** @type {import('../api/types.js').PersonDetails} */
  let person;
  try {
    person = await tmdb.person(id);
    if (signal.aborted) return;
  } catch (error) {
    if (signal.aborted) return;
    setMeta('Not found');
    mount(main, h('div', { class: 'container page' }, errorState(error, () => render(main, route), 'this person')));
    return;
  }
  setMeta(person.name, person.biography || `${person.name} on purrama: films and series.`);

  const cast = person.combined_credits?.cast ?? [];
  const crew = person.combined_credits?.crew ?? [];
  const photo = imageUrl(person.profile_path, 'profile', 'lg');
  const initials = person.name.split(/\s+/).map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();

  // Known for: their most-voted titles in their main department.
  const main_ = person.known_for_department === 'Acting' ? cast : crew.filter((c) => c.department === person.known_for_department);
  const knownFor = uniqueBy([...main_].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)), (c) => `${c.media_type}:${c.id}`).slice(0, 12);

  const age = ageOf(person.birthday, person.deathday);
  /** @type {[string, string][]} */
  const facts = /** @type {[string, string][]} */ ([
    ['Known for', person.known_for_department ?? ''],
    ['Born', [longDate(person.birthday), age && !person.deathday ? `(age ${age})` : ''].filter(Boolean).join(' ')],
    ['Died', [longDate(person.deathday), age && person.deathday ? `(aged ${age})` : ''].filter(Boolean).join(' ')],
    ['Place of birth', person.place_of_birth ?? ''],
    ['Credits', `${uniqueBy([...cast, ...crew], (c) => `${c.media_type}:${c.id}`).length}`],
  ]).filter(([, v]) => v && v !== '0');

  const bio = person.biography?.trim() ?? '';
  const bioText = h('p', { class: 'bio', text: bio || `TMDB has no biography for ${person.name} yet.` });
  const long = bio.length > 600;
  if (long) bioText.classList.add('bio--clamped');
  const bioToggle = long ? h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--sm', 'aria-expanded': 'false', text: 'Read more' }) : null;
  bioToggle?.addEventListener('click', () => {
    const open = bioText.classList.toggle('bio--clamped') === false;
    bioToggle.setAttribute('aria-expanded', String(open));
    bioToggle.textContent = open ? 'Show less' : 'Read more';
  });

  mount(main, h('div', { class: 'container page page--person' },
    h('article', { class: 'pr-card pr-card--hero person-hero', 'aria-labelledby': 'person-name' },
      h('div', { class: 'person-hero__photo' }, photo
        ? h('img', { class: 'pr-poster', src: photo, alt: `Photo of ${person.name}`, width: 260, height: 390, fetchpriority: 'high' })
        : h('div', { class: 'pr-poster poster-missing', role: 'img', 'aria-label': `No photo of ${person.name}` }, h('span', { text: initials }))),
      h('div', { class: 'person-hero__body' },
        h('p', { class: 'eyebrow', text: person.known_for_department ?? 'Person' }),
        h('h1', { class: 'title-hero__name', id: 'person-name', text: person.name }),
        facts.length ? h('dl', { class: 'person-facts' }, ...facts.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])) : null,
        bioText, bioToggle)),
    knownFor.length ? rail({ title: 'Known for', load: async () => knownFor.map((c) => titleCard(c, c.media_type, { save: true })) }) : null,
    credits(cast, crew)));
}

/** @param {string | null | undefined} birth @param {string | null | undefined} death */
function ageOf(birth, death) {
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return 0;
  const end = death && /^\d{4}-\d{2}-\d{2}$/.test(death) ? new Date(`${death}T00:00:00`) : new Date();
  const start = new Date(`${birth}T00:00:00`);
  let age = end.getFullYear() - start.getFullYear();
  if (end < new Date(end.getFullYear(), start.getMonth(), start.getDate())) age -= 1;
  return age > 0 && age < 130 ? age : 0;
}

/** @param {PersonCredit} c */
const dateOfCredit = (c) => c.release_date || c.first_air_date || '';

/**
 * Credits with tabs: Acting, Directing, and other crew departments.
 * @param {PersonCredit[]} cast
 * @param {PersonCredit[]} crew
 */
function credits(cast, crew) {
  /** @type {Map<string, PersonCredit[]>} */
  const groups = new Map();
  if (cast.length) groups.set('Acting', cast);
  const directing = crew.filter((c) => c.department === 'Directing');
  if (directing.length) groups.set('Directing', directing);
  for (const c of crew) {
    if (c.department === 'Directing' || !c.department) continue;
    groups.set(c.department, [...(groups.get(c.department) ?? []), c]);
  }
  if (!groups.size) return null;

  const tabs = h('div', { class: 'chips', role: 'group', 'aria-label': 'Credit type' });
  const list = h('ul', { class: 'rows' });
  let current = [...groups.keys()][0] ?? 'Acting';
  const paint = () => {
    tabs.replaceChildren(...[...groups.entries()].map(([name, items]) => chip(`${name} ${uniqueBy(items, (c) => `${c.media_type}:${c.id}`).length}`, name === current, () => { current = name; paint(); })));
    // One row per title; several jobs on one title are joined.
    /** @type {Map<string, { credit: PersonCredit, roles: string[] }>} */
    const merged = new Map();
    for (const c of groups.get(current) ?? []) {
      const key = `${c.media_type}:${c.id}`;
      const entry = merged.get(key) ?? { credit: c, roles: [] };
      const role = c.character || c.job || '';
      if (role && !entry.roles.includes(role)) entry.roles.push(role);
      merged.set(key, entry);
    }
    const rows = [...merged.values()].sort((a, b) => {
      const da = dateOfCredit(a.credit) || '9999';
      const db = dateOfCredit(b.credit) || '9999';
      return db.localeCompare(da); // newest first, undated (announced) at the top
    });
    list.replaceChildren(...rows.map(({ credit, roles }) => filmRow({
      url: href(`/${credit.media_type}/${credit.id}`),
      posterPath: credit.poster_path,
      title: credit.title ?? credit.name ?? 'Untitled',
      meta: [yearOf(dateOfCredit(credit)) || 'Upcoming', credit.media_type === 'tv' ? 'Series' : 'Film',
        roles.slice(0, 2).join(', '), credit.episode_count ? `${credit.episode_count} ep.` : ''].filter(Boolean).join(' · '),
    })));
  };
  paint();
  return h('section', { class: 'section', 'aria-labelledby': 'credits-title' },
    sectionHead('Credits', { id: 'credits-title' }), tabs, list);
}
