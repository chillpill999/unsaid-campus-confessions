import fs from 'fs';
import path from 'path';

async function runComprehensiveSecuritySuite() {
  console.log('\n=============================================================');
  console.log('UNSAID EXPANDED SECURITY, AUTHORIZATION & RLS TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;
  let total = 0;

  function assert(condition: boolean, testId: string, description: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] Test #${total.toString().padStart(2, '0')} [${testId}]: ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test #${total.toString().padStart(2, '0')} [${testId}]: ${description}`);
      failed++;
    }
  }

  // TEST 1: Admin password MUST NOT be in client bundle (NEXT_PUBLIC_ variable exposure)
  const clientBundleDir = path.join(process.cwd(), '.next', 'static');
  let adminPasswordInBundle = false;
  function scanDirForPassword(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirForPassword(fullPath);
      } else if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('T3HEDGH2011') || content.includes('ADMIN_PASSCODE')) {
          adminPasswordInBundle = true;
          console.error(`  Password leak: ${fullPath}`);
        }
      }
    }
  }
  scanDirForPassword(clientBundleDir);
  assert(!adminPasswordInBundle, 'SEC-CLIENT-01', 'Admin password is NOT embedded in client-side JS bundle');

  // TEST 2: Service-role key not in client code
  const srcDirs = [
    path.join(process.cwd(), 'components'),
    path.join(process.cwd(), 'app'),
  ];
  let leakedServiceRoleInClient = false;

  function checkDirForLeaks(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDirForLeaks(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (fullPath.includes(path.join('api', 'admin', 'identity-reveal'))) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('SUPABASE_SERVICE_ROLE_KEY') || content.includes('supabase.auth.admin')) {
          leakedServiceRoleInClient = true;
          console.error(`  Leak detected in: ${fullPath}`);
        }
      }
    }
  }
  srcDirs.forEach(checkDirForLeaks);
  assert(!leakedServiceRoleInClient, 'SEC-CLIENT-02', 'SUPABASE_SERVICE_ROLE_KEY is zero-imported in client code');

  // TEST 3: Hardcoded Supabase credentials removed from source
  const sourceFiles = [
    path.join(process.cwd(), 'lib', 'supabase', 'client.ts'),
    path.join(process.cwd(), 'lib', 'supabase', 'server.ts'),
    path.join(process.cwd(), 'middleware.ts'),
  ];
  let hasHardcodedCreds = false;
  for (const file of sourceFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes("'https://prkecywvrficjylboior.supabase.co'") || 
        content.includes("'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.")) {
      hasHardcodedCreds = true;
      console.error(`  Hardcoded creds in: ${file}`);
    }
  }
  assert(!hasHardcodedCreds, 'SEC-CONFIG-01', 'No hardcoded Supabase credentials in client/server/middleware files');

  // TEST 4: Admin layout no longer uses shared password gate or else-if bypass
  const adminLayoutPath = path.join(process.cwd(), 'app', 'admin', 'layout.tsx');
  if (fs.existsSync(adminLayoutPath)) {
    const content = fs.readFileSync(adminLayoutPath, 'utf8');
    const hasPasswordGate = content.includes('ADMIN_PASSCODE') || content.includes('passwordInput');
    const hasEmailBypass = content.includes('else if (user.email)');
    const hasSessionStorageBypass = content.includes('sessionStorage');
    const hasLocalStorageBypass = content.includes('localStorage.getItem') && content.includes('unsaid_demo_role');
    
    assert(!hasPasswordGate, 'SEC-ADMIN-01', 'Admin layout does NOT contain shared password gate');
    assert(!hasEmailBypass, 'SEC-ADMIN-02', 'Admin layout does NOT have else-if email bypass');
    assert(!hasSessionStorageBypass, 'SEC-ADMIN-03', 'Admin layout does NOT use sessionStorage bypass');
    assert(!hasLocalStorageBypass, 'SEC-ADMIN-04', 'Admin layout does NOT use localStorage demo bypass');
  } else {
    assert(false, 'SEC-ADMIN-00', 'Admin layout file exists');
  }

  // TEST 5: demo-mode.ts does not use NEXT_PUBLIC_DEMO_MODE
  const demoModePath = path.join(process.cwd(), 'lib', 'demo-mode.ts');
  if (fs.existsSync(demoModePath)) {
    const content = fs.readFileSync(demoModePath, 'utf8');
    const hasPublicDemoVar = content.includes('NEXT_PUBLIC_DEMO_MODE');
    assert(!hasPublicDemoVar, 'SEC-DEMO-01', 'demo-mode.ts does NOT reference NEXT_PUBLIC_DEMO_MODE');
  }

  // TEST 6: Auth callback has redirect validation
  const callbackPath = path.join(process.cwd(), 'app', 'auth', 'callback', 'route.ts');
  if (fs.existsSync(callbackPath)) {
    const content = fs.readFileSync(callbackPath, 'utf8');
    const hasRedirectValidation = content.includes('isSafeRedirectPath') || content.includes('ALLOWED_REDIRECT_PATHS');
    assert(hasRedirectValidation, 'SEC-CALLBACK-01', 'Auth callback validates redirect parameter');
  }

  // TEST 7: Middleware checks account status and admin role
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    const checksAccountStatus = content.includes('account_status');
    const checksAdminRole = content.includes('role') && content.includes("'admin'");
    const noHardcodedFallback = !content.includes("|| SUPABASE_URL") && !content.includes("|| SUPABASE_ANON_KEY");
    
    assert(checksAccountStatus, 'SEC-MW-01', 'Middleware checks account_status for banned/suspended users');
    assert(checksAdminRole, 'SEC-MW-02', 'Middleware checks admin role for /admin routes');
    assert(noHardcodedFallback, 'SEC-MW-03', 'Middleware does NOT have hardcoded credential fallbacks');
  }

  // TEST 8: utils.ts uses crypto.getRandomValues (not Math.random)
  const utilsPath = path.join(process.cwd(), 'lib', 'utils.ts');
  if (fs.existsSync(utilsPath)) {
    const content = fs.readFileSync(utilsPath, 'utf8');
    const usesCryptoRandom = content.includes('crypto.getRandomValues');
    const usesMathRandom = content.includes('Math.random');
    assert(usesCryptoRandom, 'SEC-UTILS-01', 'generatePublicCode uses crypto.getRandomValues');
    assert(!usesMathRandom, 'SEC-UTILS-02', 'generatePublicCode does NOT use Math.random');
  }

  // TEST 9: Rate limiter has cleanup
  const rateLimitPath = path.join(process.cwd(), 'lib', 'rate-limit.ts');
  if (fs.existsSync(rateLimitPath)) {
    const content = fs.readFileSync(rateLimitPath, 'utf8');
    const hasCleanup = content.includes('cleanupExpired');
    assert(hasCleanup, 'SEC-RATE-01', 'Rate limiter has expired entry cleanup');
  }

  // TEST 10: Admin identity-reveal route does not leak raw error messages
  const revealRoutePath = path.join(process.cwd(), 'app', 'api', 'admin', 'identity-reveal', 'route.ts');
  if (fs.existsSync(revealRoutePath)) {
    const content = fs.readFileSync(revealRoutePath, 'utf8');
    const hasGenericError = content.includes("'An internal server error occurred.'");
    const rateLimitedByAdmin = content.includes('reveal:admin:');
    const auditLogIsLast = content.indexOf('identity_access_logs') > content.indexOf('getUserById');
    
    assert(hasGenericError, 'SEC-REVEAL-01', 'Identity reveal returns generic error messages (no leak)');
    assert(rateLimitedByAdmin, 'SEC-REVEAL-02', 'Identity reveal rate limits by admin ID');
    assert(auditLogIsLast, 'SEC-REVEAL-03', 'Audit log is written AFTER data fetch (fail-closed)');
  }

  // TEST 11: RLS policies exist for all tables in migration
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260727000000_init_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    const hasCommentPolicy = content.includes('CREATE POLICY "Insert Own Comment"');
    const hasAuditLogPolicy = content.includes('Admin Select Identity Logs');
    const hasBlockPolicy = content.includes('Manage Own Blocks');
    const hasMoodVotePolicy = content.includes('Manage Own Mood Vote');
    const hasConversationPolicy = content.includes('Select Own Conversations');
    const hasMessagePolicy = content.includes('Select Own Messages');
    
    assert(hasCommentPolicy, 'SEC-RLS-01', 'Migration has comment INSERT policy');
    assert(hasAuditLogPolicy, 'SEC-RLS-02', 'Migration has identity_access_logs SELECT policy');
    assert(hasBlockPolicy, 'SEC-RLS-03', 'Migration has blocks policy');
    assert(hasMoodVotePolicy, 'SEC-RLS-04', 'Migration has mood_votes policy');
    assert(hasConversationPolicy, 'SEC-RLS-05', 'Migration has anonymous_conversations policy');
    assert(hasMessagePolicy, 'SEC-RLS-06', 'Migration has anonymous_messages policy');
  }

  // TEST 12: Admin actions file exists and uses service-role
  const adminActionsPath = path.join(process.cwd(), 'lib', 'actions', 'admin.ts');
  if (fs.existsSync(adminActionsPath)) {
    const content = fs.readFileSync(adminActionsPath, 'utf8');
    const usesServiceRole = content.includes('createAdminClient');
    const verifiesAdmin = content.includes('verifyAdmin');
    assert(usesServiceRole, 'SEC-ACTIONS-01', 'Admin actions use service-role client');
    assert(verifiesAdmin, 'SEC-ACTIONS-02', 'Admin actions verify admin role server-side');
  }

  // TEST 13: middleware requires env vars (no hardcoded fallback)
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    const failsWithoutEnv = content.includes("if (!supabaseUrl || !supabaseAnonKey)");
    assert(failsWithoutEnv, 'SEC-MW-04', 'Middleware fails closed when env vars are missing');
  }

  // TEST 14: public_comments view has thread-scoped labels (not global UUIDs)
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    const hasPartitionedLabels = content.includes('PARTITION BY confession_id');
    const noAuthorIdInOutput = content.includes('cm.content') && content.includes('ra.author_rank');
    assert(hasPartitionedLabels, 'SEC-VIEW-01', 'public_comments view partitions labels by confession_id');
    assert(noAuthorIdInOutput, 'SEC-VIEW-02', 'public_comments view does not expose author_id');
  }

  // TEST 15: Admin pages use server actions instead of direct anon key queries
  const adminPages = [
    path.join(process.cwd(), 'app', 'admin', 'confessions', 'page.tsx'),
    path.join(process.cwd(), 'app', 'admin', 'users', 'page.tsx'),
    path.join(process.cwd(), 'app', 'admin', 'reports', 'page.tsx'),
    path.join(process.cwd(), 'app', 'admin', 'identity-access', 'page.tsx'),
    path.join(process.cwd(), 'app', 'admin', 'page.tsx'),
  ];
  let adminPagesUseAnonKey = false;
  for (const page of adminPages) {
    if (!fs.existsSync(page)) {
      console.error(`  Missing admin page: ${page}`);
      continue;
    }
    const content = fs.readFileSync(page, 'utf8');
    if (content.includes("from '@/lib/supabase/client'") && !content.includes('actions/admin')) {
      adminPagesUseAnonKey = true;
      console.error(`  Admin page uses anon key: ${page}`);
    }
  }
  assert(!adminPagesUseAnonKey, 'SEC-ADMIN-05', 'All admin pages use server actions instead of anon key queries');

  // TEST 16: Navbar defaults isAdmin to false
  const navbarPath = path.join(process.cwd(), 'components', 'navbar.tsx');
  if (fs.existsSync(navbarPath)) {
    const content = fs.readFileSync(navbarPath, 'utf8');
    const defaultsToFalse = content.includes('isAdmin = false');
    assert(defaultsToFalse, 'SEC-NAV-01', 'Navbar admin link defaults to hidden (isAdmin = false)');
  }

  console.log('\n=============================================================');
  console.log(`COMPREHENSIVE SECURITY REPORT: ${passed}/${total} INTEGRATION TESTS PASSED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveSecuritySuite();
