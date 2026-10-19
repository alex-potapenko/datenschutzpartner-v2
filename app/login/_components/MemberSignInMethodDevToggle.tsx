'use client';

import type { Key } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { MemberSignInMethod } from '@/api/account';
import { useDevMemberSignInMethod, useSetDevMemberSignInMethod } from '@/api/auth';
import { Tabs, cn } from '@/components/ui';

function parseMemberSignInMethod(key: Key): MemberSignInMethod | null {
  if (key === 'magic_link' || key === 'password') return key;
  return null;
}

export function MemberSignInMethodDevToggle({ className }: { className?: string }) {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const { data } = useDevMemberSignInMethod();
  const setMethod = useSetDevMemberSignInMethod();
  const active = data?.method ?? 'magic_link';

  function select(method: MemberSignInMethod) {
    if (method === active || setMethod.isPending) return;

    setMethod.mutate(method, {
      onSuccess: () => {
        toast.success(t('devMemberSignInMethodSaved'));
      },
      onError: () => {
        toast.error(tc('error'));
      },
    });
  }

  return (
    <Tabs
      variant="primary"
      selectedKey={active}
      onSelectionChange={(key: Key) => {
        const method = parseMemberSignInMethod(key);
        if (method) select(method);
      }}
      className={cn('w-auto gap-0', className)}
    >
      <Tabs.ListContainer className="!w-auto">
        <Tabs.List
          aria-label={t('devMemberSignInMethodAria')}
          className="!inline-flex !w-auto max-w-full"
        >
          <Tabs.Tab
            id="magic_link"
            className="!h-auto !w-auto shrink-0 normal-case"
            isDisabled={setMethod.isPending}
          >
            <span className="text-xs font-medium whitespace-nowrap normal-case">
              {t('devMemberSignInLink')}
            </span>
            <Tabs.Indicator className="!shadow-none" />
          </Tabs.Tab>
          <Tabs.Tab
            id="password"
            className="!h-auto !w-auto shrink-0 normal-case"
            isDisabled={setMethod.isPending}
          >
            <span className="text-xs font-medium whitespace-nowrap normal-case">
              {t('devMemberSignInCreds')}
            </span>
            <Tabs.Indicator className="!shadow-none" />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
