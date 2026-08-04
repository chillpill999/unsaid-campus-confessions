import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines & Safety — LNJPIT Confessions',
  description:
    'Read the community code of conduct, safety policies, and posting rules for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra) anonymous portal.',
  alternates: {
    canonical: 'https://www.confessionlnjpit.in/guidelines',
  },
};

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
