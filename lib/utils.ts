import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;

  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

/** Smooth-scroll within the wizard's overflow column, not only the document. */
export function smoothScrollElementIntoView(
  element: HTMLElement,
  options?: { behavior?: ScrollBehavior; offset?: number }
) {
  const behavior = options?.behavior ?? 'smooth';
  const offset = options?.offset ?? 0;
  const scrollParent = getScrollParent(element);

  if (!scrollParent) {
    element.scrollIntoView({ behavior, block: 'start' });
    return;
  }

  const top =
    scrollParent.scrollTop +
    (element.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top) +
    offset;

  scrollParent.scrollTo({ top, behavior });
}

/** Align an element's bottom edge with the scrollport bottom (wizard accordion expand). */
export function smoothScrollElementToViewportBottom(
  element: HTMLElement,
  options?: { behavior?: ScrollBehavior; offset?: number; onlyScrollDown?: boolean }
) {
  const behavior = options?.behavior ?? 'smooth';
  const offset = options?.offset ?? 0;
  const scrollParent = getScrollParent(element);

  if (!scrollParent) {
    element.scrollIntoView({ behavior, block: 'end' });
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const scrollRect = scrollParent.getBoundingClientRect();
  let top = scrollParent.scrollTop + (elementRect.bottom - scrollRect.bottom) + offset;

  if (options?.onlyScrollDown) {
    top = Math.max(scrollParent.scrollTop, top);
  }

  const maxScroll = scrollParent.scrollHeight - scrollParent.clientHeight;
  scrollParent.scrollTo({ top: Math.min(Math.max(0, top), maxScroll), behavior });
}
