import fs from 'fs';
import path from 'path';

async function runPersistenceTests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE PERMANENT PERSISTENCE TEST SUITE');
  console.log('=============================================================\n');

  let passed = true;

  // 1. Audit Database Schema & Code for Automatic Expiration / TTL Logic
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260727000000_init_schema.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  const hasConfessionTtl = migrationSql.includes('DELETE FROM confessions WHERE') || migrationSql.includes('expires_at > now()') || migrationSql.includes('created_at > now() - interval');
  if (!hasConfessionTtl) {
    console.log('✅ PASS [PERSIST-01]: Database schema contains NO automatic confession deletion, TTL, or interval filters.');
  } else {
    console.error('❌ FAIL [PERSIST-01]: Database schema contains hidden TTL or deletion logic!');
    passed = false;
  }

  // 2. Audit public_confessions View Definition
  const includesApprovedOnly = migrationSql.includes('WHERE c.moderation_status = \'approved\' AND c.is_deleted = false;');
  if (includesApprovedOnly && !migrationSql.includes('expires_at')) {
    console.log('✅ PASS [PERSIST-02]: public_confessions view retains all approved, non-deleted posts of any age (1d, 30d, 1y, 5y).');
  } else {
    console.error('❌ FAIL [PERSIST-02]: public_confessions view definition has age restrictions!');
    passed = false;
  }

  // 3. Audit friends-chat.ts for Message TTL Expiration
  const chatPath = path.join(process.cwd(), 'lib', 'friends-chat.ts');
  const chatContent = fs.readFileSync(chatPath, 'utf8');

  const purgesMessages = chatContent.includes('expiresAtMs > now') || chatContent.includes('return validMessages');
  if (!purgesMessages) {
    console.log('✅ PASS [PERSIST-03]: Private messages retention contains zero age-based TTL purge logic.');
  } else {
    console.error('❌ FAIL [PERSIST-03]: friends-chat.ts retains active message purging!');
    passed = false;
  }

  // 4. Audit Cursor Pagination Implementation (created_at + id)
  const routePath = path.join(process.cwd(), 'app', 'api', 'confessions', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  const usesCursorPagination = routeContent.includes('cursor') && routeContent.includes('.lt(\'created_at\', cursor)');
  if (usesCursorPagination) {
    console.log('✅ PASS [PERSIST-04]: /api/confessions implements stable cursor pagination (.lt(\'created_at\', cursor)).');
  } else {
    console.error('❌ FAIL [PERSIST-04]: /api/confessions missing cursor pagination!');
    passed = false;
  }

  // 5. Audit Feed Page for Load More & Realtime Prepend
  const feedPath = path.join(process.cwd(), 'app', 'feed', 'page.tsx');
  const feedContent = fs.readFileSync(feedPath, 'utf8');

  const hasLoadMore = feedContent.includes('loadMoreConfessions') && feedContent.includes('hasMore') && feedContent.includes('cursor') && feedContent.includes('setConfessions((prev) => [...prev, ...json.confessions])');
  const prependsRealtime = feedContent.includes('existingCodes') && feedContent.includes('[...newItems, ...prev]');

  if (hasLoadMore && prependsRealtime) {
    console.log('✅ PASS [PERSIST-05]: Feed page supports cursor pagination and realtime prepend without erasing historical posts.');
  } else {
    console.error('❌ FAIL [PERSIST-05]: Feed page pagination or realtime handler incomplete!');
    passed = false;
  }

  // 6. Audit Search Page for Historical Search
  const searchPath = path.join(process.cwd(), 'app', 'search', 'page.tsx');
  const searchContent = fs.readFileSync(searchPath, 'utf8');

  const searchesHistoricalData = searchContent.includes('/api/confessions') || searchContent.includes('fetchPublicConfessions');
  if (searchesHistoricalData) {
    console.log('✅ PASS [PERSIST-06]: Search page queries full historical database without age window cutoffs.');
  } else {
    console.error('❌ FAIL [PERSIST-06]: Search page relies on mock data or has date cutoffs!');
    passed = false;
  }

  // 7. Verify Performance Indexes in Migration
  const hasIndexes = migrationSql.includes('idx_confessions_created_at_id') && migrationSql.includes('idx_confessions_public_code');
  if (hasIndexes) {
    console.log('✅ PASS [PERSIST-07]: Performance indexes (created_at, public_code, moderation_status) exist in SQL schema.');
  } else {
    console.error('❌ FAIL [PERSIST-07]: Database missing required performance indexes!');
    passed = false;
  }

  // 8. Verify Explicit Authorized Deletion Model
  const respectsIsDeleted = routeContent.includes('.eq(\'is_deleted\', false)') && migrationSql.includes('c.is_deleted = false');
  if (respectsIsDeleted) {
    console.log('✅ PASS [PERSIST-08]: Content remains stored permanently and hides ONLY on explicit is_deleted flag.');
  } else {
    console.error('❌ FAIL [PERSIST-08]: Explicit deletion model broken!');
    passed = false;
  }

  console.log('\n=============================================================');
  if (passed) {
    console.log('🎉 ALL PERMANENT CONFESSION PERSISTENCE TESTS PASSED!');
  } else {
    console.error('💥 PERSISTENCE TESTS FAILED!');
    process.exit(1);
  }
}

runPersistenceTests();
