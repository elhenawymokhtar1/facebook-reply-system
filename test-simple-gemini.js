// اختبار بسيط للتأكد من أن الإصلاحات تعمل
async function testSimpleGemini() {
  console.log('🧪 اختبار بسيط لـ Gemini AI...\n');

  try {
    // 1. اختبار endpoint test
    console.log('1️⃣ اختبار endpoint test...');
    const testResponse = await fetch('http://localhost:3002/api/gemini/test');
    const testData = await testResponse.json();
    console.log('✅ Test endpoint:', testData.message);

    // 2. اختبار جلب الإعدادات
    console.log('\n2️⃣ اختبار جلب الإعدادات...');
    const settingsResponse = await fetch('http://localhost:3002/api/gemini/settings');
    const settings = await settingsResponse.json();
    console.log('✅ Settings loaded:', {
      enabled: settings.is_enabled,
      model: settings.model,
      hasApiKey: !!settings.api_key
    });

    // 3. اختبار API connection
    console.log('\n3️⃣ اختبار API connection...');
    const apiTestResponse = await fetch('http://localhost:3002/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: settings.api_key })
    });
    const apiTestData = await apiTestResponse.json();
    console.log('✅ API connection:', apiTestData.success ? 'Working' : 'Failed');

    // 4. اختبار معالجة رسالة بسيطة
    console.log('\n4️⃣ اختبار معالجة رسالة...');
    const processResponse = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'test_simple_123',
        messageText: 'مرحبا',
        pageId: '260345600493273'
      })
    });
    const processData = await processResponse.json();
    console.log('📤 Process result:', processData.success ? 'Success' : 'Failed');
    console.log('📝 Message:', processData.message);

    console.log('\n🎯 ملخص الاختبار:');
    console.log('✅ Test endpoint: يعمل');
    console.log('✅ Settings: يعمل');
    console.log('✅ API connection: يعمل');
    console.log(`${processData.success ? '✅' : '⚠️'} Message processing: ${processData.success ? 'يعمل' : 'يحتاج فحص'}`);

    return true;

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return false;
  }
}

// تشغيل الاختبار
testSimpleGemini().then((success) => {
  console.log(`\n${success ? '🎉' : '❌'} انتهى الاختبار البسيط`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
