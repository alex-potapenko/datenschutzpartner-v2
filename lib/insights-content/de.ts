import type { RawInsightArticle } from './types';
import { PODCAST_ARTICLES_DE } from './podcasts';
import { insightCoverImage } from './images';

function img(slug: string) {
  return insightCoverImage(slug);
}

export const INSIGHTS_CONTENT: Record<
  'webinars' | 'newsQuestions' | 'podcasts',
  RawInsightArticle[]
> = {
  webinars: [
    {
      slug: 'ki-dienste-schweiz',
      category: 'Webinar',
      date: '7. Juli 2026',
      presenter: 'Martin Steiger',
      title: 'KI-Dienste aus der Schweiz unter der rechtlichen Lupe',
      description:
        'In diesem Live-Webinar für Mitglieder der Datenschutz-Academy beleuchten wir ausgewählte KI-Dienste aus der Schweiz. Wir prüfen insbesondere, was solche KI-Dienste bei der Compliance zu bieten haben.',
      readTime: 'Webinar',
      image: img('ki-dienste-schweiz'),
    },
    {
      slug: 'ai-act-transparenz',
      category: 'Webinar',
      date: '19. Mai 2026',
      presenter: 'Martin Steiger',
      title: 'Welche Transparenzpflichten bringt der AI Act?',
      description:
        'In diesem Live-Webinar für Mitglieder der Datenschutz-Academy beleuchtete Rechtsanwalt Martin Steiger die kommenden Transparenzpflichten gemäss Art. 50 AI Act.',
      readTime: 'Webinar',
      image: img('ai-act-transparenz'),
    },
    {
      slug: 'ki-alternative-dienste',
      category: 'Webinar',
      date: '21. April 2026',
      presenter: 'Martin Steiger',
      title: 'Erlauben alternative Dienste eine rechtskonforme Nutzung von KI?',
      description:
        'In diesem Live-Webinar für Mitglieder der Datenschutz-Academy prüfte Rechtsanwalt Martin Steiger gezielt, ob die KI-Dienste Gemini, Langdock und Logicc rechtskonform genutzt werden können.',
      readTime: 'Webinar',
      image: img('ki-alternative-dienste'),
    },
    {
      slug: 'claude-anthropic',
      category: 'Webinar',
      date: '10. März 2026',
      presenter: 'Martin Steiger',
      title: 'Claude von Anthropic unter der rechtlichen Lupe',
      description:
        'In diesem Live-Webinar für Mitglieder der Datenschutz-Academy prüfte Rechtsanwalt Martin Steiger den KI-Dienst Claude von Anthropic unter datenschutzrechtlichen Gesichtspunkten.',
      readTime: 'Webinar',
      image: img('claude-anthropic'),
    },
    {
      slug: 'ki-daten-nutzung',
      category: 'Webinar',
      date: '17. Februar 2026',
      presenter: 'Martin Steiger',
      title: 'Verwendung von eigenen und fremden Daten mit KI-Diensten',
      description:
        'In diesem Live-Webinar für Mitglieder der Datenschutz-Academy thematisierte Rechtsanwalt Martin Steiger die rechtskonforme Verwendung eigener und fremder Daten mit KI-Diensten.',
      readTime: 'Webinar',
      image: img('ki-daten-nutzung'),
    },
    {
      slug: 'edoeb-cookies',
      category: 'Webinar',
      date: '13. Januar 2026',
      presenter: 'Martin Steiger',
      title: 'Rechtskonforme Cookies und Dritt-Dienste gemäss den Anforderungen des EDÖB',
      description:
        'In diesem Live-Webinar unserer Datenschutz-Academy thematisierten wir den neuen «Leitfaden betreffend Datenbearbeitungen mittels Cookies und ähnlichen Technologien» des EDÖB.',
      readTime: 'Webinar',
      image: img('edoeb-cookies'),
    },
    {
      slug: 'datenschutzberater',
      category: 'Webinar',
      date: '4. November 2025',
      presenter: 'Martin Steiger',
      title: 'Benötigen wir einen Datenschutzberater oder eine Datenschutzbeauftragte?',
      description:
        'In diesem Live-Webinar unserer Datenschutz-Academy klärten wir, wann Unternehmen einen Datenschutzberater oder eine Datenschutzbeauftragte benötigen.',
      readTime: 'Webinar',
      image: img('datenschutzberater'),
    },
    {
      slug: 'nis-2',
      category: 'Webinar',
      date: '8. April 2025',
      presenter: 'Martin Steiger',
      title: 'Was muss ich über die NIS-2-Richtlinie der EU wissen?',
      description:
        'In diesem Live-Webinar für Mitglieder der Datenschutz-Academy erklärte Rechtsanwalt Martin Steiger den Inhalt und die Umsetzung der europäischen NIS-2-Richtlinie.',
      readTime: 'Webinar',
      image: img('nis-2'),
    },
    {
      slug: 'impressum-checkliste',
      category: 'Webinar',
      date: '10. März 2025',
      presenter: 'Martin Steiger',
      title: 'Checkliste Impressumspflicht',
      description:
        'Fast jede Website unterliegt einer Impressumspflicht. Aber was muss im Impressum stehen? Mitglieder der Datenschutz-Academy finden die wichtigsten Antworten in unserer Checkliste.',
      readTime: 'Checkliste',
      image: img('impressum-checkliste'),
    },
    {
      slug: 'loeschbegehren',
      category: 'Webinar',
      date: '5. Februar 2025',
      presenter: 'Martin Steiger',
      title: 'Wie reagieren Verantwortliche richtig auf Löschbegehren?',
      description:
        'In diesem Live-Webinar unserer Datenschutz-Academy lernten Unternehmen und andere Verantwortliche, richtig auf Löschbegehren zu reagieren. Mit dem neuen Datenschutzgesetz (DSG) kommt es häufiger dazu.',
      readTime: 'Webinar',
      image: img('loeschbegehren'),
    },
    {
      slug: 'ai-act-pflichten',
      category: 'Webinar',
      date: '14. Januar 2025',
      presenter: 'Martin Steiger',
      title: 'Welche Pflichten gelten beim AI Act für alle Unternehmen und Organisationen?',
      description:
        'In diesem Live-Webinar unserer Datenschutz-Academy thematisierten wir, welche Pflichten gemäss dem europäischen AI Act alle Unternehmen und Organisationen einhalten müssen.',
      readTime: 'Webinar',
      image: img('ai-act-pflichten'),
    },
    {
      slug: 'video-hinweisschild',
      category: 'Webinar',
      date: '1. September 2023',
      presenter: 'Martin Steiger',
      title: 'Video-Überwachung: Muster für Hinweisschild zur Erfüllung der Informationspflicht',
      description:
        'Mit dem Inkrafttreten des neuen Datenschutzgesetzes (nDSG) gilt in der Schweiz eine allgemeine Informationspflicht bei Video-Überwachung. Wir stellen ein kostenloses Muster für ein Hinweisschild zur Verfügung.',
      readTime: 'Vorlage',
      image: img('video-hinweisschild'),
    },
  ],
  newsQuestions: [
    {
      slug: 'news-2026-06-02',
      category: 'News & Fragen',
      date: '2. Juni 2026',
      presenter: 'Martin Steiger',
      title: 'E-Mail-Betrug, Trello, Videoüberwachung, SEPPmail, …',
      description:
        'Rechtsanwalt Martin Steiger informierte über aktuelle Themen zum Datenschutzrecht und beantwortete Fragen der Mitglieder. Themen waren unter anderem die Sicherheitslücken beim E-Mail-Verschlüsselungsanbieter SEPPmail.',
      readTime: 'Live-Session',
      image: img('news-2026-06-02'),
    },
    {
      slug: 'news-2026-05-05',
      category: 'News & Fragen',
      date: '5. Mai 2026',
      presenter: 'Martin Steiger',
      title: 'myRide, NDB-Gesichtserkennung, Signal, SRF-Cookies, VPN-Dienste, …',
      description:
        'Rechtsanwalt Martin Steiger informierte über aktuelle Themen zum Datenschutzrecht und beantwortete Fragen der Mitglieder. Themen waren unter anderem die Extraktion gelöschter Signal-Nachrichten aus der iPhone-Benachrichtigungsdatenbank.',
      readTime: 'Live-Session',
      image: img('news-2026-05-05'),
    },
    {
      slug: 'news-2026-04-07',
      category: 'News & Fragen',
      date: '7. April 2026',
      presenter: 'Martin Steiger',
      title: 'PDFs schwärzen, Vibe Coding, Videoerstellung mit KI, Wearables, …',
      description:
        'Rechtsanwalt Martin Steiger informierte über aktuelle Themen zum Datenschutzrecht und beantwortete Fragen der Mitglieder. Themen waren unter anderem die neuen Hinweise des EDÖB zu Wearables.',
      readTime: 'Live-Session',
      image: img('news-2026-04-07'),
    },
    {
      slug: 'news-2026-02-24',
      category: 'News & Fragen',
      date: '24. Februar 2026',
      presenter: 'Martin Steiger',
      title:
        'Amerikanische Cloud-Dienste, Langdock, Meta-Brillen, Sicherheitslücken bei Passwort-Managern, …',
      description:
        'Rechtsanwalt Martin Steiger informierte über aktuelle Themen zum Datenschutzrecht und beantwortete Fragen der Mitglieder.',
      readTime: 'Live-Session',
      image: img('news-2026-02-24'),
    },
    {
      slug: 'news-2026-01-27',
      category: 'News & Fragen',
      date: '27. Januar 2026',
      presenter: 'Martin Steiger',
      title: 'BitLocker, Cookie-Bussen, security.txt, Threema-Eigentum, …',
      description:
        'Rechtsanwalt Martin Steiger informierte über aktuelle Themen zum Datenschutzrecht und beantwortete Fragen der Mitglieder.',
      readTime: 'Live-Session',
      image: img('news-2026-01-27'),
    },
    {
      slug: 'news-2025-12-09',
      category: 'News & Fragen',
      date: '9. Dezember 2025',
      presenter: 'Martin Steiger',
      title: 'Kabelaufklärung, Privatim-Resolution, Speicherdauer von Consent-Cookies, …',
      description:
        'Rechtsanwalt Martin Steiger informierte über aktuelle Themen zum Datenschutzrecht und beantwortete Fragen der Mitglieder.',
      readTime: 'Live-Session',
      image: img('news-2025-12-09'),
    },
    {
      slug: 'news-2026-07-21',
      category: 'News & Fragen',
      date: '21. Juli 2026',
      presenter: 'Martin Steiger',
      title: 'News & Questions — Live-Session',
      description:
        'Rechtsanwalt Martin Steiger informiert über aktuelle Themen zum Datenschutzrecht und beantwortet Fragen der Mitglieder.',
      readTime: 'Live-Session',
      image: img('news-2026-07-21'),
    },
    {
      slug: 'news-2026-08-18',
      category: 'News & Fragen',
      date: '18. August 2026',
      presenter: 'Martin Steiger',
      title: 'News & Questions — Live-Session',
      description:
        'Rechtsanwalt Martin Steiger informiert über aktuelle Themen zum Datenschutzrecht und beantwortet Fragen der Mitglieder.',
      readTime: 'Live-Session',
      image: img('news-2026-08-18'),
    },
  ],
  podcasts: PODCAST_ARTICLES_DE,
};
