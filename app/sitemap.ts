import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.confessionlnjpit.in';

  // Static routes with priorities and change frequencies
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guidelines`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  // Dynamic confession URLs
  let confessionRoutes: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data: confessions } = await admin
      .from('confessions')
      .select('public_code, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(500);

    if (confessions && confessions.length > 0) {
      confessionRoutes = confessions.map((c: any) => ({
        url: `${baseUrl}/confession/${c.public_code}`,
        lastModified: c.created_at ? new Date(c.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.warn('Sitemap dynamic confession fetch note:', err);
  }

  return [...staticRoutes, ...confessionRoutes];
}
