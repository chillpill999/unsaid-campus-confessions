import { createClient } from '@supabase/supabase-js';
import { assertSafeEnvironmentForServiceRole } from '@/lib/demo-mode';

/**
 * Trusted Server-Only Supabase Admin Client.
 * STRICT SECURITY CONSTRAINTS:
 * 1. Must ONLY be imported in server-side API routes or Server Actions.
 * 2. Requires SUPABASE_SERVICE_ROLE_KEY which is NEVER exposed to the client.
 * 3. Asserts safe environment (throws if called in Demo Mode).
 * 4. FAILS CLOSED: throws if the service-role key is not configured rather than
 *    silently falling back to an (invalid) hardcoded key.
 */
const DEFAULT_SUPABASE_URL = 'https://prkecywvrficjylboior.supabase.co';

export function createAdminClient() {
  assertSafeEnvironmentForServiceRole();

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.includes('[SENSITIVE]')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Set it as a server-only ' +
      'environment variable; it must never be shipped to, or hardcoded for, the client.'
    );
  }

  const url = (envUrl && envUrl.startsWith('http')) ? envUrl : DEFAULT_SUPABASE_URL;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
