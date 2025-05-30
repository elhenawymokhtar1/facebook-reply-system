// إعداد Facebook Webhook
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// إعدادات Webhook
const WEBHOOK_URL = 'https://43e9-154-180-112-84.ngrok-free.app/webhook';
const VERIFY_TOKEN = 'facebook_webhook_verify_token_2024';

async function setupFacebookWebhook() {
  console.log('🔧 إعداد Facebook Webhook...\n');

  try {
    // الحصول على إعدادات Facebook
    const { data: facebookSettings, error } = await supabase
      .from('facebook_settings')
      .select('*');

    if (error || !facebookSettings || facebookSettings.length === 0) {
      console.error('❌ لا توجد إعدادات Facebook');
      return;
    }

    console.log(`📋 تم العثور على ${facebookSettings.length} صفحة Facebook`);

    for (const page of facebookSettings) {
      console.log(`\n🔧 إعداد Webhook للصفحة: ${page.page_name} (${page.page_id})`);

      try {
        // إعداد Webhook للصفحة
        const webhookUrl = `https://graph.facebook.com/v18.0/${page.page_id}/subscribed_apps`;
        
        console.log('📤 إرسال طلب إعداد Webhook...');
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: page.access_token,
            subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins', 'message_deliveries', 'message_reads']
          })
        });

        const result = await response.json();
        console.log('📋 نتيجة إعداد Webhook:', result);

        if (response.ok && result.success) {
          console.log(`✅ تم إعداد Webhook بنجاح للصفحة: ${page.page_name}`);
        } else {
          console.error(`❌ فشل إعداد Webhook للصفحة: ${page.page_name}`);
          console.error('📋 تفاصيل الخطأ:', result);
        }

        // فحص الاشتراكات الحالية
        console.log('🔍 فحص الاشتراكات الحالية...');
        const checkUrl = `https://graph.facebook.com/v18.0/${page.page_id}/subscribed_apps?access_token=${page.access_token}`;
        const checkResponse = await fetch(checkUrl);
        const checkResult = await checkResponse.json();
        
        console.log('📋 الاشتراكات الحالية:', checkResult);

      } catch (pageError) {
        console.error(`❌ خطأ في إعداد الصفحة ${page.page_name}:`, pageError);
      }
    }

    console.log('\n📋 خطوات إضافية مطلوبة:');
    console.log('1️⃣ رفع التطبيق على Netlify');
    console.log('2️⃣ تحديث WEBHOOK_URL في الكود');
    console.log('3️⃣ إعداد Webhook في Facebook App Dashboard:');
    console.log(`   📍 Webhook URL: ${WEBHOOK_URL}`);
    console.log(`   🔑 Verify Token: ${VERIFY_TOKEN}`);
    console.log('   📋 Subscription Fields: messages, messaging_postbacks, messaging_optins');
    console.log('\n4️⃣ خطوات إعداد Facebook App:');
    console.log('   • اذهب إلى https://developers.facebook.com/apps');
    console.log('   • اختر تطبيقك');
    console.log('   • اذهب إلى Messenger > Settings');
    console.log('   • في قسم Webhooks، اضغط "Add Callback URL"');
    console.log(`   • أدخل: ${WEBHOOK_URL}`);
    console.log(`   • أدخل Verify Token: ${VERIFY_TOKEN}`);
    console.log('   • اختر Subscription Fields: messages, messaging_postbacks');
    console.log('   • اضغط "Verify and Save"');

  } catch (error) {
    console.error('❌ خطأ عام في إعداد Webhook:', error);
  }
}

// تشغيل الإعداد
setupFacebookWebhook().then(() => {
  console.log('\n🏁 انتهى إعداد Facebook Webhook');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الإعداد:', error);
  process.exit(1);
});
