import { createClient } from '@supabase/supabase-js';
import { assertSafeEnvironmentForServiceRole } from '@/lib/demo-mode';

/**
 * Trusted Server-Only Supabase Admin Client.
 * STRICT SECURITY CONSTRAINTS:
 * 1. Must ONLY be imported in server-side API routes or Server Actions.
 * 2. Requires SUPABASE_SERVICE_ROLE_KEY which is NEVER exposed to client.
 * 3. Asserts safe environment (throws if called in Demo Mode).
 */
const DEFAULT_SUPABASE_URL = 'https://prkecywvrficjylboior.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTEzNjM1MywiZXhwIjoyMDAwNzEyMzUzfQ.fake-service-role-key';

export function createAdminClient() {
  assertSafeEnvironmentForServiceRole();

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = (envUrl && envUrl.startsWith('http')) ? envUrl : DEFAULT_SUPABASE_URL;
  const serviceRoleKey = (envServiceKey && !envServiceKey.includes('[SENSITIVE]')) ? envServiceKey : DEFAULT_SERVICE_ROLE_KEY;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
