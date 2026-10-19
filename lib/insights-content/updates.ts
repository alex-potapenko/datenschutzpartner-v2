import type { RawInsightArticle } from './types';
import { insightCoverImage } from './images';

function image(slug: string) {
  return insightCoverImage(slug);
}

/** Public news and commentary on the Updates tab (not email editions). */
export const UPDATES_ARTICLES_EN: RawInsightArticle[] = [
  {
    slug: 'fdpic-warns-fraudulent-emails',
    category: 'Updates',
    date: 'June 1, 2026',
    author: 'Martin Steiger',
    title: 'FDPIC warns of fraudulent emails sent in its name',
    description:
      'The Swiss data protection authority is warning about phishing emails that misuse its name. We explain what organisations and recipients should look out for.',
    readTime: '3 min read',
    image: image('fdpic-warns-fraudulent-emails'),
  },
  {
    slug: 'microsoft-drops-sms-two-factor-authentication',
    category: 'Updates',
    date: 'June 8, 2026',
    author: 'Martin Steiger',
    title: 'Microsoft drops SMS for two-factor authentication',
    description:
      'Microsoft is moving away from SMS codes. Passkeys and authenticator apps offer organisations stronger alternatives for account security.',
    readTime: '4 min read',
    image: image('microsoft-drops-sms-two-factor-authentication'),
  },
  {
    slug: 'zurich-idg-open-access-commentary',
    category: 'Updates',
    date: 'June 15, 2026',
    author: 'Martin Steiger',
    title: 'Open-access commentary announced for Zurich’s new IDG',
    description:
      'A practical open-access commentary will accompany the Canton of Zurich’s new Information and Data Protection Act.',
    readTime: '3 min read',
    image: image('zurich-idg-open-access-commentary'),
  },
  {
    slug: 'fdpic-cookie-guidance',
    category: 'Updates',
    date: 'January 13, 2026',
    author: 'Martin Steiger',
    title: 'FDPIC publishes new guidance on cookies and similar technologies',
    description:
      'The new guidance explains the authority’s expectations for transparent and lawful data processing through cookies and third-party services.',
    readTime: '5 min read',
    image: image('fdpic-cookie-guidance'),
  },
  {
    slug: 'ai-act-transparency-obligations',
    category: 'Updates',
    date: 'May 19, 2026',
    author: 'Martin Steiger',
    title: 'AI Act transparency obligations are approaching',
    description:
      'Article 50 of the EU AI Act introduces transparency duties for selected AI systems and generated content.',
    readTime: '4 min read',
    image: image('ai-act-transparency-obligations'),
  },
  {
    slug: 'private-video-surveillance-zurich',
    category: 'Updates',
    date: 'May 25, 2026',
    author: 'Martin Steiger',
    title: 'Zurich reaches compromise on private video surveillance',
    description:
      'The City of Zurich has agreed on rules for private cameras that also capture public space.',
    readTime: '3 min read',
    image: image('private-video-surveillance-zurich'),
  },
];

export const UPDATES_ARTICLES_DE: RawInsightArticle[] = [
  {
    slug: 'fdpic-warns-fraudulent-emails',
    category: 'Aktuelles',
    date: '1. Juni 2026',
    author: 'Martin Steiger',
    title: 'EDÖB warnt vor betrügerischen E-Mails in seinem Namen',
    description:
      'Die Schweizer Datenschutzbehörde warnt vor Phishing-E-Mails, die ihren Namen missbrauchen. Wir erklären, worauf Organisationen und Empfänger achten sollten.',
    readTime: '3 Min. Lesezeit',
    image: image('fdpic-warns-fraudulent-emails'),
  },
  {
    slug: 'microsoft-drops-sms-two-factor-authentication',
    category: 'Aktuelles',
    date: '8. Juni 2026',
    author: 'Martin Steiger',
    title: 'Microsoft verzichtet auf SMS für Zwei-Faktor-Authentifizierung',
    description:
      'Microsoft verabschiedet sich von SMS-Codes. Passkeys und Authenticator-Apps bieten Organisationen stärkere Alternativen für die Kontosicherheit.',
    readTime: '4 Min. Lesezeit',
    image: image('microsoft-drops-sms-two-factor-authentication'),
  },
  {
    slug: 'zurich-idg-open-access-commentary',
    category: 'Aktuelles',
    date: '15. Juni 2026',
    author: 'Martin Steiger',
    title: 'Open-Access-Praxiskommentar zum neuen Zürcher IDG angekündigt',
    description:
      'Ein frei zugänglicher Praxiskommentar wird das neue Gesetz über die Information und den Datenschutz im Kanton Zürich begleiten.',
    readTime: '3 Min. Lesezeit',
    image: image('zurich-idg-open-access-commentary'),
  },
  {
    slug: 'fdpic-cookie-guidance',
    category: 'Aktuelles',
    date: '13. Januar 2026',
    author: 'Martin Steiger',
    title: 'EDÖB veröffentlicht neuen Leitfaden zu Cookies',
    description:
      'Der neue Leitfaden erläutert die Erwartungen der Behörde an transparente und rechtmässige Datenbearbeitungen durch Cookies und Dritt-Dienste.',
    readTime: '5 Min. Lesezeit',
    image: image('fdpic-cookie-guidance'),
  },
  {
    slug: 'ai-act-transparency-obligations',
    category: 'Aktuelles',
    date: '19. Mai 2026',
    author: 'Martin Steiger',
    title: 'Transparenzpflichten des AI Act rücken näher',
    description:
      'Artikel 50 des europäischen AI Act bringt Transparenzpflichten für ausgewählte KI-Systeme und generierte Inhalte.',
    readTime: '4 Min. Lesezeit',
    image: image('ai-act-transparency-obligations'),
  },
  {
    slug: 'private-video-surveillance-zurich',
    category: 'Aktuelles',
    date: '25. Mai 2026',
    author: 'Martin Steiger',
    title: 'Zürich findet Kompromiss bei privater Videoüberwachung',
    description:
      'Die Stadt Zürich hat sich auf Regeln für private Kameras geeinigt, die auch öffentlichen Grund erfassen.',
    readTime: '3 Min. Lesezeit',
    image: image('private-video-surveillance-zurich'),
  },
];
