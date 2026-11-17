// Header "Your library" menu: which list is current.

/** Mark the current list in the "Your library" menu ("" for none). @param {string} tab */
export function highlightLibraryTab(tab) {
  for (const link of document.querySelectorAll('[data-nav-tab]')) {
    if (/** @type {HTMLElement} */ (link).dataset.navTab === tab) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
