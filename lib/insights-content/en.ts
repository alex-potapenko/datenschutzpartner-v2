import type { RawInsightArticle } from './types';
import { PODCAST_ARTICLES_EN } from './podcasts';

function img(slug: string) {
  return `https://picsum.photos/seed/${slug}/800/500`;
}

export const INSIGHTS_CONTENT: Record<
  'webinars' | 'newsQuestions' | 'podcasts',
  RawInsightArticle[]
> = {
  webinars: [
    {
      slug: 'ki-dienste-schweiz',
      category: 'Webinar',
      date: 'July 7, 2026',
      presenter: 'Martin Steiger',
      title: 'Swiss AI services under legal scrutiny',
      description:
        'In this live webinar for Datenschutz Academy members, we examine selected AI services from Switzerland — focusing on what they offer for compliance.',
      readTime: 'Webinar',
      image: img('ki-dienste-schweiz'),
    },
    {
      slug: 'ai-act-transparenz',
      category: 'Webinar',
      date: 'May 19, 2026',
      presenter: 'Martin Steiger',
      title: 'What transparency obligations does the AI Act introduce?',
      description:
        'In this live webinar for Datenschutz Academy members, attorney Martin Steiger explained the upcoming transparency obligations under Art. 50 of the AI Act.',
      readTime: 'Webinar',
      image: img('ai-act-transparenz'),
    },
    {
      slug: 'ki-alternative-dienste',
      category: 'Webinar',
      date: 'April 21, 2026',
      presenter: 'Martin Steiger',
      title: 'Can alternative services enable compliant use of AI?',
      description:
        'In this live webinar for Datenschutz Academy members, attorney Martin Steiger examined whether the AI services Gemini, Langdock and Logicc can be used in a legally compliant manner.',
      readTime: 'Webinar',
      image: img('ki-alternative-dienste'),
    },
    {
      slug: 'claude-anthropic',
      category: 'Webinar',
      date: 'March 10, 2026',
      presenter: 'Martin Steiger',
      title: 'Claude by Anthropic under legal scrutiny',
      description:
        'In this live webinar for Datenschutz Academy members, attorney Martin Steiger examined the AI service Claude by Anthropic from a data protection perspective.',
      readTime: 'Webinar',
      image: img('claude-anthropic'),
    },
    {
      slug: 'ki-daten-nutzung',
      category: 'Webinar',
      date: 'February 17, 2026',
      presenter: 'Martin Steiger',
      title: 'Using your own and third-party data with AI services',
      description:
        'In this live webinar for Datenschutz Academy members, attorney Martin Steiger covered the compliant use of your own and third-party data with AI services.',
      readTime: 'Webinar',
      image: img('ki-daten-nutzung'),
    },
    {
      slug: 'edoeb-cookies',
      category: 'Webinar',
      date: 'January 13, 2026',
      presenter: 'Martin Steiger',
      title: 'Compliant cookies and third-party services under FDPIC requirements',
      description:
        'In this Datenschutz Academy webinar, we discussed the new FDPIC guidance on data processing through cookies and similar technologies.',
      readTime: 'Webinar',
      image: img('edoeb-cookies'),
    },
    {
      slug: 'datenschutzberater',
      category: 'Webinar',
      date: 'November 4, 2025',
      presenter: 'Martin Steiger',
      title: 'Do we need a data protection advisor or a data protection officer?',
      description:
        'In this Datenschutz Academy webinar, we clarified when companies need a data protection advisor or a data protection officer.',
      readTime: 'Webinar',
      image: img('datenschutzberater'),
    },
    {
      slug: 'nis-2',
      category: 'Webinar',
      date: 'April 8, 2025',
      presenter: 'Martin Steiger',
      title: 'What you need to know about the EU NIS-2 Directive',
      description:
        'In this live webinar for Datenschutz Academy members, attorney Martin Steiger explained the content and implementation of the European NIS-2 Directive.',
      readTime: 'Webinar',
      image: img('nis-2'),
    },
    {
      slug: 'impressum-checkliste',
      category: 'Webinar',
      date: 'March 10, 2025',
      presenter: 'Martin Steiger',
      title: 'Checklist: Imprint requirements for websites',
      description:
        'Almost every website is subject to an imprint obligation — but what exactly must be included? Members of the Datenschutz Academy can find the key answers in our checklist.',
      readTime: 'Checklist',
      image: img('impressum-checkliste'),
    },
    {
      slug: 'loeschbegehren',
      category: 'Webinar',
      date: 'February 5, 2025',
      presenter: 'Martin Steiger',
      title: 'How to respond correctly to deletion requests',
      description:
        'In this live Datenschutz Academy webinar, companies and other controllers learned how to respond correctly to deletion requests under the new Swiss Data Protection Act (DSG).',
      readTime: 'Webinar',
      image: img('loeschbegehren'),
    },
    {
      slug: 'ai-act-pflichten',
      category: 'Webinar',
      date: 'January 14, 2025',
      presenter: 'Martin Steiger',
      title: 'What obligations under the AI Act apply to all organisations?',
      description:
        'In this Datenschutz Academy webinar, we covered which obligations under the European AI Act all companies and organisations must comply with when the Act applies to them.',
      readTime: 'Webinar',
      image: img('ai-act-pflichten'),
    },
    {
      slug: 'video-hinweisschild',
      category: 'Webinar',
      date: 'September 1, 2023',
      presenter: 'Martin Steiger',
      title: 'Video surveillance: sample notice sign to meet the duty to inform',
      description:
        'Since the revised Swiss Data Protection Act (nDSG) came into force, a general duty to inform applies to video surveillance in Switzerland. We provide a free sample notice sign.',
      readTime: 'Template',
      image: img('video-hinweisschild'),
    },
  ],
  newsQuestions: [
    {
      slug: 'news-2026-06-02',
      category: 'News & Questions',
      date: 'June 2, 2026',
      presenter: 'Martin Steiger',
      title: 'Email fraud, Trello, video surveillance, SEPPmail, …',
      description:
        'Attorney Martin Steiger reported on current data protection topics and answered members’ questions. Topics included serious security flaws at email encryption provider SEPPmail.',
      readTime: 'Live session',
      image: img('news-2026-06-02'),
    },
    {
      slug: 'news-2026-05-05',
      category: 'News & Questions',
      date: 'May 5, 2026',
      presenter: 'Martin Steiger',
      title: 'myRide, NDB facial recognition, Signal, SRF cookies, VPN services, …',
      description:
        'Attorney Martin Steiger reported on current data protection topics and answered members’ questions. Topics included the extraction of deleted Signal messages from the iPhone notification database.',
      readTime: 'Live session',
      image: img('news-2026-05-05'),
    },
    {
      slug: 'news-2026-04-07',
      category: 'News & Questions',
      date: 'April 7, 2026',
      presenter: 'Martin Steiger',
      title: 'Redacting PDFs, Vibe Coding, AI video creation, wearables, …',
      description:
        'Attorney Martin Steiger reported on current data protection topics and answered members’ questions. Topics included the FDPIC’s new guidance on wearables.',
      readTime: 'Live session',
      image: img('news-2026-04-07'),
    },
    {
      slug: 'news-2026-02-24',
      category: 'News & Questions',
      date: 'February 24, 2026',
      presenter: 'Martin Steiger',
      title: 'US cloud services, Langdock, Meta glasses, password manager vulnerabilities, …',
      description:
        'Attorney Martin Steiger reported on current data protection topics and answered members’ questions.',
      readTime: 'Live session',
      image: img('news-2026-02-24'),
    },
    {
      slug: 'news-2026-01-27',
      category: 'News & Questions',
      date: 'January 27, 2026',
      presenter: 'Martin Steiger',
      title: 'BitLocker, cookie fines, security.txt, Threema ownership, …',
      description:
        'Attorney Martin Steiger reported on current data protection topics and answered members’ questions.',
      readTime: 'Live session',
      image: img('news-2026-01-27'),
    },
    {
      slug: 'news-2025-12-09',
      category: 'News & Questions',
      date: 'December 9, 2025',
      presenter: 'Martin Steiger',
      title: 'Cable surveillance, Privatim resolution, consent cookie retention, …',
      description:
        'Attorney Martin Steiger reported on current data protection topics and answered members’ questions.',
      readTime: 'Live session',
      image: img('news-2025-12-09'),
    },
    {
      slug: 'news-2026-07-21',
      category: 'News & Questions',
      date: 'July 21, 2026',
      presenter: 'Martin Steiger',
      title: 'News & Questions — live session',
      description:
        'Attorney Martin Steiger reports on current data protection topics and answers members’ questions.',
      readTime: 'Live session',
      image: img('news-2026-07-21'),
    },
    {
      slug: 'news-2026-08-18',
      category: 'News & Questions',
      date: 'August 18, 2026',
      presenter: 'Martin Steiger',
      title: 'News & Questions — live session',
      description:
        'Attorney Martin Steiger reports on current data protection topics and answers members’ questions.',
      readTime: 'Live session',
      image: img('news-2026-08-18'),
    },
  ],
  podcasts: PODCAST_ARTICLES_EN,
};
