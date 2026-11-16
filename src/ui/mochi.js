// Mochi, the Purrama cat, from the kit's self-contained animated SVGs
// (assets/mascot). The files stop animating under prefers-reduced-motion.

import { h } from './dom.js';

/** @typedef {'idle'|'blink'|'sleep'|'tail'|'wave'|'curious'|'hop'|'rated'|'love'|'look'|'loading'|'peek'|'sad'|'popcorn'|'night'} MochiMood */

/**
 * @param {MochiMood} mood
 * @param {number} size
 * @param {string} [label]  what he's doing, for screen readers; omit when decorative
 */
export function mochi(mood, size, label) {
  return h('img', {
    class: 'mochi',
    src: `assets/mascot/mochi-${mood}.svg`,
    width: size,
    height: size,
    alt: label ?? '',
    'aria-hidden': label ? undefined : 'true',
    decoding: 'async',
  });
}
