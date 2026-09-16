'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type LoginDevStep = 'email' | 'password' | 'totp' | 'magic_link_sent';

type LoginDevContextValue = {
  step: LoginDevStep;
  setStep: (step: LoginDevStep) => void;
};

const LoginDevContext = createContext<LoginDevContextValue | null>(null);

export function LoginDevProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<LoginDevStep>('email');

  const value = useMemo(
    () => ({
      step,
      setStep,
    }),
    [step]
  );

  return <LoginDevContext.Provider value={value}>{children}</LoginDevContext.Provider>;
}

export function useLoginDev() {
  const context = useContext(LoginDevContext);
  if (!context) {
    throw new Error('useLoginDev must be used within LoginDevProvider');
  }
  return context;
}

/** Optional hook for layout chrome that may render outside the form tree. */
export function useLoginDevOptional() {
  return useContext(LoginDevContext);
}
