'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';
import { TopBarIconBackButton } from './TopBarBackButton';
import { TopBarFrame } from './TopBarFrame';
import { TopBarRoot } from './TopBarRoot';
import { TopBarTitle } from './TopBarTitle';
import type { TopBarBackLink } from './types';

/** Nested detail screens — icon back and optional service title. */
export function NestedTopBar({ backLink }: { backLink?: TopBarBackLink }) {
  const router = useRouter();
  const tc = useTranslations('common');

  return (
    <TopBarRoot hideOnFooterScroll={false}>
      <Container>
        <TopBarFrame layout="row">
          <div className="flex items-center gap-4">
            {!backLink?.iconOnly ? (
              <Link
                href="/"
                aria-label={tc('home')}
                className="flex min-w-0 shrink cursor-pointer items-center"
              >
                <Logo showText={false} />
              </Link>
            ) : null}
            {backLink ? (
              <div className="flex min-w-0 items-center gap-3">
                <TopBarIconBackButton
                  label={backLink.label}
                  onPress={() => {
                    if (backLink.onPress) {
                      backLink.onPress();
                      return;
                    }

                    if (!backLink.preferHref && window.history.length > 1) {
                      router.back();
                      return;
                    }

                    router.push(backLink.href);
                  }}
                />
                {backLink.detailTitle ? <TopBarTitle>{backLink.detailTitle}</TopBarTitle> : null}
              </div>
            ) : null}
          </div>
        </TopBarFrame>
      </Container>
    </TopBarRoot>
  );
}
