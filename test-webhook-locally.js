// اختبار Webhook محلياً
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// محاكاة رسالة واردة من Facebook
const mockIncomingMessage = {
  object: 'page',
  entry: [
    {
      id: '240244019177739', // معرف الصفحة
      time: Date.now(),
      messaging: [
        {
          sender: {
            id: '1234567890' // معرف العميل
          },
          recipient: {
            id: '240244019177739' // معرف الصفحة
          },
          timestamp: Date.now(),
          message: {
            mid: 'test_message_' + Date.now(),
            text: 'مرحبا، هذه رسالة اختبار من العميل'
          }
        }
      ]
    }
  ]
};

// محاكاة رسالة مرسلة من الصفحة (echo)
const mockEchoMessage = {
  object: 'page',
  entry: [
    {
      id: '240244019177739',
      time: Date.now(),
      messaging: [
        {
          sender: {
            id: '240244019177739' // الصفحة هي المرسل
          },
          recipient: {
            id: '1234567890' // العميل هو المستقبل
          },
          timestamp: Date.now(),
          message: {
            mid: 'echo_message_' + Date.now(),
            text: 'مرحبا! شكراً لتواصلك معنا',
            is_echo: true // هذا يعني أن الرسالة مرسلة من الصفحة
          }
        }
      ]
    }
  ]
};

async function testWebhookLocally() {
  console.log('🧪 اختبار Facebook Webhook محلياً...\n');

  try {
    // استيراد دالة الـ Webhook
    const { handler } = await import('./netlify/functions/facebook-webhook.js');

    // اختبار 1: رسالة واردة من العميل
    console.log('1️⃣ اختبار رسالة واردة من العميل...');
    const incomingEvent = {
      httpMethod: 'POST',
      body: JSON.stringify(mockIncomingMessage),
      headers: {
        'content-type': 'application/json'
      }
    };

    const incomingResult = await handler(incomingEvent, {});
    console.log('📋 نتيجة معالجة الرسالة الواردة:', incomingResult);

    // انتظار قليل للمعالجة
    await new Promise(resolve => setTimeout(resolve, 2000));

    // اختبار 2: رسالة مرسلة من الصفحة (echo)
    console.log('\n2️⃣ اختبار رسالة مرسلة من الصفحة (echo)...');
    const echoEvent = {
      httpMethod: 'POST',
      body: JSON.stringify(mockEchoMessage),
      headers: {
        'content-type': 'application/json'
      }
    };

    const echoResult = await handler(echoEvent, {});
    console.log('📋 نتيجة معالجة الرسالة المرسلة:', echoResult);

    // انتظار قليل للمعالجة
    await new Promise(resolve => setTimeout(resolve, 2000));

    // فحص النتائج في قاعدة البيانات
    console.log('\n3️⃣ فحص النتائج في قاعدة البيانات...');

    // فحص المحادثات
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_facebook_id', '1234567890');

    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError);
    } else {
      console.log(`✅ تم العثور على ${conversations?.length || 0} محادثة للعميل التجريبي`);
      if (conversations && conversations.length > 0) {
        console.log('📋 تفاصيل المحادثة:', conversations[0]);
      }
    }

    // فحص الرسائل
    if (conversations && conversations.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversations[0].id)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('❌ خطأ في جلب الرسائل:', msgError);
      } else {
        console.log(`✅ تم العثور على ${messages?.length || 0} رسالة في المحادثة`);
        messages?.forEach((msg, index) => {
          console.log(`📨 رسالة ${index + 1}:`, {
            content: msg.content,
            sender_type: msg.sender_type,
            is_auto_reply: msg.is_auto_reply,
            created_at: msg.created_at
          });
        });
      }
    }

    // اختبار 3: التحقق من Facebook (GET request)
    console.log('\n4️⃣ اختبار التحقق من Facebook...');
    const verifyEvent = {
      httpMethod: 'GET',
      queryStringParameters: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'facebook_webhook_verify_token_2024',
        'hub.challenge': 'test_challenge_123'
      }
    };

    const verifyResult = await handler(verifyEvent, {});
    console.log('📋 نتيجة التحقق:', verifyResult);

    console.log('\n🎉 انتهى اختبار Webhook محلياً!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1️⃣ رفع التطبيق على Netlify');
    console.log('2️⃣ إعداد Webhook في Facebook App Dashboard');
    console.log('3️⃣ اختبار الرسائل الحقيقية من Facebook');

  } catch (error) {
    console.error('❌ خطأ في اختبار Webhook:', error);
  }
}

// تشغيل الاختبار
testWebhookLocally().then(() => {
  console.log('\n🏁 انتهى اختبار Webhook');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الاختبار:', error);
  process.exit(1);
});
