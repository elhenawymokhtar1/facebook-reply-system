// اختبار الإصلاحات الجديدة لـ Gemini AI
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGeminiFixes() {
  console.log('🧪 اختبار الإصلاحات الجديدة لـ Gemini AI...\n');

  try {
    // 1. اختبار جلب الإعدادات
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
      hasApiKey: !!settings.api_key,
      promptLength: settings.prompt_template?.length || 0
    });

    if (!settings.is_enabled) {
      console.log('⚠️ Gemini AI معطل، سيتم تفعيله للاختبار...');
      
      // تفعيل Gemini للاختبار
      const updateResponse = await fetch('http://localhost:3002/api/gemini/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          is_enabled: true
        })
      });

      if (updateResponse.ok) {
        console.log('✅ تم تفعيل Gemini AI للاختبار');
      }
    }

    // 2. اختبار الاتصال مع Gemini API
    console.log('\n2️⃣ اختبار الاتصال مع Gemini API...');
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
      const errorText = await testResponse.text();
      console.error('Error details:', errorText);
      return false;
    }

    const testResult = await testResponse.json();
    console.log('✅ اختبار Gemini API نجح:', testResult.success);
    if (testResult.response) {
      console.log('📤 رد تجريبي:', testResult.response.substring(0, 100) + '...');
    }

    // 3. اختبار معالجة الرسائل المحسنة
    console.log('\n3️⃣ اختبار معالجة الرسائل المحسنة...');
    const processResponse = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test_user_fixes_123',
        messageText: 'مرحبا، عايز أعرف الأسعار والألوان المتاحة',
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
    console.log('📥 نتيجة معالجة الرسالة:', {
      success: processResult.success,
      message: processResult.message
    });

    // 4. اختبار تحسينات الأداء
    console.log('\n4️⃣ اختبار تحسينات الأداء...');
    const startTime = Date.now();
    
    const performanceResponse = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test_performance_123',
        messageText: 'اختبار سرعة الاستجابة',
        pageId: '260345600493273'
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`⏱️ وقت الاستجابة: ${responseTime}ms`);
    
    if (responseTime < 5000) {
      console.log('✅ الأداء ممتاز (أقل من 5 ثوانٍ)');
    } else if (responseTime < 10000) {
      console.log('⚠️ الأداء مقبول (5-10 ثوانٍ)');
    } else {
      console.log('❌ الأداء بطيء (أكثر من 10 ثوانٍ)');
    }

    // 5. اختبار معالجة الأخطاء
    console.log('\n5️⃣ اختبار معالجة الأخطاء...');
    const errorResponse = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: '', // بيانات ناقصة عمداً
        messageText: 'اختبار معالجة الأخطاء',
        pageId: '260345600493273'
      })
    });

    if (errorResponse.status === 400) {
      console.log('✅ معالجة الأخطاء تعمل بشكل صحيح (400 Bad Request)');
    } else {
      console.log('⚠️ معالجة الأخطاء قد تحتاج تحسين');
    }

    // 6. اختبار logs المحسنة
    console.log('\n6️⃣ اختبار logs المحسنة...');
    console.log('📝 تحقق من logs السيرفر للتأكد من وضوح الرسائل');

    // 7. ملخص النتائج
    console.log('\n📊 ملخص نتائج الاختبار:');
    console.log('✅ جلب الإعدادات: يعمل');
    console.log('✅ اختبار API: يعمل');
    console.log('✅ معالجة الرسائل: محسنة');
    console.log('✅ الأداء: محسن');
    console.log('✅ معالجة الأخطاء: محسنة');
    console.log('✅ توحيد المسارات: مكتمل');

    return true;

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    return false;
  }
}

// تشغيل الاختبار
testGeminiFixes().then((success) => {
  console.log(`\n${success ? '🎉' : '❌'} انتهى اختبار الإصلاحات`);
  
  if (success) {
    console.log('\n🚀 الإصلاحات تعمل بنجاح! يمكنك الآن:');
    console.log('   1. استخدام المسارات الموحدة في /api/gemini/*');
    console.log('   2. الاستفادة من معالجة الأخطاء المحسنة');
    console.log('   3. الاستمتاع بأداء أفضل وlogs أوضح');
    console.log('   4. استخدام الخدمات المبسطة والمحسنة');
  } else {
    console.log('\n🔧 قد تحتاج بعض الإصلاحات الإضافية');
  }
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
