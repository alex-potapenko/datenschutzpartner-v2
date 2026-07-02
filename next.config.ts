import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { getAllInsightSlugs } from './lib/insights-content';

const withNextIntl = createNextIntlPlugin();

const insightSlugs = getAllInsightSlugs();

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: { optimizePackageImports: ['@phosphor-icons/react'] },
  async redirects() {
    return [
      {
        source: '/insights',
        has: [{ type: 'query', key: 'tab', value: 'news' }],
        destination: '/insights?tab=newsQuestions',
        permanent: true,
      },
      {
        source: '/academy',
        has: [{ type: 'query', key: 'tab', value: 'webinars' }],
        destination: '/insights?tab=webinars',
        permanent: true,
      },
      {
        source: '/academy',
        has: [{ type: 'query', key: 'tab', value: 'newsQuestions' }],
        destination: '/insights?tab=newsQuestions',
        permanent: true,
      },
      ...insightSlugs.map((slug) => ({
        source: `/academy/${slug}`,
        destination: `/insights/${slug}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
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
