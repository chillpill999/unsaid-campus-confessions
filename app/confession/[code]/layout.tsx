import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

type Props = {
  params: { code: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = (params.code || '').trim().replace(/^#/, '');
  const baseUrl = 'https://www.confessionlnjpit.in';

  let confessionContent = 'Anonymous campus confession on ConfessionLnjpit.';
  let categoryName = 'Campus Story';

  try {
    const admin = createAdminClient();
    const { data: confession } = await admin
      .from('confessions')
      .select('content, categories(name)')
      .eq('public_code', code)
      .eq('is_deleted', false)
      .maybeSingle();

    if (confession) {
      confessionContent = confession.content
        ? confession.content.slice(0, 160) + (confession.content.length > 160 ? '...' : '')
        : confessionContent;
      const cat = Array.isArray(confession.categories)
        ? confession.categories[0]
        : confession.categories;
      if (cat?.name) categoryName = cat.name;
    }
  } catch (err) {
    console.warn('Metadata fetch note:', err);
  }

  const title = `Confession #${code} (${categoryName}) — LNJPIT Confessions`;
  const description = `"${confessionContent}" — Read full anonymous confession from Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra).`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/confession/${code}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/confession/${code}`,
      siteName: 'LNJPIT Campus Confessions',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ConfessionCodeLayout({ children }: Props) {
  return <>{children}</>;
}
