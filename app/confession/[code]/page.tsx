import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import ConfessionDetailClient from '@/components/confession-detail-client';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cleanCode = (params?.code || '').trim().replace(/^#/, '').toUpperCase();
  let title = `LNJPIT Confession #${cleanCode} — Loknayak Jai Prakash Institute of Technology`;
  let description = `Read anonymous LNJPIT student confession #${cleanCode} on ConfessionLnjpit, the official campus portal for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar).`;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params?.code || '');
    let confQuery = admin
      .from('confessions')
      .select('content, category_id, created_at')
      .eq('moderation_status', 'approved')
      .eq('is_deleted', false);

    if (isUuid) {
      confQuery = confQuery.or(`public_code.ilike.${cleanCode},id.eq.${cleanCode}`);
    } else {
      confQuery = confQuery.ilike('public_code', cleanCode);
    }

    const { data: conf } = await confQuery.maybeSingle();

    if (conf && conf.content) {
      const snippet = conf.content.slice(0, 140).trim();
      title = `LNJPIT Confession #${cleanCode}: "${snippet.slice(0, 50)}..."`;
      description = `"${snippet}" — Anonymous student confession from Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra).`;
    }
  } catch (err) {
    console.warn('Metadata generation note:', err);
  }

  return {
    title,
    description,
    keywords: [
      `LNJPIT confession #${cleanCode}`,
      'LNJPIT confession',
      'Lnjpit confession',
      'LNJPIT Chapra',
      'Loknayak Jai Prakash Institute of Technology',
      'LNJPIT campus confessions',
      'unsaid lnjpit',
    ],
    openGraph: {
      title,
      description,
      url: `https://www.confessionlnjpit.in/confession/${cleanCode}`,
      siteName: 'ConfessionLnjpit',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.confessionlnjpit.in/confession/${cleanCode}`,
    },
  };
}

export default function ConfessionPage({ params }: Props) {
  return <ConfessionDetailClient code={params.code} />;
}
