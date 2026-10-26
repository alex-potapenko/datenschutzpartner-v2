import { Suspense } from 'react';
import { LoginLayoutShell } from './_components/LoginLayoutShell';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  void children;
  return (
    <Suspense fallback={null}>
      <LoginLayoutShell />
    </Suspense>
  );
}
