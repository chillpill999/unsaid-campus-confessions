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
    sameAs: [
      'https://www.confessionlnjpit.in',
    ],
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
    </>
  );
}
