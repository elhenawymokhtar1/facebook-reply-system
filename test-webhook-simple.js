// اختبار بسيط للـ Webhook
const testCustomerMessage = {
  object: 'page',
  entry: [{
    id: '240244019177739', // صفحة سولا 127
    messaging: [{
      sender: { id: '123456789' }, // عميل تجريبي
      recipient: { id: '240244019177739' },
      timestamp: Date.now(),
      message: {
        mid: `test_customer_${Date.now()}`,
        text: `🧪 رسالة اختبار من العميل - ${new Date().toLocaleTimeString('ar-EG')}`
      }
    }]
  }]
};

const testModeratorMessage = {
  object: 'page',
  entry: [{
    id: '240244019177739', // صفحة سولا 127
    messaging: [{
      sender: { id: '240244019177739' },
      recipient: { id: '123456789' },
      timestamp: Date.now(),
      message: {
        mid: `test_moderator_${Date.now()}`,
        text: `🧪 رسالة اختبار من المودريتور - ${new Date().toLocaleTimeString('ar-EG')}`,
        is_echo: true,
        app_id: '123456789'
      }
    }]
  }]
};

async function testWebhook() {
  console.log('🧪 اختبار الـ Webhook...\n');

  try {
    // 1. اختبار رسالة العميل
    console.log('1️⃣ اختبار رسالة العميل...');
    const customerResponse = await fetch('http://localhost:3001/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCustomerMessage)
    });

    if (customerResponse.ok) {
      console.log('✅ تم إرسال رسالة العميل للـ Webhook');
    } else {
      console.log('❌ فشل إرسال رسالة العميل');
    }

    // انتظار قصير
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. اختبار رسالة المودريتور
    console.log('\n2️⃣ اختبار رسالة المودريتور...');
    const moderatorResponse = await fetch('http://localhost:3001/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testModeratorMessage)
    });

    if (moderatorResponse.ok) {
      console.log('✅ تم إرسال رسالة المودريتور للـ Webhook');
    } else {
      console.log('❌ فشل إرسال رسالة المودريتور');
    }

    console.log('\n🎯 تم إرسال الرسائل التجريبية');
    console.log('💡 تحقق من logs الـ Webhook لرؤية النتائج');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testWebhook();
