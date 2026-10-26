'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type LoginDevStep = 'email' | 'password' | 'totp' | 'magic_link_sent';

export type AdminLoginBypassCredentials = {
  email: string;
  password: string;
};

type LoginDevContextValue = {
  step: LoginDevStep;
  setStep: (step: LoginDevStep) => void;
  prototypeMagicLinkReady: boolean;
  setPrototypeMagicLinkReady: (ready: boolean) => void;
  prototypeMagicLinkUrl: string | null;
  setPrototypeMagicLinkUrl: (url: string | null) => void;
  adminLoginBypass: AdminLoginBypassCredentials | null;
  setAdminLoginBypass: (credentials: AdminLoginBypassCredentials | null) => void;
  /** MSW forgot-password success — setup link shown in the login footer. */
  prototypePasswordSetupUrl: string | null;
  setPrototypePasswordSetupUrl: (url: string | null) => void;
};

const LoginDevContext = createContext<LoginDevContextValue | null>(null);

export function LoginDevProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<LoginDevStep>('email');
  const [prototypeMagicLinkReady, setPrototypeMagicLinkReady] = useState(false);
  const [prototypeMagicLinkUrl, setPrototypeMagicLinkUrl] = useState<string | null>(null);
  const [adminLoginBypass, setAdminLoginBypass] = useState<AdminLoginBypassCredentials | null>(
    null
  );
  const [prototypePasswordSetupUrl, setPrototypePasswordSetupUrl] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      step,
      setStep,
      prototypeMagicLinkReady,
      setPrototypeMagicLinkReady,
      prototypeMagicLinkUrl,
      setPrototypeMagicLinkUrl,
      adminLoginBypass,
      setAdminLoginBypass,
      prototypePasswordSetupUrl,
      setPrototypePasswordSetupUrl,
    }),
    [
      step,
      prototypeMagicLinkReady,
      prototypeMagicLinkUrl,
      adminLoginBypass,
      prototypePasswordSetupUrl,
    ]
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
