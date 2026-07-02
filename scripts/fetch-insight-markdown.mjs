import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'content/insights');

const SOURCES = {
  'news-2026-06-02':
    'https://www.datenschutzpartner.ch/2026/06/02/news-questions-datenschutzrecht-20260602/',
  'news-2026-05-05':
    'https://www.datenschutzpartner.ch/2026/05/05/news-questions-datenschutzrecht-20260505/',
  'news-2026-04-07':
    'https://www.datenschutzpartner.ch/2026/04/07/news-questions-datenschutzrecht-20260407/',
  'ki-dienste-schweiz': 'https://www.datenschutzpartner.ch/webinar-ki-dienste-schweiz-20260707/',
  'ai-act-transparenz':
    'https://www.datenschutzpartner.ch/2026/05/19/webinar-ai-act-transparenzpflichten-20260519/',
  'ki-alternative-dienste':
    'https://www.datenschutzpartner.ch/2026/04/21/webinar-alternative-ki-dienste-compliance-20260421/',
  'nis-2': 'https://www.datenschutzpartner.ch/2025/04/08/webinar-nis-2-richtlinie-20250408/',
  'impressum-checkliste':
    'https://www.datenschutzpartner.ch/2021/09/10/checkliste-impressumspflicht/',
  'video-hinweisschild':
    'https://www.datenschutzpartner.ch/2022/11/27/hinweisschild-video-ueberwachung-informationspflicht/',
  loeschbegehren:
    'https://www.datenschutzpartner.ch/2024/11/12/webinar-loeschbegehren-dsg-dsgvo-20241112/',
  'ai-act-pflichten':
    'https://www.datenschutzpartner.ch/2025/01/14/webinar-ai-act-pflichten-fuer-alle-20250114/',
  'edoeb-cookies':
    'https://www.datenschutzpartner.ch/2025/02/11/webinar-edoeb-leitfaden-cookies-20250211/',
};

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractContent(html) {
  const entry =
    html.match(/class="entry-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/article>/i)?.[1] ||
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
    html;

  const paras = [...entry.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')))
    .filter(
      (p) =>
        p.length > 25 &&
        !/^Cookie/i.test(p) &&
        !p.includes('Datenschutzpartner.ch') &&
        !p.startsWith('Bild:')
    );

  const lis = [...entry.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')))
    .filter((li) => li.length > 10 && !li.includes('Gastbeitrag') && !li.includes('Webinar 🖥️'));

  const h2s = [...entry.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) =>
    decode(m[1].replace(/<[^>]+>/g, ' '))
  );

  return { paras, lis, h2s };
}

function toMarkdown({ paras, lis, h2s }) {
  const lines = [];
  const intro = paras.slice(0, 2);
  const body = paras.slice(intro.length ? 2 : 0, -3);
  const footer = paras.slice(-2);

  for (const p of intro) lines.push(p, '');
  for (const p of body) lines.push(p, '');

  if (h2s.length || lis.length) {
    lines.push(`## ${h2s[0] || 'Im Überblick'}`, '');
    for (const li of lis.slice(0, 12)) lines.push(`* ${li}`);
    if (lis.length) lines.push('');
  }

  for (const p of footer.filter((p) => p.includes('Academy') || p.includes('Podcast'))) {
    lines.push(p, '');
  }

  lines.push(
    'Mitglieder der Datenschutz-Academy finden Aufzeichnung, Folien und weiterführende Materialien im Academy-Bereich.'
  );
  return lines.join('\n').trim() + '\n';
}

mkdirSync(OUT, { recursive: true });

for (const [slug, url] of Object.entries(SOURCES)) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error('FAIL', slug, res.status);
    continue;
  }
  const html = await res.text();
  const md = toMarkdown(extractContent(html));
  writeFileSync(join(OUT, `${slug}.de.md`), md);
  console.log('wrote', slug, md.split('\n').length, 'lines');
}
