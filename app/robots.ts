import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.confessionlnjpit.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/feed',
          '/trending',
          '/guidelines',
          '/privacy',
          '/search',
          '/confession/',
        ],
        disallow: [
          '/admin/',
          '/inbox/',
          '/profile/',
          '/settings/',
          '/onboarding/',
          '/auth/',
          '/api/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/feed', '/trending', '/guidelines', '/privacy', '/confession/'],
        disallow: ['/admin/', '/inbox/', '/profile/', '/settings/', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/feed', '/trending', '/guidelines', '/privacy', '/confession/'],
        disallow: ['/admin/', '/inbox/', '/profile/', '/settings/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
