'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useProfile } from '@/api/account';
import { SignOut, Spinner, cn } from '@/components/ui';
import { ACCOUNT_SECTION_IDS, SECTION_ICON, type AccountSectionId } from './account-sections';

const MEMBER_AVATAR_PHOTO = '/member-avatar.jpg';

type AccountSidebarProps = {
  active: AccountSectionId;
  onNavigate: (section: AccountSectionId) => void;
  onLogout: () => void;
};

export function SidebarUser() {
  const t = useTranslations('account');
  const profile = useProfile();

  const email = profile.data?.email ?? '';
  const displayName = profile.data?.displayName ?? '';
  const firstName = profile.data?.firstName ?? displayName.split(' ')[0] ?? '';
  const lastName = profile.data?.lastName ?? displayName.split(' ').slice(1).join(' ');
  const avatarLabel = displayName.trim() || `${firstName} ${lastName}`.trim() || email;

  return (
    <div className="flex items-center gap-4 px-6 py-8">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
        {profile.isLoading ? (
          <div className="bg-accent-soft flex size-full items-center justify-center">
            <Spinner aria-label={t('loading')} className="size-8" />
          </div>
        ) : (
          <Image
            src={MEMBER_AVATAR_PHOTO}
            alt={avatarLabel}
            width={64}
            height={64}
            className="size-full object-cover object-top"
          />
        )}
      </div>
      <div className="font-display flex min-w-0 flex-col">
        <span className="text-foreground text-base leading-tight font-semibold">{firstName}</span>
        <span className="text-foreground text-base leading-tight font-semibold">{lastName}</span>
      </div>
    </div>
  );
}

export function SidebarNav({
  active,
  onNavigate,
  onLogout,
}: {
  active: AccountSectionId;
  onNavigate: (section: AccountSectionId) => void;
  onLogout: () => void;
}) {
  const t = useTranslations('account');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {ACCOUNT_SECTION_IDS.map((section) => {
          const Icon = SECTION_ICON[section];
          const isActive = section === active;
          return (
            <button
              key={section}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                onNavigate(section);
              }}
              className={cn(
                'flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-medium transition-colors sm:px-6',
                isActive
                  ? 'bg-key-50 text-accent shadow-[inset_2px_0_0_0_var(--accent)]'
                  : 'text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
              )}
            >
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
              <span className="truncate">{t(`nav.${section}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="border-border shrink-0 border-t">
        <button
          type="button"
          onClick={onLogout}
          className="text-danger flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--feature-red)_8%,transparent)] sm:px-6"
        >
          <SignOut size={20} className="shrink-0" />
          <span className="truncate">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}

export function AccountSidebar({ active, onNavigate, onLogout }: AccountSidebarProps) {
  const t = useTranslations('account');

  return (
    <nav className="flex h-full min-h-0 flex-1 flex-col" aria-label={t('title')}>
      <SidebarUser />
      <SidebarNav active={active} onNavigate={onNavigate} onLogout={onLogout} />
    </nav>
  );
}
