/** Milliseconds from a CSS time such as "280ms" or ".28s" (build tools may rewrite one as the other). */
export function cssMs(value: string) {
  const text = value.trim();
  const number = parseFloat(text);
  if (!Number.isFinite(number)) return 0;
  return text.endsWith("ms") ? number : text.endsWith("s") ? number * 1000 : number;
}

/** Reads a duration token (e.g. "--duration-travel") in milliseconds from an element; the tokens resolve to 0 under reduced motion. */
export function tokenMs(element: Element, name: string) {
  return cssMs(getComputedStyle(element).getPropertyValue(name));
}
