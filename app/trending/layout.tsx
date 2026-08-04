import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending Stories & Hot Polls — LNJPIT Confessions',
  description:
    'Discover top-voted confessions, viral campus polls, and most discussed stories at Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra).',
  alternates: {
    canonical: 'https://www.confessionlnjpit.in/trending',
  },
  openGraph: {
    title: 'Trending Stories & Hot Polls | LNJPIT Confessions',
    description: 'Most popular student confessions at LNJPIT Chapra.',
    url: 'https://www.confessionlnjpit.in/trending',
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
