const { suggestImage } = require('../services/guard.service');

// AI Generated
async function runGateCheck() {
  console.log('==============================================');
  console.log('🚦 Testing Phase 3 GATE Requirements');
  console.log('==============================================\n');

  // 1. اختبار قبول الثعلب
  console.log('Test 1: Fox Post (Expecting: Accepted with Fox Image)');
  const foxPost = 'A curious red fox sitting in the woods';
  const foxResult = await suggestImage(foxPost);
  console.log(foxResult.data);

  console.log('\n----------------------------------------------\n');

  // 2. اختبار رفض الذئب / عدم التطابق (الرفض الآمن)
  console.log('Test 2: Mismatch / Borderline Post (Expecting: Guard Refusal)');
  const unrelatedPost = 'Quantum computing chips architecture in 2026';
  const refuseResult = await suggestImage(unrelatedPost);
  console.log(refuseResult.data);

  console.log('\n==============================================');
  if (foxResult.data.success && !refuseResult.data.success) {
    console.log('✅ GATE PASSED: Fox matched, unrelated content safely refused.');
  } else {
    console.log('❌ GATE FAILED: Adjust your threshold or verify library embeddings.');
  }
  console.log('==============================================');
}

runGateCheck();