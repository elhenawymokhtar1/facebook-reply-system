// إصلاح صفحة Swan shop
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

const SWAN_SHOP_PAGE_ID = '260345600493273';
const WEBHOOK_URL = 'https://43e9-154-180-112-84.ngrok-free.app/webhook';

async function fixSwanShop() {
  console.log('🦢 إصلاح صفحة Swan shop...\n');

  try {
    // 1. فحص بيانات الصفحة الحالية
    console.log('1️⃣ فحص بيانات Swan shop الحالية...');
    const { data: swanShopData, error: fetchError } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', SWAN_SHOP_PAGE_ID);

    if (fetchError) {
      console.error('❌ خطأ في جلب البيانات:', fetchError);
      return;
    }

    if (!swanShopData || swanShopData.length === 0) {
      console.error('❌ لم يتم العثور على صفحة Swan shop في قاعدة البيانات');
      console.log('💡 تحتاج إضافة الصفحة أولاً في صفحة الإعدادات');
      return;
    }

    const swanShop = swanShopData[0];
    console.log('✅ تم العثور على صفحة Swan shop:');
    console.log(`   📄 الاسم: ${swanShop.page_name}`);
    console.log(`   🆔 المعرف: ${swanShop.page_id}`);
    console.log(`   🔑 Access Token: ${swanShop.access_token ? 'موجود' : 'مفقود'}`);
    console.log('');

    // 2. اختبار صحة Access Token
    console.log('2️⃣ اختبار صحة Access Token...');
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${swanShop.access_token}`
      );
      const tokenData = await response.json();

      if (response.ok && !tokenData.error) {
        console.log('✅ Access Token صالح');
        console.log(`   📋 اسم الصفحة: ${tokenData.name}`);
        console.log(`   🆔 معرف الصفحة: ${tokenData.id}`);
      } else {
        console.error('❌ Access Token غير صالح:', tokenData.error?.message);
        console.log('💡 تحتاج تحديث Access Token في صفحة الإعدادات');
        return;
      }
    } catch (tokenError) {
      console.error('❌ خطأ في اختبار Access Token:', tokenError.message);
      return;
    }

    console.log('');

    // 3. فحص صلاحيات الصفحة
    console.log('3️⃣ فحص صلاحيات الصفحة...');
    try {
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${SWAN_SHOP_PAGE_ID}?fields=access_token,name,permissions&access_token=${swanShop.access_token}`
      );
      const permissionsData = await permissionsResponse.json();

      if (permissionsResponse.ok && !permissionsData.error) {
        console.log('✅ صلاحيات الصفحة:');
        console.log(`   📄 اسم الصفحة: ${permissionsData.name}`);
        if (permissionsData.permissions) {
          permissionsData.permissions.data.forEach(perm => {
            console.log(`   🔐 ${perm.permission}: ${perm.status}`);
          });
        }
      } else {
        console.error('❌ خطأ في فحص الصلاحيات:', permissionsData.error?.message);
      }
    } catch (permError) {
      console.error('❌ خطأ في فحص الصلاحيات:', permError.message);
    }

    console.log('');

    // 4. محاولة ربط الصفحة بالـ Webhook
    console.log('4️⃣ ربط الصفحة بالـ Webhook...');
    try {
      const webhookResponse = await fetch(
        `https://graph.facebook.com/v18.0/${SWAN_SHOP_PAGE_ID}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: swanShop.access_token,
            subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins', 'message_deliveries', 'message_reads']
          })
        }
      );

      const webhookResult = await webhookResponse.json();

      if (webhookResponse.ok && webhookResult.success) {
        console.log('✅ تم ربط Swan shop بالـ Webhook بنجاح!');
      } else {
        console.error('❌ فشل ربط Swan shop بالـ Webhook:');
        console.error(`   📋 الخطأ: ${webhookResult.error?.message}`);
        console.error(`   🔢 كود الخطأ: ${webhookResult.error?.code}`);
        
        // تحليل نوع الخطأ
        if (webhookResult.error?.code === 200) {
          console.log('');
          console.log('💡 حلول مقترحة:');
          console.log('   1️⃣ تأكد من أنك Admin للصفحة وليس Editor');
          console.log('   2️⃣ فعل Two Factor Authentication في حسابك');
          console.log('   3️⃣ أعد إنشاء Access Token جديد');
          console.log('   4️⃣ تحقق من إعدادات الصفحة في Facebook Business');
        }
      }
    } catch (webhookError) {
      console.error('❌ خطأ في ربط الـ Webhook:', webhookError.message);
    }

    console.log('');

    // 5. فحص الاشتراكات الحالية
    console.log('5️⃣ فحص الاشتراكات الحالية...');
    try {
      const subscriptionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${SWAN_SHOP_PAGE_ID}/subscribed_apps?access_token=${swanShop.access_token}`
      );
      const subscriptionsData = await subscriptionsResponse.json();

      if (subscriptionsResponse.ok && !subscriptionsData.error) {
        console.log('✅ الاشتراكات الحالية:');
        if (subscriptionsData.data && subscriptionsData.data.length > 0) {
          subscriptionsData.data.forEach(app => {
            console.log(`   📱 التطبيق: ${app.name} (${app.id})`);
            console.log(`   📋 الحقول: ${app.subscribed_fields?.join(', ') || 'غير محدد'}`);
          });
        } else {
          console.log('   ⚠️ لا توجد اشتراكات حالية');
        }
      } else {
        console.error('❌ خطأ في فحص الاشتراكات:', subscriptionsData.error?.message);
      }
    } catch (subsError) {
      console.error('❌ خطأ في فحص الاشتراكات:', subsError.message);
    }

    console.log('');

    // 6. اختبار إرسال رسالة تجريبية (إذا كان هناك محادثات)
    console.log('6️⃣ البحث عن محادثات Swan shop...');
    const { data: swanConversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('facebook_page_id', SWAN_SHOP_PAGE_ID)
      .limit(3);

    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError);
    } else if (swanConversations && swanConversations.length > 0) {
      console.log(`✅ تم العثور على ${swanConversations.length} محادثة لـ Swan shop`);
      swanConversations.forEach(conv => {
        console.log(`   👤 ${conv.customer_name} - آخر رسالة: ${conv.last_message_at}`);
      });
    } else {
      console.log('ℹ️ لا توجد محادثات لـ Swan shop حالياً');
    }

    console.log('');
    console.log('🎯 ملخص حالة Swan shop:');
    console.log('✅ الصفحة موجودة في قاعدة البيانات');
    console.log('✅ Access Token صالح');
    console.log('⚠️ قد تحتاج صلاحيات إضافية للـ Webhook');
    console.log('');
    console.log('📋 الخطوات التالية:');
    console.log('1️⃣ تحقق من صلاحيات الأدمن للصفحة');
    console.log('2️⃣ فعل Two Factor Authentication');
    console.log('3️⃣ أعد المحاولة بعد التأكد من الصلاحيات');

  } catch (error) {
    console.error('❌ خطأ عام في إصلاح Swan shop:', error);
  }
}

// تشغيل الإصلاح
fixSwanShop().then(() => {
  console.log('\n🏁 انتهى فحص وإصلاح Swan shop');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الإصلاح:', error);
  process.exit(1);
});
