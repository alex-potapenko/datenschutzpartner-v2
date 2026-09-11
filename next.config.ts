import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const LEGACY_ACADEMY_INSIGHT_SLUGS = [
  'ki-dienste-schweiz',
  'ai-act-transparenz',
  'ki-alternative-dienste',
  'claude-anthropic',
  'ki-daten-nutzung',
  'edoeb-cookies',
  'datenschutzberater',
  'nis-2',
  'impressum-checkliste',
  'loeschbegehren',
  'ai-act-pflichten',
  'video-hinweisschild',
  'news-2026-06-02',
  'news-2026-05-05',
  'news-2026-04-07',
  'news-2026-02-24',
  'news-2026-01-27',
  'news-2025-12-09',
  'news-2026-07-21',
  'news-2026-08-18',
] as const;

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: { optimizePackageImports: ['@phosphor-icons/react'] },
  async redirects() {
    return [
      {
        source: '/news',
        destination: '/insights?tab=news',
        permanent: true,
      },
      {
        source: '/news/:slug',
        destination: '/insights/:slug',
        permanent: true,
      },
      {
        source: '/podcasts',
        destination: '/insights?tab=podcasts',
        permanent: true,
      },
      {
        source: '/podcasts/:slug',
        destination: '/insights/:slug',
        permanent: true,
      },
      {
        source: '/insights',
        has: [{ type: 'query', key: 'tab', value: 'webinars' }],
        destination: '/academy',
        permanent: true,
      },
      {
        source: '/insights',
        has: [{ type: 'query', key: 'tab', value: 'newsQuestions' }],
        destination: '/insights?tab=news',
        permanent: true,
      },
      {
        source: '/academy/:path+',
        destination: '/academy',
        permanent: true,
      },
      ...LEGACY_ACADEMY_INSIGHT_SLUGS.map((slug) => ({
        source: `/insights/${slug}`,
        destination: '/academy',
        permanent: true,
      })),
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:id(\\d+)/:site',
        destination: '/policies/:id/:site',
      },
    ];
  },
  async headers() {
    return [
      {
        source:
          '/:slug((?!account|scan|login|result|eu-rep|contact|about|news|podcasts|privacy|terms|imprint|insights|academy|policies|verify-email)[a-z0-9]+(?:-[a-z0-9]+)+)',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
