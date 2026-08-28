import { LegacyHostedPolicyRedirect } from './_components/LegacyHostedPolicyRedirect';

type PageProps = {
  params: Promise<{ id: string; site: string }>;
};

/** Legacy hosted URL (`/{id}/{site}`) — redirects to the canonical slug path. */
export default async function LegacyHostedPolicyPage({ params }: PageProps) {
  const { id, site } = await params;
  return <LegacyHostedPolicyRedirect id={id} site={site} />;
}
