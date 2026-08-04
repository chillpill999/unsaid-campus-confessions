import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Campus Feed — LNJPIT Confessions',
  description:
    'Browse real-time anonymous confessions, crush signals, hostel stories, and student discussions from Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra).',
  alternates: {
    canonical: 'https://www.confessionlnjpit.in/feed',
  },
  openGraph: {
    title: 'Live Campus Feed | LNJPIT Confessions',
    description:
      'Real-time student confessions from Loknayak Jai Prakash Institute of Technology, Chapra.',
    url: 'https://www.confessionlnjpit.in/feed',
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
