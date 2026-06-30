/**
 * Icon seam. App code imports icons from '@/components/ui' — never from
 * '@phosphor-icons/*' directly (enforced by lint). Swap the icon pack here.
 *
 * Uses the /ssr entry so icons render in Server Components without 'use client'.
 */
export * from '@phosphor-icons/react/dist/ssr';
