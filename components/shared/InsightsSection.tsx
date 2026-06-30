'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Container } from './Container';
import { ArticleCard, type Article } from './ArticleCard';

type Tab = 'news' | 'blog' | 'podcasts';

const CONTENT: Record<Tab, Article[]> = {
  news: [
    {
      category: 'News',
      date: 'April 21, 2026',
      title: 'Webinar: Can alternative AI services be used in compliance with the law?',
      description:
        'Attorney Martin Steiger examined whether AI services Gemini, Langdock and Logicc can be used in a legally compliant manner. Members of the Datenschutz Academy can access the recording and slides.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/ai-webinar/800/500',
    },
    {
      category: 'News',
      date: 'April 7, 2026',
      title: 'News & Questions: Redacting PDFs, Vibe Coding, AI video creation, wearables',
      description:
        "Attorney Martin Steiger covered current data protection topics including the FDPIC's new guidance on wearables and answered member questions on AI-based video creation for employee training.",
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Q&A',
      image: 'https://picsum.photos/seed/news-questions/800/500',
    },
    {
      category: 'News',
      date: 'March 10, 2026',
      title: 'Webinar: Claude by Anthropic under legal scrutiny',
      description:
        "In this live webinar, attorney Martin Steiger examined whether Claude and Anthropic's AI services can be used in a legally compliant way under Swiss and EU data protection law.",
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/claude-webinar/800/500',
    },
    {
      category: 'News',
      date: 'February 24, 2026',
      title: 'News & Questions: US cloud services, Langdock, Meta glasses, password managers',
      description:
        'Attorney Martin Steiger reported on news from the FDPIC and answered questions on the data protection compliance of the AI tool Langdock.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Q&A',
      image: 'https://picsum.photos/seed/cloud-services/800/500',
    },
    {
      category: 'News',
      date: 'February 17, 2026',
      title: 'Using your own and third-party data with AI services',
      description:
        'Attorney Martin Steiger explained which data may be used with AI services and under what conditions — covering both personal and business data scenarios.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/ai-data/800/500',
    },
    {
      category: 'News',
      date: 'January 13, 2026',
      title: 'Webinar: Compliant cookies and third-party services per FDPIC requirements',
      description:
        'Attorney Martin Steiger explained what the FDPIC demands in its Cookie Guidelines and what website operators must do to achieve compliance.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/cookie-fdpic-news/800/500',
    },
  ],
  blog: [
    {
      category: 'Blog',
      date: 'January 13, 2026',
      title: 'Webinar: Compliant cookies and third-party services per FDPIC requirements',
      description:
        'Attorney Martin Steiger explained what the FDPIC demands in its Cookie Guidelines — and what website operators must do to achieve compliance under the new Swiss Data Protection Act.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/cookie-guide/800/500',
    },
    {
      category: 'Blog',
      date: 'April 8, 2025',
      title: 'What you need to know about the EU NIS-2 Directive',
      description:
        'Attorney Martin Steiger explained the content and implementation of the European NIS-2 Directive, with which the EU aims to achieve a high level of cybersecurity across Europe.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/nis2/800/500',
    },
    {
      category: 'Blog',
      date: 'March 10, 2025',
      title: 'Checklist: Imprint requirements for websites',
      description:
        'Almost every website is subject to an imprint obligation — but what exactly must be included? Members of the Datenschutz Academy can access our new checklist.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Checklist',
      image: 'https://picsum.photos/seed/imprint/800/500',
    },
    {
      category: 'Blog',
      date: 'February 5, 2025',
      title: 'How to respond correctly to deletion requests',
      description:
        'With the new Swiss Data Protection Act (DSG), deletion requests are becoming more frequent. This webinar covers how companies should respond correctly and within legal timeframes.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/deletion/800/500',
    },
    {
      category: 'Blog',
      date: 'January 14, 2025',
      title: 'What obligations does the EU AI Act impose on all organisations?',
      description:
        'This webinar covers which obligations under the European AI Act apply to all companies and organisations when the Act is applicable to them.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Webinar',
      image: 'https://picsum.photos/seed/ai-act/800/500',
    },
    {
      category: 'Blog',
      date: 'December 10, 2024',
      title: 'Video surveillance under nDSG: duty to inform explained',
      description:
        'Since the new Swiss Data Protection Act came into force, a general duty to inform applies to video surveillance installations.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: '6 min read',
      image: 'https://picsum.photos/seed/video-blog/800/500',
    },
  ],
  podcasts: [
    {
      category: 'Podcast',
      date: 'January 20, 2026',
      title: 'Is an EU Data Protection Representative required?',
      description:
        'Our questionnaire determines whether an EU data protection representative under Article 27 GDPR is required — and our podcast episode walks through the key scenarios.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Episode',
      image: 'https://picsum.photos/seed/eu-rep-podcast/800/500',
    },
    {
      category: 'Podcast',
      date: 'November 12, 2025',
      title: 'Video surveillance: fulfilling the duty to inform under nDSG',
      description:
        'Since the new Swiss Data Protection Act (nDSG) came into force, a general duty to inform applies to video surveillance. We explain what this means in practice.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Episode',
      image: 'https://picsum.photos/seed/video-surv/800/500',
    },
    {
      category: 'Podcast',
      date: 'October 8, 2025',
      title: 'The new FDPIC cookie guidelines explained',
      description:
        "We break down the FDPIC's new guidelines on cookies and similar technologies and what website operators need to do to stay compliant.",
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Episode',
      image: 'https://picsum.photos/seed/fdpic-cookie/800/500',
    },
    {
      category: 'Podcast',
      date: 'September 3, 2025',
      title: 'Stay informed: news and tips via newsletter',
      description:
        'We curate particularly noteworthy content and inform you about updates to our own services — at least once a month, free of charge.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Episode',
      image: 'https://picsum.photos/seed/newsletter-pod/800/500',
    },
    {
      category: 'Podcast',
      date: 'August 19, 2025',
      title: 'Affiliate programme: earn while promoting privacy compliance',
      description:
        'Our affiliate programme rewards you and your clients when purchasing Datenschutzpartner services — you receive a commission, your clients get a discount.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Episode',
      image: 'https://picsum.photos/seed/affiliate/800/500',
    },
    {
      category: 'Podcast',
      date: 'July 15, 2025',
      title: 'Episode 7: The Swiss Data Protection Act one year on',
      description:
        'One year after the nDSG came into force, we review how Swiss companies have adapted and what challenges remain.',
      href: 'https://www.datenschutzpartner.ch/',
      readTime: 'Episode',
      image: 'https://picsum.photos/seed/podcast-7/800/500',
    },
  ],
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'news', label: 'News' },
  { id: 'blog', label: 'Blog' },
  { id: 'podcasts', label: 'Podcasts' },
];

export function InsightsSection() {
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const articles = CONTENT[activeTab];

  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative border-r border-l">
          <div className="border-border flex flex-col gap-8 border-b px-8 pt-36 pb-6">
            <h2 className="text-foreground text-4xl font-bold">Insights.</h2>
            <div className="flex items-center gap-3">
              {TABS.map((tab) => (
                <Button
                  key={tab.id}
                  size="lg"
                  variant={activeTab === tab.id ? 'primary' : 'outline'}
                  onPress={() => {
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-border grid grid-cols-3 border-b">
            {articles[0] && (
              <ArticleCard
                article={articles[0]}
                large
                className="border-border col-span-2 border-r"
              />
            )}
            <div className="flex flex-col">
              {articles[1] && (
                <ArticleCard
                  article={articles[1]}
                  showImage={false}
                  className="border-border flex-1 border-b"
                />
              )}
              {articles[2] && (
                <ArticleCard article={articles[2]} showImage={false} className="flex-1" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3">
            {articles[3] && (
              <ArticleCard article={articles[3]} className="border-border border-r" />
            )}
            {articles[4] && (
              <ArticleCard article={articles[4]} className="border-border border-r" />
            )}
            {articles[5] && <ArticleCard article={articles[5]} />}
          </div>
        </div>
      </Container>
    </section>
  );
}
