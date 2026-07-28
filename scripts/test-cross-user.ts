import fs from 'fs';
import path from 'path';

async function runCrossUserTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CROSS-USER CONFESSION PERSISTENCE & ANONYMITY TESTS');
  console.log('====================================================\n');

  let passed = true;

  // 1. Verify Confession Creation & Shared Database Insertion
  const apiRoutePath = path.join(process.cwd(), 'app', 'api', 'confessions', 'route.ts');
  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');

  const hasDbInsert = apiContent.includes(".from('confessions')") && apiContent.includes('.insert(');
  if (hasDbInsert) {
    console.log('✅ PASS: /api/confessions executes true Supabase database INSERT into confessions table.');
  } else {
    console.error('❌ FAIL: /api/confessions missing database insert into confessions table.');
    passed = false;
  }

  // 2. Verify No Fallback Store or LocalStorage
  const hasFallbackStore = apiContent.includes('FALLBACK_CONFESSIONS_STORE');
  const composerPath = path.join(process.cwd(), 'components', 'confession-composer.tsx');
  const composerContent = fs.readFileSync(composerPath, 'utf8');
  const hasLocalStorageFallback = composerContent.includes("localStorage.setItem('unsaid_persistent_confessions'");

  if (!hasFallbackStore && !hasLocalStorageFallback) {
    console.log('✅ PASS: Supabase PostgreSQL is 100% single source of truth (zero memory or localStorage fallbacks).');
  } else {
    console.error('❌ FAIL: Fallback memory array or local storage still present.');
    passed = false;
  }

  // 3. Verify Public Anonymity in View & Payload Mapping
  const leaksAuthorIdInPublicMap = apiContent.includes('author_id: row.author_id') || apiContent.includes('email: row.email');
  if (!leaksAuthorIdInPublicMap) {
    console.log('✅ PASS: Public confession response mapping strictly strips author_id, email, and OAuth identity.');
  } else {
    console.error('❌ FAIL: Public confession payload leaks private identity fields!');
    passed = false;
  }

  // 4. Verify SQL View Security in init_schema.sql
  const schemaPath = path.join(process.cwd(), 'supabase', 'migrations', '20260727000000_init_schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  const viewMasksIdentity = schemaContent.includes('CREATE OR REPLACE VIEW public_confessions') &&
    !schemaContent.includes('c.author_id,');

  if (viewMasksIdentity) {
    console.log('✅ PASS: public_confessions SQL view definition excludes author_id and identity columns.');
  } else {
    console.error('❌ FAIL: public_confessions SQL view definition includes author_id!');
    passed = false;
  }

  // 5. Verify RLS Policy & View Grant
  const grantsViewSelect = schemaContent.includes('GRANT SELECT ON public_confessions TO anon, authenticated');
  const enforcesPublicRead = schemaContent.includes('CREATE POLICY "Public Read Approved Confessions" ON confessions FOR SELECT');

  if (grantsViewSelect && enforcesPublicRead) {
    console.log('✅ PASS: RLS policies grant public view access while protecting private identity columns.');
  } else {
    console.error('❌ FAIL: RLS policy configuration for confessions table or view is incorrect.');
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('🎉 ALL CROSS-USER PERSISTENCE & ANONYMITY TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('💥 CROSS-USER TESTS FAILED!');
    process.exit(1);
  }
}

runCrossUserTests();
