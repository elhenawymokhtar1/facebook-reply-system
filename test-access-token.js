// اختبار Access Token
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAccessToken() {
  console.log('🔍 اختبار Access Token...\n');

  try {
    // جلب إعدادات Facebook
    const { data: settings, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في جلب إعدادات Facebook:', error);
      return;
    }

    if (!settings || settings.length === 0) {
      console.log('❌ لا توجد إعدادات Facebook');
      return;
    }

    console.log(`📋 وجد ${settings.length} إعداد Facebook:`);
    
    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i];
      console.log(`\n🔧 إعداد ${i + 1}:`);
      console.log(`   📄 Page ID: ${setting.page_id}`);
      console.log(`   📝 Page Name: ${setting.page_name || 'غير محدد'}`);
      console.log(`   🔑 Token: ${setting.access_token ? setting.access_token.substring(0, 20) + '...' : 'غير موجود'}`);
      console.log(`   📅 آخر تحديث: ${new Date(setting.updated_at).toLocaleString('ar-EG')}`);

      if (setting.access_token) {
        console.log(`\n🧪 اختبار Token للصفحة ${setting.page_id}...`);
        
        // اختبار 1: جلب معلومات الصفحة
        try {
          const pageResponse = await fetch(`https://graph.facebook.com/v21.0/${setting.page_id}?access_token=${setting.access_token}`);
          const pageData = await pageResponse.json();
          
          if (pageResponse.ok) {
            console.log(`   ✅ Token يعمل! اسم الصفحة: ${pageData.name}`);
            console.log(`   📊 معلومات الصفحة:`, {
              id: pageData.id,
              name: pageData.name,
              category: pageData.category
            });
          } else {
            console.log(`   ❌ Token لا يعمل:`, pageData.error);
          }
        } catch (fetchError) {
          console.log(`   ❌ خطأ في الاتصال:`, fetchError.message);
        }

        // اختبار 2: اختبار صلاحيات الرسائل
        try {
          console.log(`\n📨 اختبار صلاحيات الرسائل...`);
          const permissionsResponse = await fetch(`https://graph.facebook.com/v21.0/${setting.page_id}/permissions?access_token=${setting.access_token}`);
          const permissionsData = await permissionsResponse.json();
          
          if (permissionsResponse.ok && permissionsData.data) {
            console.log(`   ✅ الصلاحيات متاحة:`);
            permissionsData.data.forEach(permission => {
              console.log(`     - ${permission.permission}: ${permission.status}`);
            });
          } else {
            console.log(`   ❌ لا يمكن جلب الصلاحيات:`, permissionsData.error || 'خطأ غير معروف');
          }
        } catch (permError) {
          console.log(`   ❌ خطأ في جلب الصلاحيات:`, permError.message);
        }

        // اختبار 3: محاولة إرسال رسالة تجريبية (بدون إرسال فعلي)
        try {
          console.log(`\n🧪 اختبار endpoint الرسائل...`);
          const testMessageUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${setting.access_token}`;
          
          // نرسل طلب GET بدلاً من POST لاختبار الوصول فقط
          const messageTestResponse = await fetch(testMessageUrl.replace('/messages?', '/messages_test?'));
          
          if (messageTestResponse.status === 405) {
            console.log(`   ✅ endpoint الرسائل متاح (Method Not Allowed متوقع)`);
          } else {
            const messageTestData = await messageTestResponse.json();
            console.log(`   📊 استجابة endpoint:`, messageTestData);
          }
        } catch (msgError) {
          console.log(`   ❌ خطأ في اختبار endpoint:`, msgError.message);
        }

        console.log(`\n${'='.repeat(50)}`);
      } else {
        console.log(`   ❌ لا يوجد Access Token`);
      }
    }

    // اختبار إضافي: التحقق من صحة Token format
    console.log(`\n🔍 تحليل Token format:`);
    settings.forEach((setting, index) => {
      if (setting.access_token) {
        const token = setting.access_token;
        console.log(`\n📋 Token ${index + 1}:`);
        console.log(`   📏 الطول: ${token.length} حرف`);
        console.log(`   🔤 يبدأ بـ: ${token.substring(0, 10)}...`);
        console.log(`   ✅ Format صحيح: ${token.startsWith('EAA') ? 'نعم' : 'لا'}`);
        
        // التحقق من انتهاء الصلاحية من خلال طول Token
        if (token.length < 100) {
          console.log(`   ⚠️ Token قصير جداً - قد يكون منتهي الصلاحية`);
        } else if (token.length > 500) {
          console.log(`   ⚠️ Token طويل جداً - قد يكون غير صحيح`);
        } else {
          console.log(`   ✅ طول Token مناسب`);
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الاختبار
testAccessToken().then(() => {
  console.log('\n🎯 انتهى اختبار Access Token');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
