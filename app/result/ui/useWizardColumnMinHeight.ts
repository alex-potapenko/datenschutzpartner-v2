'use client';

import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { getScrollParent } from '@/lib/utils';

const LAYOUT_SETTLE_MS = 320;
const TRANSITION_RECHECK_MS = 250;

function measureColumnMinHeight(element: HTMLElement, scrollParent: HTMLElement | null) {
  if (!scrollParent) return '';

  const scrollRect = scrollParent.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const minHeight = Math.ceil(scrollRect.bottom - elementRect.top);

  return minHeight > 0 ? `${minHeight}px` : '';
}

/** Keep wizard side borders reaching the scrollport bottom as conditional sections expand. */
export function useWizardColumnMinHeight(
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList = []
) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const scrollParent = getScrollParent(element);
    let frame = 0;
    const timeouts: number[] = [];
    let transitionRecheckTimeout: number | undefined;

    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = ref.current;
        if (!current) return;

        const parent = getScrollParent(current);
        // Drop stale min-height so shrinking content (e.g. collapsed accordions) can reflow.
        current.style.minHeight = '';
        void current.offsetHeight;

        const next = measureColumnMinHeight(current, parent);
        if (current.style.minHeight !== next) {
          current.style.minHeight = next;
        }
      });
    };

    const scheduleTransitionRecheck = () => {
      if (transitionRecheckTimeout !== undefined) {
        window.clearTimeout(transitionRecheckTimeout);
      }
      transitionRecheckTimeout = window.setTimeout(() => {
        transitionRecheckTimeout = undefined;
        apply();
      }, TRANSITION_RECHECK_MS);
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target instanceof Element && !currentContainsTarget(element, event.target)) {
        return;
      }

      if (
        event.propertyName === 'grid-template-rows' ||
        event.propertyName === 'height' ||
        event.propertyName === 'max-height'
      ) {
        apply();
        scheduleTransitionRecheck();
      }
    };

    apply();

    const resizeObserver = new ResizeObserver(() => {
      apply();
      scheduleTransitionRecheck();
    });
    resizeObserver.observe(element);
    if (scrollParent) {
      resizeObserver.observe(scrollParent);
    }

    window.addEventListener('resize', apply);
    scrollParent?.addEventListener('scroll', apply, { passive: true });
    element.addEventListener('transitionend', onTransitionEnd);

    for (const delay of [0, 150, LAYOUT_SETTLE_MS]) {
      timeouts.push(window.setTimeout(apply, delay));
    }

    return () => {
      cancelAnimationFrame(frame);
      if (transitionRecheckTimeout !== undefined) {
        window.clearTimeout(transitionRecheckTimeout);
      }
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', apply);
      scrollParent?.removeEventListener('scroll', apply);
      element.removeEventListener('transitionend', onTransitionEnd);
      element.style.minHeight = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit layoutKey deps
  }, deps);
}

function currentContainsTarget(root: HTMLElement, target: EventTarget) {
  return target instanceof Node && root.contains(target);
}
