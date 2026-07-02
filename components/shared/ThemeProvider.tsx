'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * next-themes injects an inline <script> to prevent theme flash before hydration.
 * React 19 warns about script tags inside client components during hydration.
 * On the client, mark the script as non-executable — SSR already ran it in the HTML.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const scriptProps =
    typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

  return (
    <NextThemesProvider {...props} scriptProps={scriptProps}>
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from 'next-themes';
