/*
  Purrama — tiny behaviour helpers (no dependencies, ~1 KB).
  Everything here is optional: the CSS works without it.

  - Filter chips:  <button class="pr-chip" aria-pressed="false">Horror</button>  toggles on click.
  - Star input:    <span class="pr-stars" role="group"> with five <button>s  becomes a working rating.
                   Fires a "purrama:rate" event ({ detail: { value } }) on the group.
                   A Mochi (svg.pm) in the same card reacts: 4–5 stars → rated, 3 → blink, 1–2 → sad.
  - Purrama.mochi(el, 'wave')   switch a Mochi's animation from your own code.
  - Purrama.setTheme('daylight' | 'midnight')   switch theme on <html>.
*/
(function () {
  var MOCHI = ['idle', 'blink', 'sleep', 'tail', 'wave', 'curious', 'hop', 'rated', 'love',
               'look', 'loading', 'peek', 'sad', 'popcorn', 'night'];

  function mochi(el, anim) {
    if (!el || MOCHI.indexOf(anim) < 0) return;
    el.setAttribute('class', 'pm pm--' + anim);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'daylight' ? 'daylight' : 'midnight');
  }

  document.addEventListener('click', function (e) {
    var chip = e.target.closest('button.pr-chip[aria-pressed]');
    if (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      return;
    }
    var star = e.target.closest('.pr-stars[role="group"] button');
    if (star) {
      var group = star.closest('.pr-stars');
      var buttons = Array.prototype.slice.call(group.querySelectorAll('button'));
      var value = buttons.indexOf(star) + 1;
      buttons.forEach(function (b, i) {
        b.classList.toggle('is-on', i < value);
        b.setAttribute('aria-pressed', i === value - 1 ? 'true' : 'false');
      });
      var box = group.closest('.pr-card, section, article');
      var cat = box && box.querySelector('svg.pm');
      if (cat) mochi(cat, value >= 4 ? 'rated' : value <= 2 ? 'sad' : 'blink');
      group.dispatchEvent(new CustomEvent('purrama:rate', { bubbles: true, detail: { value: value } }));
    }
  });

  window.Purrama = { mochi: mochi, setTheme: setTheme, animations: MOCHI.slice() };
})();
