/** The nearest ancestor that scrolls vertically, or null for the page. */
export function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/** The visible band of a scroller in viewport coordinates: its top edge and height (the window when null). */
export function viewOf(scroller: HTMLElement | null) {
  if (!scroller) return { top: 0, height: window.innerHeight };
  return { top: scroller.getBoundingClientRect().top + scroller.clientTop, height: scroller.clientHeight };
}
