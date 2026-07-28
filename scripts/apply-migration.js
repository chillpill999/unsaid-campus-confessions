/**
 * Apply Supabase Migration Script
 * Reads the SQL migration file and executes it against the live Supabase database
 * using the Supabase SQL API with the service role key.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'demo-service-role-key-placeholder') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set or is a placeholder.');
  console.error('');
  console.error('You MUST run this SQL manually in the Supabase Dashboard:');
  console.error('  1. Go to https://supabase.com/dashboard/project/prkecywvrficjylboior/sql/new');
  console.error('  2. Paste the contents of: supabase/migrations/20260727000000_init_schema.sql');
  console.error('  3. Click "Run"');
  console.error('');
  console.error('Or set the real service role key:');
  console.error('  set SUPABASE_SERVICE_ROLE_KEY=your-real-key && node scripts/apply-migration.js');
  process.exit(1);
}

async function applyMigration() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260727000000_init_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🔄 Applying migration to Supabase:', SUPABASE_URL);
  console.log('   SQL file:', migrationPath);
  console.log('   SQL length:', sql.length, 'characters');
  console.log('');

  // Use the Supabase SQL API endpoint (requires service role key)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  // If RPC endpoint doesn't work, try the pg-meta SQL endpoint
  if (!response.ok) {
    console.log('⚠️  RPC endpoint unavailable, trying pg-meta SQL endpoint...');
    
    const pgResponse = await fetch(`${SUPABASE_URL}/pg/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!pgResponse.ok) {
      const errText = await pgResponse.text();
      console.error('❌ pg-meta SQL endpoint also failed:', pgResponse.status, errText);
      console.error('');
      console.error('⚠️  MANUAL ACTION REQUIRED:');
      console.error('   The Supabase REST API cannot execute DDL SQL remotely.');
      console.error('   You MUST run the migration SQL manually:');
      console.error('');
      console.error('   1. Open: https://supabase.com/dashboard/project/prkecywvrficjylboior/sql/new');
      console.error('   2. Paste the contents of: supabase/migrations/20260727000000_init_schema.sql');
      console.error('   3. Click "Run"');
      console.error('');
      console.error('   After running, your confessions will persist permanently across all devices.');
      process.exit(1);
    }

    const pgResult = await pgResponse.json();
    console.log('✅ Migration applied via pg-meta:', JSON.stringify(pgResult).slice(0, 200));
    return;
  }

  const result = await response.json();
  console.log('✅ Migration applied:', JSON.stringify(result).slice(0, 200));
}

applyMigration().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  console.error('');
  console.error('⚠️  MANUAL ACTION REQUIRED:');
  console.error('   1. Open: https://supabase.com/dashboard/project/prkecywvrficjylboior/sql/new');
  console.error('   2. Paste the contents of: supabase/migrations/20260727000000_init_schema.sql');
  console.error('   3. Click "Run"');
  process.exit(1);
});
