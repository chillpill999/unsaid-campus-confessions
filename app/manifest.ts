import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ConfessionLnjpit — LNJPIT Anonymous Campus Confessions',
    short_name: 'LNJPIT Confess',
    description:
      'Verified LNJPIT Chapra student portal for 100% anonymous campus confessions, crush signals, hostel stories, and peer discussions.',
    start_url: '/feed',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'en',
    categories: ['social', 'lifestyle', 'education'],
    background_color: '#F4F3EF',
    theme_color: '#FF6B00',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
