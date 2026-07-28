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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#F4F3EF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F4F3EF] text-slate-900 min-h-screen flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white">
        {children}
      </body>
    </html>
  );
}
