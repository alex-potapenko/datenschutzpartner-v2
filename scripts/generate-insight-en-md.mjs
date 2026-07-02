import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'content/insights');

const EN = {
  'news-2026-06-02': `In «News & Questions», members of our Datenschutz Academy receive an overview of current developments in data protection law and related topics.

They also receive answers to their own questions and benefit from answers to questions from other members.

Attorney Martin Steiger reported at «News & Questions» on June 2, 2026 on current developments in data protection law and related topics.

Among other things, he covered the warning from the Swiss Federal Data Protection and Information Commissioner (FDPIC) about fraudulent emails, a massive data leak at private parking surveillance operators, and serious security flaws at email encryption provider SEPPmail. He also discussed the adoption of new EU adequacy decisions in Liechtenstein and the simplified notification procedure for video surveillance on public land in the city of Zurich.

Further topics included the use of hCAPTCHA at the Federal Supreme Court, the use of Google infrastructure to store scanned letters by Swiss Post, and a German court ruling on liability for false statements by an AI chatbot.

Martin Steiger then answered questions from Datenschutz Academy members. Topics included the compliant use of tools such as Trello or Stackfield in cantonal authorities, entering personal data into AI tools such as ChatGPT or Claude, the legal classification of synthetic data, and the need for an AI inventory analogous to a data inventory. Further questions concerned the obligation to review technical and organisational measures (TOMs) when outsourcing and the reliability of blanket compliance promises from third-party providers. Another topic was the permissibility of unencrypted emails in medical practices.

Members of the Datenschutz Academy can watch the recorded «News & Questions» session and download the slides below.

Members of the Datenschutz Academy asked in particular the following questions:

* «What should a cantonal authority consider from a data protection perspective regarding Trello (USA) vs. Stackfield (Germany)? Can Trello be used in a data protection-compliant manner at all? One of the two tools is to be used for internal task management / project organisation. Personal data is limited to employees' names and login credentials.»

* «Generally speaking: may I enter personal data into ChatGPT, Claude and similar tools?»

* «Do synthetic data fall outside data protection law?»

* «Is an AI inventory needed, analogous to a data inventory?»

* «Do we have to review technical and organisational measures (TOMs) when outsourcing?»

* «Many providers advertise with «100% DSG-compliant» or «100% GDPR-compliant». Can you rely on that?»

* «May a medical practice use unencrypted email?»

## Recording and slides

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'news-2026-05-05': `In «News & Questions», members of our Datenschutz Academy receive an overview of current developments in data protection law and related topics.

They also receive answers to their own questions and benefit from answers to questions from other members.

Attorney Martin Steiger reported at «News & Questions» on May 5, 2026 on current developments in data protection law and related topics.

Among other things, he discussed the extraction of deleted Signal messages from the iPhone notification database and Apple's corresponding security update. The warning from the Swiss Federal Data Protection and Information Commissioner (FDPIC) about fraudulent emails was also covered.

Further focal points included the Federal Administrative Court ruling on unlawful facial recognition by the Federal Intelligence Service (FIS) and new teaching materials from the Zurich cantonal data protection officer for schools. DeepL's move to Amazon Web Services (AWS), the current state of European data protection law including the EU AI Act, and the «Simplified travel recording» feature in «myRIDE» were also analysed.

Martin Steiger then answered questions from Academy members. The focus was on information obligations for video surveillance, the need for data processing agreements (DPAs) for social media agencies, and risks for SaaS providers when offering template texts for privacy policies and consent forms.

Further topics included evaluating VPN providers such as Proton and Mullvad, handling cookie banners at Swiss Radio and Television (SRF) for users abroad, and legal frameworks for SMEs and the strategic importance of «Plan B» scenarios for cloud services.

Members of the Datenschutz Academy can watch the recorded «News & Questions» session and download the slides below.

Members of the Datenschutz Academy asked in particular the following questions:

* «Surveillance cameras: what are the current requirements for providing information?»

* «What legal frameworks must I comply with today as an SME? («Wrap-up» / brief overview from past webinars, updated 2026)»

* «Do we need a data processing agreement for our social media agency?»

* «We are a SaaS provider and would like to offer templates for privacy policies and consent forms to our customers. However, we fear the risk. How great is the risk really?»

* «The webinar on the AI Act from January 14, 2025 was a while ago. Is there a brief update / experiences / best practices on this?»

* «What do you think of Proton's VPN? You have made clear statements about their mail service.»

## Recording and slides

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'news-2026-04-07': `In «News & Questions», members of our Datenschutz Academy receive an overview of current developments in data protection law and related topics.

They also receive answers to their own questions and benefit from answers to questions from other members.

Attorney Martin Steiger reported at «News & Questions» on April 7, 2026 on current developments in data protection law and related topics.

Among other things, he discussed the FDPIC's new guidance on wearables and its awareness campaign on the use of cookies. Another topic was the adoption of the new Information and Data Protection Act (IDG) in the canton of Zurich. He also reported on the rise in complaints received by data protection authorities due to AI and data protection concerns about supposedly secure services such as Proton Meet and TeleGuard. Further topics included the risks of «Vibe Coding» and supply chain attacks in software development with artificial intelligence.

Martin Steiger then answered members' questions. Topics included integrating the data protection management system into the information security management system and handling data protection in corporate groups with a shared website. Further questions concerned AI regulation in Switzerland and the use of AI-based video creation services for employee training.

Additional topics included responsibility when using on-premises specialist applications at cantonal authorities and risk assessments under standard contractual clauses (SCCs) including transfer impact assessments (TIAs). Questions also covered redacting PDF documents, compliance reviews for AI applications, and data protection responsibility when recommending third-party services for job application training.

Members of the Datenschutz Academy can watch the recorded «News & Questions» session and download the slides below.

Members of the Datenschutz Academy asked in particular the following questions:

* «Is it correct to integrate data protection / the data protection management system directly into the information security management system, or are there arguments for separate management systems?»

* «We are a small Swiss corporate group with a shared website. How do we organise data protection?»

* «What is the current state of AI regulation in Switzerland (especially with regard to data protection) and how does the EU AI Act affect this currently and possibly in the medium term?»

* «We would very much appreciate it if HeyGen were also reviewed for permissible use.»

* «We would like to use an AI video creator such as HeyGen or Synthesia for internal employee training. Would it be possible to also examine Synthesia from a legal perspective? HeyGen, in our view, might only be an option with an enterprise plan. Or is there perhaps another AI video creator that companies in Switzerland can use in good conscience with internal training materials to create training videos for employees?»

* «A cantonal authority works with a specialist application (on-premises) and processes particularly sensitive personal data in it. It has a contract with the provider. A third party hosts the corresponding ticket system on behalf of the provider. This third party keeps backups of the ticket system for a maximum of 12 months. How far does the cantonal authority's responsibility extend regarding appropriate retention periods and appropriate TOMs with the third party? Must this responsibility generally be regulated in the contract with the provider of the specialist application under the «subcontractor» category?»

* «Could a webinar once cover the topic of risk assessment under SCCs in more depth? This would be very helpful.»

* «For the future, the topic of «redacting text passages» would be interesting. I have already done this, but apparently not efficiently enough, because ChatGPT was able to read the passages I redacted without difficulty — apparently a layer is not protection.»

* «In the last webinar, compliance for AI applications was covered using several targeted questions. Is such a compliance review sufficient for using AI applications, or must additional risk questions be asked, for example how the AI model works at all; how AI output may be used? Is there a review catalogue (best practice)?»

* «As a social institution, we run job application training with participants. Can we recommend the following website to clients and possibly work with them in it without being responsible for the data transfer ourselves? Website: meinperfekterlebenslauf.de (processing of application documents using algorithms). Operator according to privacy policy in Puerto Rico. No website with a Swiss top-level domain (.ch).»

## Recording and slides

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'ki-dienste-schweiz': `Date: Tuesday, July 7, 2026 at 4:00 p.m. live, then available as a recording

Alternatives to foreign AI services: what do AI services from Switzerland offer?

After reviewing ChatGPT from OpenAI, Claude from Anthropic, Gemini from Google, and the German AI services Langdock and Logicc, we now examine AI services from Switzerland under the legal microscope.

In this live webinar for Datenschutz Academy members, we examine selected AI services from Switzerland. In particular, we assess what such AI services offer for compliance.

## Presenter

Members of the Datenschutz Academy can submit their own questions on the topic before the webinar using our form or live during the webinar.

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'ai-act-transparenz': `What transparency obligations does the AI Act introduce?

The European Artificial Intelligence Act (AI Act) introduces transparency obligations for providers and deployers of certain AI systems.

In the live webinar on May 19, 2026 for Datenschutz Academy members, we explained the upcoming transparency obligations under Art. 50 of the AI Act.

We discussed in particular the following questions:

* What transparency obligations does the AI Act provide for?
* What are «providers», «deployers» and «AI systems»?
* Why must companies and organisations in Switzerland comply with the AI Act?

## Recording and slides

Members of the Datenschutz Academy can watch the recorded webinar and download the slides below.

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'ki-alternative-dienste': `Can alternative services enable compliant use of AI?

In our two most recent live webinars, we found that compliance and AI services is a difficult topic.

With Claude and ChatGPT, for example, providers Anthropic and OpenAI largely leave their users to fend for themselves.

In this live webinar for Datenschutz Academy members, we therefore examined what alternatives to Claude and ChatGPT offer in terms of compliance.

We looked at Gemini from Google. We also examined Langdock and Logicc — two AI services that specifically position themselves as «compliant».

## Recording and slides

Members of the Datenschutz Academy can watch the recorded webinar and download the slides below.

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'nis-2': `With the NIS-2 Directive, the European Union (EU) aims to achieve a high level of cybersecurity in Europe. What do companies and other controllers in Switzerland need to know about the NIS-2 Directive?

In this live webinar on April 8, 2025 for Datenschutz Academy members, attorney Martin Steiger explained the content of the European NIS-2 Directive and looked at its implementation in Germany, Liechtenstein and Austria. Finally, he explained the direct impact of the NIS-2 Directive on controllers in Switzerland.

## Recording and slides

Members of the Datenschutz Academy can watch the recorded webinar and download the slides below.

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'impressum-checkliste': `What must be included in the imprint of a Swiss app or website?

The imprint is the business card of an app or website: who is responsible? How can the responsible person be contacted?

## Overview

* Why must all Swiss apps and websites publish an imprint?
* Which information must always be included in the imprint?
* Which information is optional but increases transparency?
* How should the imprint be published in an app or on a website?
* What additional information must be included in the imprint of apps and websites with a European focus?
* What are the consequences of violating the imprint obligation?
* Disclaimer in the imprint: pointless or even harmful? (Podcast episode 🎙️ of Datenschutz Plaudereien)

Members of the Datenschutzpartner Academy can download the checklist as a PDF file.

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'video-hinweisschild': `From September 1, 2023, a general duty to inform applies to video surveillance under the revised Swiss data protection law. It is no longer sufficient for video surveillance to be recognisable.

To help implement the new duty to inform under Art. 19 ff. nDSG and Art. 13 DSV, we publish a free sample notice sign.

We recommend providing information in two steps:

* The notice sign on site ensures recognisability and contains the most important information.
* All further information is provided on a website where video surveillance is described as part of a privacy policy.

We provide the sample free of charge in two sizes (A4 and A3), three colour variants and three file formats:

* PDF for printing
* SVG for professional customisation
* DOCX for editing

The download includes the blue, yellow and white colour variants as well as the files for the free Source Sans Pro typeface. The QR code is optional but often helpful for data subjects.

In the webinar «What do I need to know about video surveillance and data protection?», members of our Datenschutzpartner Academy learned how to implement the new duty to inform. We also covered two-step information with a notice sign and website.

Our privacy policy generator now supports mentioning video surveillance in privacy policies. Members of our Datenschutzpartner Academy can retrieve sample text for their own use.

## Notice sign: sample in various formats

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'loeschbegehren': `Under the new Swiss Data Protection Act (DSG), deletion requests are becoming more frequent. In this webinar on November 12, 2024, companies and other controllers learned how to respond correctly.

Data subjects and controllers often have incorrect expectations about deletion requests. Data subjects demand more than is legally possible under data protection law, while controllers tend to make mistakes and thereby unnecessarily weaken their legal position.

We covered deletion requests under the Swiss DSG and also looked at the European General Data Protection Regulation (GDPR).

## Recording and slides

Members of the Datenschutz Academy can watch the recorded webinar and download the slides below.

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'ai-act-pflichten': `What obligations must all companies and organisations comply with under the European AI Act?

The AI Act prohibits certain AI systems and regulates high-risk AI systems. Beyond these special cases, there are obligations that apply to all companies and organisations when the AI Act applies to them. In Switzerland, the AI Act may apply directly or under contractual agreements.

In this live webinar on January 14, 2025 for Datenschutz Academy members, attorney Martin Steiger explained the general obligations under the AI Act for companies and organisations in Switzerland.

## Recording and slides

Members of the Datenschutz Academy can watch the recorded webinar and download the slides below.

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,

  'edoeb-cookies': `The Swiss Federal Data Protection and Information Commissioner (FDPIC) has published new «Guidance on data processing through cookies and similar technologies».

The guidance can be read to mean that the FDPIC would prefer a cookie banner or consent management in case of doubt. Can that be reconciled with Switzerland's still young revised Data Protection Act?

In this live webinar on February 11, 2025 for Datenschutz Academy members, attorney Martin Steiger explained what the FDPIC — Switzerland's data protection supervisory authority — requires and what is realistic in practice.

## Recording and slides

Members of the Datenschutz Academy can watch the recorded webinar and download the slides below.

We regularly discuss topics from Datenschutz Academy events in our «Datenschutz Plaudereien» podcast. Have you subscribed yet?

Members of the Datenschutz Academy will find the recording, slides and further materials in the Academy area.`,
};

for (const [slug, content] of Object.entries(EN)) {
  writeFileSync(join(dir, `${slug}.en.md`), `${content.trim()}\n`);
  console.log('wrote', `${slug}.en.md`);
}
