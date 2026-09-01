'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Bell, Button, Check } from '@/components/ui';
import { BrandGlowBackdrop } from '@/components/shared/BrandGlowBackdrop';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { AccountSectionFrame } from '../account-ui';
import { SECTION_ICON, type ComingSoonSectionId } from '../account-sections';
import { useSiteScope } from '@/components/shared/site-scope';

const PRODUCT_ACCENT: Record<ComingSoonSectionId, string> = {
  cookieBanner: 'var(--feature-yellow)',
  imprint: 'var(--feature-teal)',
};

const BENEFIT_KEYS = ['one', 'two', 'three'] as const;

export function ComingSoonSection({ product }: { product: ComingSoonSectionId }) {
  const t = useTranslations(`account.comingSoon.${product}`);
  const tShared = useTranslations('account.comingSoon');
  const tNav = useTranslations('account.nav');
  const { activeSite } = useSiteScope();

  const accent = PRODUCT_ACCENT[product];
  const ServiceIcon = SECTION_ICON[product];

  return (
    <AccountSectionFrame
      hideTitle
      flush
      content={
        <div className="-mx-4 flex h-[calc(100dvh-var(--topbar-height,6rem))] min-w-0 flex-col overflow-hidden sm:-mx-8">
          <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <BrandGlowBackdrop
              placement="right"
              centerIcon={
                <ServiceIcon size={80} weight="fill" className="text-white" aria-hidden />
              }
            />

            <div className="relative z-10 flex flex-col gap-8 px-6 py-12 sm:px-8 sm:py-16">
              <div className="flex flex-col gap-6">
                <MetaBadge kind="soon" size="lg" className="w-fit self-start">
                  {tNav('comingSoon')}
                </MetaBadge>

                <div className="flex max-w-2xl flex-col gap-4">
                  <h2 className="text-foreground text-3xl leading-tight font-bold sm:text-4xl">
                    {t('headline')}
                  </h2>
                  <p className="text-muted text-base leading-relaxed sm:text-lg">{t('body')}</p>
                </div>
              </div>

              <ul className="grid max-w-3xl gap-4 sm:grid-cols-3">
                {BENEFIT_KEYS.map((key) => (
                  <li key={key} className="flex min-w-0 items-start gap-2.5">
                    <span
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                        color: accent,
                      }}
                      aria-hidden
                    >
                      <Check size={12} weight="bold" />
                    </span>
                    <span className="text-foreground text-sm leading-relaxed">
                      {t(`benefits.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <div>
                <Button
                  variant="primary"
                  size="md"
                  className="gap-2"
                  onPress={() => {
                    toast.success(
                      tShared('notifySuccess', {
                        site: activeSite?.domain ?? tShared('yourAccount'),
                      })
                    );
                  }}
                >
                  <Bell size={16} weight="bold" aria-hidden />
                  {tShared('notify')}
                </Button>
              </div>
            </div>
          </section>
        </div>
      }
    />
  );
}
