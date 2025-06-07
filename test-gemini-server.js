// اختبار Gemini عبر السيرفر
async function testGeminiServer() {
  console.log('🧪 اختبار Gemini عبر السيرفر...\n');

  try {
    // 1. اختبار إعدادات Gemini
    console.log('1️⃣ اختبار جلب إعدادات Gemini...');
    const settingsResponse = await fetch('http://localhost:3002/api/gemini/settings');
    
    if (!settingsResponse.ok) {
      console.error('❌ فشل في جلب الإعدادات:', settingsResponse.status);
      return false;
    }

    const settings = await settingsResponse.json();
    console.log('✅ إعدادات Gemini:', {
      enabled: settings.is_enabled,
      model: settings.model,
      hasApiKey: !!settings.api_key
    });

    // 2. اختبار Gemini API مباشرة
    console.log('\n2️⃣ اختبار Gemini API مباشرة...');
    const testResponse = await fetch('http://localhost:3002/api/gemini/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: settings.api_key
      })
    });

    if (!testResponse.ok) {
      console.error('❌ فشل اختبار Gemini API:', testResponse.status);
      return false;
    }

    const testResult = await testResponse.json();
    console.log('✅ اختبار Gemini API نجح:', testResult.success);
    console.log('📤 رد تجريبي:', testResult.response?.substring(0, 100) + '...');

    // 3. اختبار معالجة الرسائل
    console.log('\n3️⃣ اختبار معالجة الرسائل...');
    const processResponse = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test_user_123',
        messageText: 'مرحبا، عايز أعرف الأسعار',
        pageId: '260345600493273'
      })
    });

    if (!processResponse.ok) {
      console.error('❌ فشل في معالجة الرسالة:', processResponse.status);
      const errorText = await processResponse.text();
      console.error('Error details:', errorText);
      return false;
    }

    const processResult = await processResponse.json();
    console.log('📥 نتيجة معالجة الرسالة:', processResult);

    if (processResult.success) {
      console.log('✅ تم معالجة الرسالة بنجاح!');
      return true;
    } else {
      console.log('❌ فشل في معالجة الرسالة:', processResult.message);
      return false;
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    return false;
  }
}

// تشغيل الاختبار
testGeminiServer().then((success) => {
  console.log(`\n${success ? '✅' : '❌'} انتهى اختبار السيرفر`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
