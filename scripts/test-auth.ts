import fs from 'fs';
import path from 'path';

const root = process.cwd();
let passed = 0;
let failed = 0;

function read(file: string) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`[PASS] ${label}`);
    passed++;
  } else {
    console.error(`[FAIL] ${label}`);
    failed++;
  }
}

function allSourceFiles(dir: string): string[] {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return [];

  return fs.readdirSync(fullDir, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    const full = path.join(root, rel);
    if (entry.isDirectory()) return allSourceFiles(rel);
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) return [full];
    return [];
  });
}

const login = read('app/login/page.tsx');
const feed = read('app/feed/page.tsx');
const onboarding = read('app/onboarding/page.tsx');
const middleware = read('middleware.ts');
const apiConfessions = read('app/api/confessions/route.ts');
const profileActions = read('lib/actions/profile.ts');
const feedActions = read('lib/actions/feed.ts');
const revealRoute = read('app/api/admin/identity-reveal/route.ts');
const demoMode = read('lib/demo-mode.ts');

const source = allSourceFiles('app')
  .concat(allSourceFiles('components'))
  .concat(allSourceFiles('lib'))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');

assert(!login.includes('Enter as Student'), 'Enter as Student button removed');
assert(!login.includes('Campus Administrator Access'), 'Separate admin login CTA removed');
assert(login.includes("provider: 'google'"), 'Login initiates Supabase Google OAuth');
assert(!login.includes('signInAnonymously'), 'Login does not use anonymous auth fallback');
assert(!login.includes('signInWithPassword'), 'Login does not use password-based student fallback');
assert(!login.includes('setSession('), 'Login does not create local app sessions');
assert(!login.includes('unsaid_session') && !login.includes('unsaid_demo_role'), 'Login does not write local auth state');
assert(login.includes('Google OAuth failed.'), 'OAuth errors fail closed with safe message');

assert(!feed.includes('unsaid_session') && !feed.includes('unsaid_demo_role'), 'Feed does not trust local auth state');
assert(feed.includes('supabase.auth.getUser()'), 'Feed verifies Supabase user before render');

assert(!onboarding.includes('unsaid_uid') && !onboarding.includes('unsaid_profile_'), 'Onboarding does not create local identity/profile ownership');
assert(onboarding.includes('createProfile'), 'Onboarding saves through authenticated server action');
assert(profileActions.includes('supabase.auth.getUser()'), 'Profile creation derives user server-side from Supabase auth');
assert(!profileActions.includes('createVerifiedStudentAccount'), 'Verified student account minting helper removed');

assert(middleware.includes('/feed') && middleware.includes('/admin') && middleware.includes('/confession'), 'Middleware protects authenticated routes');
assert(middleware.includes("account_status === 'banned'") && source.includes("profile?.role === 'admin'") && !middleware.includes("role !== 'admin'"), 'Admin authorization enforced server-side via trusted role');

assert(apiConfessions.includes("status: 401"), '/api/confessions returns 401 without auth');
assert(!apiConfessions.includes("authorId = '11111111-1111-1111-1111-111111111111'"), '/api/confessions does not fabricate author identity');
assert(apiConfessions.includes('const userId = user.id') && apiConfessions.includes('author_id: userId'), '/api/confessions derives author from Supabase user');
assert(feedActions.includes("throw new Error('Unauthorized')"), 'Feed server action rejects unauthenticated callers');

assert(!revealRoute.includes('MOCK_REVEALED_IDENTITIES') && !revealRoute.includes('Demo Student'), 'Identity Reveal has no demo success path');
assert(revealRoute.includes("profile?.role === 'admin'") && revealRoute.includes('Admin access required'), 'Identity Reveal checks trusted admin role');
assert(demoMode.includes("process.env.NODE_ENV === 'production'") && demoMode.includes('return false'), 'Demo mode is impossible in production');

assert(!source.includes('bypassAuth') && !source.includes('fakeSession') && !source.includes('demoLogin'), 'Known bypass markers absent from production source');
assert(!source.includes('localStorage.setItem(\'unsaid_session\'') && !source.includes('localStorage.setItem("unsaid_session"'), 'No localStorage auth session writes');
assert(!source.includes('localStorage.setItem(\'unsaid_demo_role\'') && !source.includes('localStorage.setItem("unsaid_demo_role"'), 'No localStorage role writes');

console.log(`\nAUTH REGRESSION REPORT: ${passed}/${passed + failed} checks passed`);

if (failed > 0) {
  process.exit(1);
}
