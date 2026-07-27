import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConfessionLnjpit — LNJPIT Anonymous Campus Confessions',
  description: 'Say what you couldn’t say. Verified LNJPIT students, anonymous conversations.',
  keywords: ['LNJPIT confessions', 'anonymous campus', 'crushes', 'hostel stories', 'LNJPIT'],
  openGraph: {
    title: 'ConfessionLnjpit — LNJPIT Anonymous Campus Confessions',
    description: 'The anonymous space for Loknayak Jai Prakash Institute of Technology campus.',
    siteName: 'ConfessionLnjpit',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
