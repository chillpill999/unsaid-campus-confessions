import { createClient } from '@supabase/supabase-js';
import { assertSafeEnvironmentForServiceRole } from '@/lib/demo-mode';

/**
 * Trusted Server-Only Supabase Admin Client.
 * STRICT SECURITY CONSTRAINTS:
 * 1. Must ONLY be imported in server-side API routes or Server Actions.
 * 2. Requires SUPABASE_SERVICE_ROLE_KEY which is NEVER exposed to client.
 * 3. Asserts safe environment (throws if called in Demo Mode).
 */
export function createAdminClient() {
  assertSafeEnvironmentForServiceRole();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are missing in server environment.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
