// فحص بسيط لصفحة Swan shop
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSwanShop() {
  console.log('🦢 فحص صفحة Swan shop...\n');

  try {
    // فحص البيانات في قاعدة البيانات
    const { data, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', '260345600493273');

    if (error) {
      console.error('❌ خطأ في قاعدة البيانات:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ لم يتم العثور على صفحة Swan shop');
      console.log('💡 تحتاج إضافة الصفحة في صفحة الإعدادات أولاً');
      return;
    }

    const swanShop = data[0];
    console.log('✅ تم العثور على صفحة Swan shop:');
    console.log(`   📄 الاسم: ${swanShop.page_name}`);
    console.log(`   🆔 المعرف: ${swanShop.page_id}`);
    console.log(`   🔑 Access Token: ${swanShop.access_token ? 'موجود' : 'مفقود'}`);

    if (!swanShop.access_token) {
      console.log('❌ Access Token مفقود - تحتاج إضافته في الإعدادات');
      return;
    }

    // اختبار Access Token
    console.log('\n🔍 اختبار Access Token...');
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${swanShop.access_token}`
      );
      const result = await response.json();

      if (response.ok && !result.error) {
        console.log('✅ Access Token يعمل بنجاح');
        console.log(`   📋 اسم الصفحة: ${result.name}`);
      } else {
        console.log('❌ Access Token لا يعمل:', result.error?.message);
        console.log('💡 تحتاج تحديث Access Token في الإعدادات');
        return;
      }
    } catch (tokenError) {
      console.log('❌ خطأ في اختبار Access Token:', tokenError.message);
      return;
    }

    // محاولة ربط الـ Webhook
    console.log('\n🔗 محاولة ربط الـ Webhook...');
    try {
      const webhookResponse = await fetch(
        `https://graph.facebook.com/v18.0/260345600493273/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: swanShop.access_token,
            subscribed_fields: ['messages', 'messaging_postbacks']
          })
        }
      );

      const webhookResult = await webhookResponse.json();

      if (webhookResponse.ok && webhookResult.success) {
        console.log('✅ تم ربط Swan shop بالـ Webhook بنجاح!');
      } else {
        console.log('❌ فشل ربط الـ Webhook:', webhookResult.error?.message);
        
        if (webhookResult.error?.code === 200) {
          console.log('\n💡 الحلول المقترحة:');
          console.log('1️⃣ تأكد من أنك Admin للصفحة');
          console.log('2️⃣ فعل Two Factor Authentication');
          console.log('3️⃣ أعد إنشاء Access Token');
        }
      }
    } catch (webhookError) {
      console.log('❌ خطأ في ربط الـ Webhook:', webhookError.message);
    }

    console.log('\n🎯 الخلاصة:');
    console.log('- الصفحة موجودة في قاعدة البيانات ✅');
    console.log('- Access Token يعمل ✅');
    console.log('- قد تحتاج صلاحيات إضافية للـ Webhook ⚠️');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

checkSwanShop().then(() => {
  console.log('\n🏁 انتهى الفحص');
}).catch(error => {
  console.error('❌ خطأ:', error.message);
});
