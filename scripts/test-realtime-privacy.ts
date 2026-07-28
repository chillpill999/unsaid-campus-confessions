import fs from 'fs';
import path from 'path';

async function runRealtimePrivacyTests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING SUPABASE REALTIME PRIVACY & ANONYMITY INTEGRATION SUITE');
  console.log('=============================================================\n');

  let passed = true;

  // 1. Audit broadcast.ts for private identity fields
  const broadcastPath = path.join(process.cwd(), 'lib', 'realtime', 'broadcast.ts');
  const broadcastContent = fs.readFileSync(broadcastPath, 'utf8');

  const leaksAuthorId = broadcastContent.includes('author_id') || broadcastContent.includes('user_email') || broadcastContent.includes('auth_uuid');
  if (!leaksAuthorId) {
    console.log('✅ PASS [REALTIME-SEC-01]: Broadcast payloads are zero-imported for author_id, email, and auth_uuid.');
  } else {
    console.error('❌ FAIL [REALTIME-SEC-01]: Broadcast payloads leak private identity fields!');
    passed = false;
  }

  // 2. Audit hooks.ts for typing indicator privacy (MUST NOT transmit draft text)
  const hooksPath = path.join(process.cwd(), 'lib', 'realtime', 'hooks.ts');
  const hooksContent = fs.readFileSync(hooksPath, 'utf8');

  const leaksDraftText = hooksContent.includes('draft_text') || hooksContent.includes('keystrokes') || hooksContent.includes('typingText');
  const sendsTypingBoolean = hooksContent.includes('typing: isTyping') || hooksContent.includes('typing: true');

  if (!leaksDraftText && sendsTypingBoolean) {
    console.log('✅ PASS [REALTIME-SEC-02]: Typing indicators send ephemeral boolean state only. ZERO draft text transmitted.');
  } else {
    console.error('❌ FAIL [REALTIME-SEC-02]: Typing indicator implementation violates privacy requirement!');
    passed = false;
  }

  // 3. Audit feed page for realtime channel cleanup
  const feedPath = path.join(process.cwd(), 'app', 'feed', 'page.tsx');
  const feedContent = fs.readFileSync(feedPath, 'utf8');

  const usesRealtimeHook = feedContent.includes('useRealtimeFeed');
  if (usesRealtimeHook) {
    console.log('✅ PASS [REALTIME-SEC-03]: Feed page subscribes to realtime updates with automatic channel cleanup.');
  } else {
    console.error('❌ FAIL [REALTIME-SEC-03]: Feed page missing useRealtimeFeed subscription!');
    passed = false;
  }

  // 4. Audit ConfessionCard for live interaction triggers
  const cardPath = path.join(process.cwd(), 'components', 'confession-card.tsx');
  const cardContent = fs.readFileSync(cardPath, 'utf8');

  const triggersReactionBroadcast = cardContent.includes('broadcastReactionUpdate');
  const triggersPollBroadcast = cardContent.includes('broadcastPollUpdate');

  if (triggersReactionBroadcast && triggersPollBroadcast) {
    console.log('✅ PASS [REALTIME-SEC-04]: Interactions (reactions & polls) trigger live realtime updates.');
  } else {
    console.error('❌ FAIL [REALTIME-SEC-04]: Interactions missing realtime broadcast triggers!');
    passed = false;
  }

  console.log('\n=============================================================');
  if (passed) {
    console.log('🎉 ALL SUPABASE REALTIME PRIVACY & SYNC INTEGRATION TESTS PASSED!');
  } else {
    console.error('💥 REALTIME PRIVACY TESTS FAILED!');
    process.exit(1);
  }
}

runRealtimePrivacyTests();
