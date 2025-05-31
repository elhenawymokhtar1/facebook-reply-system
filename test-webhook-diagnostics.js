#!/usr/bin/env node

/**
 * 🧪 اختبار شامل لنظام تشخيص الـ Webhook
 * يختبر جميع endpoints ووظائف التشخيص
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
    console.log('\n📊 اختبار Stats Endpoint...'.yellow);
    try {
      const statsResponse = await axios.get(`${WEBHOOK_URL}/stats`);
      
      if (statsResponse.status === 200) {
        console.log('✅ Stats Endpoint يعمل بنجاح'.green);
        console.log(`   📊 البيانات المتاحة:`.gray);
        console.log(`   - messagesReceived: ${statsResponse.data.messagesReceived}`.gray);
        console.log(`   - startTime: ${statsResponse.data.startTime}`.gray);
        console.log(`   - memory: ${JSON.stringify(statsResponse.data.memory)}`.gray);
        results.webhookStats = true;
      }
    } catch (error) {
      console.log('❌ Stats Endpoint فشل'.red);
      console.log(`   خطأ: ${error.message}`.red);
      results.errors.push(`Stats: ${error.message}`);
    }

    // 3. اختبار Test Endpoint
    console.log('\n🧪 اختبار Test Endpoint...'.yellow);
    try {
      const testResponse = await axios.post(`${WEBHOOK_URL}/test`);
      
      if (testResponse.status === 200) {
        console.log('✅ Test Endpoint يعمل بنجاح'.green);
        console.log(`   📝 الاستجابة: ${testResponse.data.message}`.gray);
        results.webhookTest = true;
      }
    } catch (error) {
      console.log('❌ Test Endpoint فشل'.red);
      console.log(`   خطأ: ${error.message}`.red);
      results.errors.push(`Test: ${error.message}`);
    }

    // 4. اختبار ngrok Status
    console.log('\n🌐 اختبار ngrok Status...'.yellow);
    try {
      const ngrokResponse = await axios.get(NGROK_API_URL);
      
      if (ngrokResponse.status === 200) {
        const tunnels = ngrokResponse.data.tunnels;
        const webhookTunnel = tunnels.find(t => 
          t.config?.addr === 'http://localhost:3001'
        );
        
        if (webhookTunnel) {
          console.log('✅ ngrok متصل بنجاح'.green);
          console.log(`   🔗 الرابط العام: ${webhookTunnel.public_url}`.green);
          console.log(`   📊 الإحصائيات:`.gray);
          console.log(`   - الاتصالات: ${webhookTunnel.metrics?.conns?.count || 0}`.gray);
          console.log(`   - البيانات المرسلة: ${webhookTunnel.metrics?.http?.count || 0}`.gray);
          results.ngrokStatus = true;
        } else {
          console.log('⚠️ ngrok يعمل لكن لا يوجد tunnel للـ webhook'.yellow);
          console.log(`   📋 الـ tunnels المتاحة: ${tunnels.length}`.gray);
          tunnels.forEach(tunnel => {
            console.log(`   - ${tunnel.public_url} -> ${tunnel.config.addr}`.gray);
          });
        }
      }
    } catch (error) {
      console.log('❌ ngrok غير متاح'.red);
      console.log(`   خطأ: ${error.message}`.red);
      results.errors.push(`ngrok: ${error.message}`);
    }

    // 5. اختبار إرسال رسالة حقيقية
    console.log('\n📨 اختبار إرسال رسالة حقيقية...'.yellow);
    try {
      const testMessage = {
        object: 'page',
        entry: [{
          id: '260345600493273',
          messaging: [{
            sender: { id: `test_diagnostics_${Date.now()}` },
            recipient: { id: '260345600493273' },
            timestamp: Date.now(),
            message: {
              mid: `test_diagnostics_${Date.now()}`,
              text: `🧪 رسالة اختبار التشخيص - ${new Date().toLocaleTimeString('ar-EG')}`
            }
          }]
        }]
      };

      const messageResponse = await axios.post(`${WEBHOOK_URL}/webhook`, testMessage);
      
      if (messageResponse.status === 200) {
        console.log('✅ إرسال الرسالة نجح'.green);
        
        // انتظار ثانية واحدة ثم فحص الإحصائيات
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedHealthResponse = await axios.get(`${WEBHOOK_URL}/health`);
        console.log(`   📊 الرسائل بعد الاختبار: ${updatedHealthResponse.data.messagesReceived}`.gray);
      }
    } catch (error) {
      console.log('❌ إرسال الرسالة فشل'.red);
      console.log(`   خطأ: ${error.message}`.red);
      results.errors.push(`Message Test: ${error.message}`);
    }

  } catch (generalError) {
    console.log('❌ خطأ عام في الاختبار'.red);
    console.log(`   خطأ: ${generalError.message}`.red);
    results.errors.push(`General: ${generalError.message}`);
  }

  // عرض النتائج النهائية
  console.log('\n' + '='.repeat(50).gray);
  console.log('📋 ملخص نتائج الاختبار:'.cyan.bold);
  console.log('='.repeat(50).gray);

  const tests = [
    { name: 'Health Check', status: results.webhookHealth },
    { name: 'Stats Endpoint', status: results.webhookStats },
    { name: 'Test Endpoint', status: results.webhookTest },
    { name: 'ngrok Status', status: results.ngrokStatus }
  ];

  tests.forEach(test => {
    const icon = test.status ? '✅' : '❌';
    const color = test.status ? 'green' : 'red';
    console.log(`${icon} ${test.name}`[color]);
  });

  const passedTests = tests.filter(t => t.status).length;
  const totalTests = tests.length;
  
  console.log('\n📊 النتيجة النهائية:'.cyan);
  console.log(`   نجح: ${passedTests}/${totalTests} اختبار`.green);
  
  if (results.errors.length > 0) {
    console.log(`   أخطاء: ${results.errors.length}`.red);
    console.log('\n🔍 تفاصيل الأخطاء:'.red);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`.red);
    });
  }

  // توصيات
  console.log('\n💡 التوصيات:'.yellow.bold);
  
  if (!results.webhookHealth) {
    console.log('   🔧 شغل الـ Webhook: npm run webhook'.yellow);
  }
  
  if (!results.ngrokStatus) {
    console.log('   🌐 شغل ngrok: ngrok http 3001'.yellow);
  }
  
  if (passedTests === totalTests) {
    console.log('   🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.'.green.bold);
  }

  console.log('\n' + '='.repeat(50).gray);
}

// تشغيل الاختبار
testWebhookDiagnostics().catch(error => {
  console.error('❌ فشل في تشغيل الاختبار:', error.message);
  process.exit(1);
});
