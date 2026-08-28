import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isHostedPolicySlug } from '@/api/documents';
import { RESERVED_HOSTED_POLICY_SLUGS } from '@/lib/hosted-policy-routes';
import { HostedPolicyPage } from './_components/HostedPolicyPage';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isHostedPolicySlug(slug) || RESERVED_HOSTED_POLICY_SLUGS.has(slug)) {
    return {};
  }

  return {
    robots: { index: true, follow: true },
  };
}

export default async function HostedPolicyRoute({ params }: PageProps) {
  const { slug } = await params;

  if (!isHostedPolicySlug(slug) || RESERVED_HOSTED_POLICY_SLUGS.has(slug)) {
    notFound();
  }

  return <HostedPolicyPage slug={slug} />;
}
