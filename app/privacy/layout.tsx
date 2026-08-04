import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100% Anonymity & Privacy Policy — LNJPIT Confessions',
  description:
    'Learn how LNJPIT Confessions protects student privacy, ensures complete anonymity, and secures your data with zero identity tracking.',
  alternates: {
    canonical: 'https://www.confessionlnjpit.in/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
