import type { RawInsightArticle } from './types';
import { insightCoverImage } from './images';

function image(slug: string) {
  return insightCoverImage(slug);
}

/** Email newsletter editions — distinct from Updates tab articles. */
export const NEWSLETTER_ARTICLES_EN: RawInsightArticle[] = [
  {
    slug: 'newsletter-june-2026-privacy-checklist',
    category: 'Newsletter',
    date: 'June 20, 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Summer privacy checklist for SMEs',
    description:
      'Our June edition covers retention clean-ups, cookie banner refreshes, and what to document before the holiday season.',
    readTime: '5 min read',
    image: image('newsletter-june-2026-privacy-checklist'),
  },
  {
    slug: 'newsletter-may-2026-dpo-questions',
    category: 'Newsletter',
    date: 'May 22, 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Five DPO questions we answered this month',
    description:
      'From processor agreements to employee monitoring — highlights from our advisory inbox, anonymised for subscribers.',
    readTime: '4 min read',
    image: image('newsletter-may-2026-dpo-questions'),
  },
  {
    slug: 'newsletter-april-2026-generator-updates',
    category: 'Newsletter',
    date: 'April 18, 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Privacy Generator and EU Rep product news',
    description:
      'New policy templates, EU representative onboarding improvements, and tips for multi-site subscriptions.',
    readTime: '3 min read',
    image: image('newsletter-april-2026-generator-updates'),
  },
  {
    slug: 'newsletter-march-2026-enforcement-roundup',
    category: 'Newsletter',
    date: 'March 14, 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Enforcement roundup — Switzerland and EU',
    description:
      'Selected decisions and guidance from EDÖB, EDPB, and CNIL that matter for Swiss exporters and EU-facing websites.',
    readTime: '6 min read',
    image: image('newsletter-march-2026-enforcement-roundup'),
  },
  {
    slug: 'newsletter-february-2026-imprint-hosting',
    category: 'Newsletter',
    date: 'February 12, 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Imprint hosting and legal notice hygiene',
    description:
      'Why hosted imprint pages reduce drift, and a short audit list for contact details, UID, and commercial register entries.',
    readTime: '4 min read',
    image: image('newsletter-february-2026-imprint-hosting'),
  },
  {
    slug: 'newsletter-january-2026-academy-preview',
    category: 'Newsletter',
    date: 'January 16, 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Academy sessions opening for 2026',
    description:
      'Preview of live workshops on nFADP, DPIAs, and vendor management — plus early-bird access for subscribers.',
    readTime: '3 min read',
    image: image('newsletter-january-2026-academy-preview'),
  },
];

export const NEWSLETTER_ARTICLES_DE: RawInsightArticle[] = [
  {
    slug: 'newsletter-june-2026-privacy-checklist',
    category: 'Newsletter',
    date: '20. Juni 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Sommer-Checkliste Datenschutz für KMU',
    description:
      'Die Juniausgabe behandelt Aufbewahrungsbereinigungen, Cookie-Banner-Updates und Dokumentation vor der Ferienzeit.',
    readTime: '5 Min. Lesezeit',
    image: image('newsletter-june-2026-privacy-checklist'),
  },
  {
    slug: 'newsletter-may-2026-dpo-questions',
    category: 'Newsletter',
    date: '22. Mai 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Fünf DSB-Fragen aus unserem Posteingang',
    description:
      'Von Auftragsbearbeitung bis Mitarbeiterüberwachung — anonymisierte Highlights für Abonnentinnen und Abonnenten.',
    readTime: '4 Min. Lesezeit',
    image: image('newsletter-may-2026-dpo-questions'),
  },
  {
    slug: 'newsletter-april-2026-generator-updates',
    category: 'Newsletter',
    date: '18. April 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Neues im Generator und EU-Vertretung',
    description:
      'Neue Policy-Vorlagen, verbessertes Onboarding für EU-Vertretungen und Tipps für Multi-Site-Abos.',
    readTime: '3 Min. Lesezeit',
    image: image('newsletter-april-2026-generator-updates'),
  },
  {
    slug: 'newsletter-march-2026-enforcement-roundup',
    category: 'Newsletter',
    date: '14. März 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Durchsetzungs-Rückblick Schweiz und EU',
    description:
      'Ausgewählte Entscheide und Leitlinien von EDÖB, EDSA und CNIL — relevant für Schweizer Exporteure und EU-Websites.',
    readTime: '6 Min. Lesezeit',
    image: image('newsletter-march-2026-enforcement-roundup'),
  },
  {
    slug: 'newsletter-february-2026-imprint-hosting',
    category: 'Newsletter',
    date: '12. Februar 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Impressum-Hosting und Pflege der Anbieterkennzeichnung',
    description:
      'Warum gehostete Impressumsseiten Abweichungen vermeiden — plus Kurz-Checkliste für Kontakt, UID und Handelsregister.',
    readTime: '4 Min. Lesezeit',
    image: image('newsletter-february-2026-imprint-hosting'),
  },
  {
    slug: 'newsletter-january-2026-academy-preview',
    category: 'Newsletter',
    date: '16. Januar 2026',
    author: 'Datenschutzpartner',
    title: 'Newsletter: Academy-Sessions 2026 — Vorschau',
    description:
      'Live-Workshops zu nDSG, DSFA und Vendor Management — inklusive Early Access für Newsletter-Abonnenten.',
    readTime: '3 Min. Lesezeit',
    image: image('newsletter-january-2026-academy-preview'),
  },
];
