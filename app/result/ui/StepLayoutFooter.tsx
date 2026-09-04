'use client';

import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';

type SetLayoutFooter = (footer: ReactNode | null) => void;

const StepLayoutFooterContext = createContext<SetLayoutFooter | null>(null);

export function useStepLayoutFooterHoist(content: ReactNode) {
  const setLayoutFooter = useContext(StepLayoutFooterContext);

  useLayoutEffect(() => {
    if (!setLayoutFooter) return;
    setLayoutFooter(content);
    return () => {
      setLayoutFooter(null);
    };
  }, [setLayoutFooter, content]);
}

export const StepLayoutFooterContextProvider = StepLayoutFooterContext.Provider;

export function useStepLayoutFooterContext() {
  return useContext(StepLayoutFooterContext);
}
