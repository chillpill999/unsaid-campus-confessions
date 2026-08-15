import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { JsonLd } from '@/components/json-ld';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.confessionlnjpit.in'),
  title: {
    default: 'LNJPIT Confession — Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra)',
    template: '%s | LNJPIT Confession',
  },
  description:
    'The official 100% anonymous campus portal for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar). Share anonymous LNJPIT confessions, crush signals, hostel stories, and campus discussions safely.',
  applicationName: 'ConfessionLnjpit',
  authors: [{ name: 'LNJPIT Student Community' }],
  generator: 'Next.js',
  keywords: [
    'LNJPIT confession',
    'Lnjpit confession',
    'lnjpit confessions',
    'LNJPIT Chapra',
    'Loknayak Jai Prakash Institute of Technology',
    'Loknayak Jai Prakash Institute of Technology Chapra',
    'LNJPIT campus confessions',
    'LNJPIT hostel stories',
    'LNJPIT crushes',
    'LNJPIT engineering college Bihar',
    'unsaid lnjpit',
    'confession lnjpit',
    'LNJPIT student portal',
    'LNJPIT anonymous chat',
    'LNJPIT Chapra confession page',
    'LNJPIT college life',
    'confessionlnjpit.in',
    'LNJPIT CSE',
    'LNJPIT FPP',
    'LNJPIT Civil',
    'LNJPIT Mechanical',
    'LNJPIT Electrical',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'LNJPIT Campus Community',
  publisher: 'ConfessionLnjpit',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.confessionlnjpit.in',
  },
  openGraph: {
    title: 'LNJPIT Confession — Loknayak Jai Prakash Institute of Technology (Chapra)',
    description:
      'Official 100% anonymous student platform for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar). Confessions, crush signals, hostel life & peer support.',
    url: 'https://www.confessionlnjpit.in',
    siteName: 'ConfessionLnjpit',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LNJPIT Confession — Loknayak Jai Prakash Institute of Technology (Chapra)',
    description:
      'The anonymous space for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra) campus stories, crushes, and confessions.',
    creator: '@lnjpit_confessions',
  },
  category: 'Education & Student Community',
  verification: {
    google: 'google697f9ae4698f26f3',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF6B00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="preconnect" href="https://prkecywvrficjylboior.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://prkecywvrficjylboior.supabase.co" />
        <link rel="mcp-actions" href="/mcp-actions.json" />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  where: { href_matches: '/*' },
                  eagerness: 'moderate',
                },
              ],
            }),
          }}
        />
        <JsonLd />
      </head>
      <body className="bg-[#F4F3EF] text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white">
        {children}
      </body>
    </html>
  );
}
