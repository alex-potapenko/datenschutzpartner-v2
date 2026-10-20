'use client';

import { useCallback, useEffect, useRef } from 'react';
import { smoothScrollElementToViewportBottom } from '@/lib/utils';

/** Extra space below the draft row after auto-scroll (account content padding). */
const AFFILIATE_DRAFT_SCROLL_BOTTOM_OFFSET_PX = 32;

/** After the link/voucher draft row mounts (and height animation finishes), scroll it to the bottom of the scrollport. */
export function useAffiliateDraftScrollIntoView(isDrafting: boolean, reduceMotion: boolean | null) {
  const draftRef = useRef<HTMLDivElement>(null);
  const isDraftingRef = useRef(isDrafting);

  useEffect(() => {
    isDraftingRef.current = isDrafting;
  }, [isDrafting]);

  const scrollDraftIntoView = useCallback(() => {
    if (!isDraftingRef.current) return;
    const el = draftRef.current;
    if (!el) return;
    smoothScrollElementToViewportBottom(el, {
      behavior: reduceMotion ? 'instant' : 'smooth',
      onlyScrollDown: true,
      offset: AFFILIATE_DRAFT_SCROLL_BOTTOM_OFFSET_PX,
    });
  }, [reduceMotion]);

  useEffect(() => {
    if (!isDrafting || !reduceMotion) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(scrollDraftIntoView);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [isDrafting, reduceMotion, scrollDraftIntoView]);

  return { draftRef, onDraftAnimationComplete: scrollDraftIntoView };
}
