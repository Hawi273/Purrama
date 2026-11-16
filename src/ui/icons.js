// Line icons drawn to the kit's rules: 24px grid, 2.2px stroke, round caps
// and joins, current text colour. Search, heart and profile are the kit's own
// paths; the rest follow the same style.

const SVG = 'http://www.w3.org/2000/svg';

/** @type {Record<string, string[]>} path data per icon; "c:cx,cy,r" draws a circle */
const PATHS = {
  search: ['c:11,11,7', 'M20 20l-4-4'],
  heart: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  user: ['c:12,8,4', 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'],
  home: ['M3.5 11 12 4l8.5 7', 'M6 9.5V20h12V9.5', 'M10 20v-5h4v5'],
  film: ['M4 5h16v14H4z', 'M8 5v14', 'M16 5v14', 'M4 9.5h4', 'M4 14.5h4', 'M16 9.5h4', 'M16 14.5h4'],
  tv: ['M3.5 7h17v12h-17z', 'M8.5 3l3.5 4 3.5-4'],
  compass: ['c:12,12,8.5', 'M15.5 8.5l-2 5-5 2 2-5z'],
  bookmark: ['M7 4h10v16l-5-4-5 4z'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  share: ['c:18,5.5,2.5', 'c:6,12,2.5', 'c:18,18.5,2.5', 'M8.2 10.8l7.6-4.1', 'M8.2 13.2l7.6 4.1'],
  play: ['M8 5.5v13l11-6.5z'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  left: ['M15 5l-7 7 7 7'],
  right: ['M9 5l7 7-7 7'],
  down: ['M5 9l7 7 7-7'],
  back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  library: ['M5 4v16', 'M10 4v16', 'M14.5 4.5l4.5 15'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  sparkle: ['M12 3v5', 'M12 16v5', 'M3 12h5', 'M16 12h5'],
};

/**
 * @param {string} name
 * @param {{ size?: number, label?: string, class?: string }} [options]
 * @returns {SVGSVGElement}
 */
export function icon(name, options = {}) {
  const { size = 20, label, class: className } = options;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', `icon${className ? ` ${className}` : ''}`);
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  for (const d of PATHS[name] ?? []) {
    if (d.startsWith('c:')) {
      const [cx = '0', cy = '0', r = '0'] = d.slice(2).split(',');
      const circle = document.createElementNS(SVG, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      svg.appendChild(circle);
    } else {
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    }
  }
  return svg;
}

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.2 6.6L12 17.4l-5.8 3.2 1.2-6.6L2.5 9.4l6.6-.8z';

/** The kit's rating star (the only filled icon). @returns {SVGSVGElement} */
export function starIcon() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', STAR);
  svg.appendChild(path);
  return svg;
}
