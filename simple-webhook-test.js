#!/usr/bin/env node

/**
 * 🧪 اختبار بسيط لنظام تشخيص الـ Webhook
 */

import axios from 'axios';

const WEBHOOK_URL = 'http://localhost:3001';
const NGROK_API_URL = 'http://localhost:4040/api/tunnels';

console.log('🧪 بدء اختبار نظام تشخيص الـ Webhook');
console.log('='.repeat(50));

async function testWebhookDiagnostics() {
  const results = {
    webhookHealth: false,
    webhookStats: false,
    webhookTest: false,
    ngrokStatus: false,
    errors: []
  };

  try {
    // 1. اختبار Health Check
    console.log('\n📊 اختبار Health Check...');
    try {
      const healthResponse = await axios.get(`${WEBHOOK_URL}/health`);
      
      if (healthResponse.status === 200) {
        console.log('✅ Health Check يعمل بنجاح');
        console.log(`   📈 الإحصائيات:`);
        console.log(`   - الرسائل المستقبلة: ${healthResponse.data.messagesReceived}`);
        console.log(`   - آخر رسالة: ${healthResponse.data.lastMessageTime || 'لا توجد'}`);
        console.log(`   - وقت التشغيل: ${Math.floor(healthResponse.data.uptime)}s`);
        console.log(`   - الأخطاء: ${healthResponse.data.errors?.length || 0}`);
        results.webhookHealth = true;
      }
    } catch (error) {
      console.log('❌ Health Check فشل');
      console.log(`   خطأ: ${error.message}`);
      results.errors.push(`Health Check: ${error.message}`);
    }

    // 2. اختبار Stats Endpoint
    console.log('\n📊 اختبار Stats Endpoint...');
    try {
      const statsResponse = await axios.get(`${WEBHOOK_URL}/stats`);
      
      if (statsResponse.status === 200) {
        console.log('✅ Stats Endpoint يعمل بنجاح');
        console.log(`   📊 البيانات المتاحة:`);
        console.log(`   - messagesReceived: ${statsResponse.data.messagesReceived}`);
        console.log(`   - startTime: ${statsResponse.data.startTime}`);
        results.webhookStats = true;
      }
    } catch (error) {
      console.log('❌ Stats Endpoint فشل');
      console.log(`   خطأ: ${error.message}`);
      results.errors.push(`Stats: ${error.message}`);
    }

    // 3. اختبار Test Endpoint
    console.log('\n🧪 اختبار Test Endpoint...');
    try {
      const testResponse = await axios.post(`${WEBHOOK_URL}/test`);
      
      if (testResponse.status === 200) {
        console.log('✅ Test Endpoint يعمل بنجاح');
        console.log(`   📝 الاستجابة: ${testResponse.data.message}`);
        results.webhookTest = true;
      }
    } catch (error) {
      console.log('❌ Test Endpoint فشل');
      console.log(`   خطأ: ${error.message}`);
      results.errors.push(`Test: ${error.message}`);
    }

    // 4. اختبار ngrok Status
    console.log('\n🌐 اختبار ngrok Status...');
    try {
      const ngrokResponse = await axios.get(NGROK_API_URL);
      
      if (ngrokResponse.status === 200) {
        const tunnels = ngrokResponse.data.tunnels;
        const webhookTunnel = tunnels.find(t => 
          t.config?.addr === 'http://localhost:3001'
        );
        
        if (webhookTunnel) {
          console.log('✅ ngrok متصل بنجاح');
          console.log(`   🔗 الرابط العام: ${webhookTunnel.public_url}`);
          results.ngrokStatus = true;
        } else {
          console.log('⚠️ ngrok يعمل لكن لا يوجد tunnel للـ webhook');
          console.log(`   📋 الـ tunnels المتاحة: ${tunnels.length}`);
        }
      }
    } catch (error) {
      console.log('❌ ngrok غير متاح');
      console.log(`   خطأ: ${error.message}`);
      results.errors.push(`ngrok: ${error.message}`);
    }

  } catch (generalError) {
    console.log('❌ خطأ عام في الاختبار');
    console.log(`   خطأ: ${generalError.message}`);
    results.errors.push(`General: ${generalError.message}`);
  }

  // عرض النتائج النهائية
  console.log('\n' + '='.repeat(50));
  console.log('📋 ملخص نتائج الاختبار:');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Health Check', status: results.webhookHealth },
    { name: 'Stats Endpoint', status: results.webhookStats },
    { name: 'Test Endpoint', status: results.webhookTest },
    { name: 'ngrok Status', status: results.ngrokStatus }
  ];

  tests.forEach(test => {
    const icon = test.status ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
  });

  const passedTests = tests.filter(t => t.status).length;
  const totalTests = tests.length;
  
  console.log(`\n📊 النتيجة النهائية: نجح ${passedTests}/${totalTests} اختبار`);
  
  if (results.errors.length > 0) {
    console.log(`\n🔍 الأخطاء (${results.errors.length}):`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // توصيات
  console.log('\n💡 التوصيات:');
  
  if (!results.webhookHealth) {
    console.log('   🔧 شغل الـ Webhook: npm run webhook');
  }
  
  if (!results.ngrokStatus) {
    console.log('   🌐 شغل ngrok: ngrok http 3001');
  }
  
  if (passedTests === totalTests) {
    console.log('   🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
  }

  console.log('\n' + '='.repeat(50));
}

// تشغيل الاختبار
testWebhookDiagnostics().catch(error => {
  console.error('❌ فشل في تشغيل الاختبار:', error.message);
  process.exit(1);
});
