import type { RawInsightArticle } from './types';

function podcastImage(slug: string) {
  return `https://picsum.photos/seed/${slug}/800/500`;
}

const PODCAST_BASE = 'https://podcast.datenschutzpartner.ch/episodes';
const PODIGEE_EMBED_BASE = 'https://datenschutzplaudereien.podigee.io';

type PodcastEpisodeSource = {
  slug: string;
  path: string;
  /** Short slug on datenschutzplaudereien.podigee.io (from RSS feed). */
  embedPath: string;
  duration: string;
  dateDe: string;
  dateEn: string;
  titleDe: string;
  titleEn: string;
  descriptionDe: string;
  descriptionEn: string;
};

const EPISODES: PodcastEpisodeSource[] = [
  {
    slug: 'dat407',
    path: 'dat407-ki-zwischen-bauchgefuhl-cloud-act-und-uberforderung-david-rosenthal-teil-2',
    embedPath: '407-ki-compliance-david-rosenthal-teil-2',
    duration: '30m 6s',
    dateDe: '29. Juni 2026',
    dateEn: 'June 29, 2026',
    titleDe:
      'DAT407 KI zwischen Bauchgefühl, CLOUD Act und Überforderung (David Rosenthal, Teil 2)',
    titleEn: 'DAT407 AI between gut feeling, CLOUD Act and overwhelm (David Rosenthal, part 2)',
    descriptionDe:
      'Spezialgast David Rosenthal und Martin Steiger diskutieren Rechtsfragen rund um die Nutzung von KI in der Schweiz. Themen im zweiten Gesprächsteil sind unter anderem die Datensicherheit, der CLOUD Act, die Bedeutung von Bauchgefühl und Emotionen, und die Überforderung der Tech-Unternehmen.',
    descriptionEn:
      'Special guest David Rosenthal and Martin Steiger discuss legal questions around using AI in Switzerland. Topics in the second part include data security, the CLOUD Act, the role of gut feeling and emotions, and tech companies feeling overwhelmed.',
  },
  {
    slug: 'dat406',
    path: 'dat406-duerfen-wir-ki-ueberhaupt-nutzen-david-rosenthal-teil-1',
    embedPath: '406-ki-compliance-david-rosenthal-teil-1',
    duration: '31m 29s',
    dateDe: '22. Juni 2026',
    dateEn: 'June 22, 2026',
    titleDe: 'DAT406 Dürfen wir KI überhaupt nutzen? (David Rosenthal, Teil 1)',
    titleEn: 'DAT406 Are we allowed to use AI at all? (David Rosenthal, part 1)',
    descriptionDe:
      'Spezialgast David Rosenthal und Martin Steiger diskutieren Rechtsfragen rund um die Nutzung von KI in der Schweiz. Themen im ersten Gesprächsteil sind unter anderem der Geheimnisschutz, der Konflikt zwischen Juristen und Techies in Unternehmen, und wieso man nicht jeden Hype mitmachen muss.',
    descriptionEn:
      'Special guest David Rosenthal and Martin Steiger discuss legal questions around using AI in Switzerland. Topics in the first part include trade secrets, the tension between lawyers and tech teams, and why not every hype should be followed.',
  },
  {
    slug: 'dat405',
    path: 'dat405-open-access-praxiskommentar-zum-neuen-idg-im-kanton-zurich',
    embedPath: '405-open-access-idg-kanton-zuerich',
    duration: '15m 23s',
    dateDe: '15. Juni 2026',
    dateEn: 'June 15, 2026',
    titleDe: 'DAT405 Open-Access-Praxiskommentar zum neuen IDG im Kanton Zürich',
    titleEn: 'DAT405 Open-access practice commentary on the new IDG in Canton Zurich',
    descriptionDe:
      'Andreas Von Gunten und Martin Steiger freuen sich über den angekündigten Open-Access-Praxiskommentar zum neuen Gesetz über die Information und den Datenschutz (IDG) im Kanton Zürich – und schweifen ab zu Open Access im Allgemeinen, zu Creative Commons-Lizenzen und zu künstlicher Intelligenz.',
    descriptionEn:
      'Andreas Von Gunten and Martin Steiger welcome the announced open-access practice commentary on the new Information and Data Protection Act (IDG) in Canton Zurich — and digress into open access in general, Creative Commons licences and artificial intelligence.',
  },
  {
    slug: 'dat404',
    path: 'dat404-microsoft-verzichtet-auf-sms-fur-zwei-faktor-authentifizierung',
    embedPath: '404-microsoft-2fa-sms',
    duration: '10m 41s',
    dateDe: '8. Juni 2026',
    dateEn: 'June 8, 2026',
    titleDe: 'DAT404 Microsoft verzichtet auf SMS für Zwei-Faktor-Authentifizierung',
    titleEn: 'DAT404 Microsoft drops SMS for two-factor authentication',
    descriptionDe:
      'Microsoft beendet das Senden von SMS-Codes für Zwei-Faktor-Authentifizierung. Andreas Von Gunten und Martin Steiger diskutieren das Ende von Mobile TAN bei Microsoft und Alternativen wie Passkeys oder TOTP.',
    descriptionEn:
      'Microsoft is ending SMS codes for two-factor authentication. Andreas Von Gunten and Martin Steiger discuss the end of mobile TAN at Microsoft and alternatives such as passkeys or TOTP.',
  },
  {
    slug: 'dat403',
    path: 'dat403-edob-warnt-vor-betrugerischen-e-mails',
    embedPath: '403-edoeb-betruegerische-emails',
    duration: '10m 32s',
    dateDe: '1. Juni 2026',
    dateEn: 'June 1, 2026',
    titleDe: 'DAT403 EDÖB warnt vor betrügerischen E‑Mails',
    titleEn: 'DAT403 FDPIC warns of fraudulent emails',
    descriptionDe:
      'Der Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB) in der Schweiz warnt vor betrügerischen E‑Mails, die in seinem Namen verschickt werden. Andreas Von Gunten und Martin Steiger diskutieren, worum es bei den E‑Mails inhaltlich gehen könnte, wieso solche E‑Mails vermutlich funktionieren, und ob vor Phishing immer noch gewarnt werden muss.',
    descriptionEn:
      'The Swiss Federal Data Protection and Information Commissioner (FDPIC) warns of fraudulent emails sent in its name. Andreas Von Gunten and Martin Steiger discuss what these emails may contain, why they likely work, and whether phishing warnings are still needed.',
  },
  {
    slug: 'dat402',
    path: 'dat402-private-videouberwachung-von-offentlichem-grund-viktor-gyorffy',
    embedPath: '402-zuerich-private-videoueberwachung-viktor-gyoerffy',
    duration: '28m 43s',
    dateDe: '25. Mai 2026',
    dateEn: 'May 25, 2026',
    titleDe: 'DAT402 Private Videoüberwachung von öffentlichem Grund (Viktor Györffy)',
    titleEn: 'DAT402 Private video surveillance of public space (Viktor Györffy)',
    descriptionDe:
      'In der Stadt Zürich fanden die Parteien einen Kompromiss für die private Videoüberwachung von öffentlichem Grund. Rechtsanwalt Viktor Györffy, der das Thema politisch und rechtlich aus erster Hand kennt, diskutiert die Vorgeschichte und den gefundenen Kompromiss ausführlich mit Martin Steiger.',
    descriptionEn:
      'In the city of Zurich, parties reached a compromise on private video surveillance of public space. Attorney Viktor Györffy, who knows the topic politically and legally first-hand, discusses the background and compromise in detail with Martin Steiger.',
  },
  {
    slug: 'dat401',
    path: 'dat401-was-sagt-seppmail-zu-den-sicherheitslucken-matthias-leisi',
    embedPath: '401-matthias-leisi-seppmail-e-mail-sicherheitsluecken',
    duration: '31m 11s',
    dateDe: '18. Mai 2026',
    dateEn: 'May 18, 2026',
    titleDe: 'DAT401 Was sagt SEPPmail zu den Sicherheitslücken? (Matthias Leisi)',
    titleEn: 'DAT401 What does SEPPmail say about the security flaws? (Matthias Leisi)',
    descriptionDe:
      'Bei SEPPmail, einem angeblich sicheren E‑Mail-Dienst, fanden Forschende der ETH Zürich und andere Fachpersonen schwerwiegende Sicherheitslücken. Im Gespräch mit Martin Steiger nimmt Matthias Leisi, CTO von SEPPmail, Stellung zu den Sicherheitslücken.',
    descriptionEn:
      'Researchers at ETH Zurich and other experts found serious security flaws in SEPPmail, a supposedly secure email service. In conversation with Martin Steiger, SEPPmail CTO Matthias Leisi responds to the vulnerabilities.',
  },
  {
    slug: 'dat400',
    path: 'dat400-seppmail-mit-schwerwiegenden-sicherheitslucken',
    embedPath: '400-seppmail-e-mail-sicherheitsluecken',
    duration: '14m 59s',
    dateDe: '11. Mai 2026',
    dateEn: 'May 11, 2026',
    titleDe: 'DAT400 SEPPmail mit schwerwiegenden Sicherheitslücken',
    titleEn: 'DAT400 SEPPmail with serious security vulnerabilities',
    descriptionDe:
      'SEPPmail verspricht seit über 20 Jahren sichere E‑Mail, aktuell unter anderem: «Vollumfängliche E‑Mail-Sicherheit», «Compliant E-Mail-Kommunikation (DSGVO-Konform)» und «100 % sichere Kommunikation». In Wirklichkeit bestehen bei SEPPmail schwerwiegende Sicherheitslücken, wie Forschende der ETH Zürich herausfanden. Andreas Von Gunten und Martin Steiger diskutieren den «Totalschaden» bei SEPPmail.',
    descriptionEn:
      'For over 20 years SEPPmail has promised secure email — including “comprehensive email security” and “GDPR-compliant communication”. In reality, ETH Zurich researchers found serious security flaws. Andreas Von Gunten and Martin Steiger discuss the damage at SEPPmail.',
  },
  {
    slug: 'dat399',
    path: 'dat399-angriffe-auf-nutzer-von-signal-und-ihre-daten',
    embedPath: '399-signal-angriffe-nutzer-daten',
    duration: '23m 55s',
    dateDe: '4. Mai 2026',
    dateEn: 'May 4, 2026',
    titleDe: 'DAT399 Angriffe auf Nutzer von Signal und ihre Daten',
    titleEn: 'DAT399 Attacks on Signal users and their data',
    descriptionDe:
      'Der Messenger Signal gilt als sicher. Angriffe auf Nutzer von Signal und ihre Daten zeigen aber, dass allein die technische Sicherheit von Signal als App, Dienst und Protokoll nicht genügt. In den USA gelangte das FBI durch einen Fehler von Apple an Signal-Daten. In Deutschland sind russische Phishing-Angriffe gegen Politiker:innen und andere Zielpersonen erfolgreich.',
    descriptionEn:
      'The Signal messenger is considered secure. But attacks on Signal users show that technical security alone is not enough. In the US the FBI obtained Signal data through an Apple error; in Germany Russian phishing attacks against politicians and other targets have succeeded.',
  },
  {
    slug: 'dat398',
    path: 'dat398-wer-sieht-welche-daten-aus-dem-patientenzimmer-jonas-reber-qumea-teil-3',
    embedPath: '398-qumea-radar-patientensicherheit-jonas-reber-teil-3',
    duration: '16m 23s',
    dateDe: '27. April 2026',
    dateEn: 'April 27, 2026',
    titleDe: 'DAT398 Wer sieht welche Daten aus dem Patientenzimmer? (Jonas Reber, QUMEA, Teil 3)',
    titleEn: 'DAT398 Who sees which data from the patient room? (Jonas Reber, QUMEA, part 3)',
    descriptionDe:
      'Monitoring von Patienten mit Radar: Welche Daten liegen in der Cloud? Wie setzt QUMEA künstliche Intelligenz ein? Wo liegen die Gefahren für die Datensicherheit, gerade auch bei der Verwendung von Videoüberwachung? Martin Steiger spricht ausführlich mit Jonas Reber, Chief Information and Innovation Officer von QUMEA, über den Einsatz von Radar für die Patientensicherheit.',
    descriptionEn:
      'Patient monitoring with radar: what data is stored in the cloud? How does QUMEA use AI? Where are the data security risks, including with video surveillance? Martin Steiger talks in depth with Jonas Reber, CIO of QUMEA, about using radar for patient safety.',
  },
];

function toArticle(episode: PodcastEpisodeSource, locale: 'de' | 'en'): RawInsightArticle {
  return {
    slug: episode.slug,
    category: 'Podcast',
    date: locale === 'de' ? episode.dateDe : episode.dateEn,
    title: locale === 'de' ? episode.titleDe : episode.titleEn,
    description: locale === 'de' ? episode.descriptionDe : episode.descriptionEn,
    readTime: episode.duration,
    image: podcastImage(episode.slug),
    externalUrl: `${PODCAST_BASE}/${episode.path}`,
    podigeeEmbedUrl: `${PODIGEE_EMBED_BASE}/${episode.embedPath}/embed?context=external`,
  };
}

export const PODCAST_ARTICLES_DE: RawInsightArticle[] = EPISODES.map((ep) => toArticle(ep, 'de'));
export const PODCAST_ARTICLES_EN: RawInsightArticle[] = EPISODES.map((ep) => toArticle(ep, 'en'));

export function getPodcastSlugs(): string[] {
  return EPISODES.map((ep) => ep.slug);
}
