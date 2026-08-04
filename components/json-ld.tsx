import React from 'react';

export function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ConfessionLnjpit',
    alternateName: [
      'LNJPIT Confessions',
      'LNJPIT Anonymous Campus Confessions',
      'Loknayak Jai Prakash Institute of Technology Confessions',
      'Unsaid LNJPIT',
      'LNJPIT Chapra Confessions',
    ],
    url: 'https://www.confessionlnjpit.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.confessionlnjpit.in/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Loknayak Jai Prakash Institute of Technology (LNJPIT)',
    alternateName: 'LNJPIT Chapra',
    url: 'https://www.confessionlnjpit.in',
    logo: 'https://www.confessionlnjpit.in/icon.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chapra',
      addressRegion: 'Bihar',
      addressCountry: 'IN',
    },
    sameAs: ['https://www.confessionlnjpit.in'],
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ConfessionLnjpit — Anonymous Campus Portal',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'All',
    url: 'https://www.confessionlnjpit.in',
    description:
      'Verified LNJPIT Chapra student portal for 100% anonymous campus confessions, crush signals, hostel stories, and peer discussions.',
    author: {
      '@type': 'Organization',
      name: 'LNJPIT Student Community',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is LNJPIT Confessions (ConfessionLnjpit)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'ConfessionLnjpit is the official anonymous student portal for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar). It allows verified students to share campus stories, crush signals, hostel experiences, and peer support 100% anonymously.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are confessions on ConfessionLnjpit 100% anonymous?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes. ConfessionLnjpit enforces database-level anonymity. Your author identity is stripped before confessions are published, so no student or viewer can trace who submitted a confession.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who can post confessions on LNJPIT Confessions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Verified students of Loknayak Jai Prakash Institute of Technology (LNJPIT) Chapra can log in with Google OAuth to post confessions, vote on campus polls, and send anonymous signals.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do anonymous crush signals work on LNJPIT Confessions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'When a crush or appreciation confession is posted, any student can click "Send Signal" to open an end-to-end encrypted anonymous conversation with the author without revealing either person’s identity.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
