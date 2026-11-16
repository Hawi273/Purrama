// Listeners a page adds to long-lived objects (the library, window) are tied
// to the page's AbortSignal, so they are removed when the visitor navigates.

let controller = new AbortController();

/** Start a new page: aborts everything the previous page registered. */
export function newPage() {
  controller.abort();
  controller = new AbortController();
  return controller.signal;
}

/** The current page's signal. */
export function pageSignal() {
  return controller.signal;
}
