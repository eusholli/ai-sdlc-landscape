// Window events that connect header buttons to overlays mounted elsewhere (search palette,
// compare sheet). Keeping them as events means the header never imports those overlays.
export const OPEN_SEARCH_EVENT = "landscape:open-search";
export const OPEN_COMPARE_EVENT = "landscape:open-compare";

export const TOAST_EVENT = "landscape:toast";

export const emit = (name: string): void => {
  window.dispatchEvent(new CustomEvent(name));
};

/** Show a short message in the toast region mounted in the site layout. */
export const notify = (message: string): void => {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
};
