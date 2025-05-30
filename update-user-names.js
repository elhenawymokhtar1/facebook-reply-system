// سكريبت لتحديث أسماء المستخدمين الحقيقية من Facebook API
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// دالة للحصول على معلومات المستخدم من Facebook API
async function getUserInfoFromFacebook(userId, accessToken) {
  try {
    // جرب طرق مختلفة للحصول على معلومات المستخدم
    const urls = [
      `https://graph.facebook.com/v18.0/${userId}?fields=id,name&access_token=${accessToken}`,
      `https://graph.facebook.com/v17.0/${userId}?fields=id,name&access_token=${accessToken}`,
      `https://graph.facebook.com/v16.0/${userId}?fields=id,name&access_token=${accessToken}`
    ];

    for (const url of urls) {
      try {
        console.log(`🔍 جاري المحاولة مع: ${url.split('?')[0]}`);
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();

          if (data.error) {
            console.error(`Facebook API Error (${url.split('/')[3]}):`, data.error.message);
            continue;
          }

          if (data.name) {
            console.log(`✅ تم العثور على الاسم: ${data.name}`);
            return {
              id: data.id,
              name: data.name
            };
          }
        } else {
          const errorText = await response.text();
          console.error(`Facebook API Error (${url.split('/')[3]}): ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`خطأ في المحاولة مع ${url.split('/')[3]}:`, error.message);
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

async function updateUserNames() {
  console.log('🔄 بدء تحديث أسماء المستخدمين...\n');

  try {
    // جلب المحادثات التي تحتوي على "User" في الاسم وتنتمي لصفحات حقيقية
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, customer_facebook_id, customer_name, facebook_page_id')
      .like('customer_name', 'User %')
      .in('facebook_page_id', ['240244019177739', '260345600493273']) // الصفحات الحقيقية فقط
      .order('last_message_at', { ascending: false })
      .limit(1); // تجربة مع مستخدم واحد فقط أولاً

    if (error) {
      console.error('❌ خطأ في جلب المحادثات:', error);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log('✅ لا توجد محادثات تحتاج لتحديث الأسماء');
      return;
    }

    console.log(`📋 وُجد ${conversations.length} محادثة تحتاج لتحديث الاسم...\n`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const conversation of conversations) {
      const { id, customer_facebook_id, customer_name, facebook_page_id } = conversation;
      
      console.log(`🔍 معالجة: ${customer_name} (ID: ${customer_facebook_id})`);

      try {
        // الحصول على إعدادات الصفحة
        const { data: pageSettings, error: pageError } = await supabase
          .from('facebook_settings')
          .select('*')
          .eq('page_id', facebook_page_id)
          .single();

        if (pageError || !pageSettings || !pageSettings.access_token) {
          console.log(`⚠️ لا توجد إعدادات للصفحة: ${facebook_page_id}`);
          if (pageError) console.log('خطأ في الصفحة:', pageError);
          failedCount++;
          continue;
        }

        console.log(`📄 الصفحة: ${pageSettings.page_name} (${facebook_page_id})`);
        console.log(`🔑 Access Token: ${pageSettings.access_token.substring(0, 20)}...`);

        // الحصول على معلومات المستخدم من Facebook API
        const userInfo = await getUserInfoFromFacebook(customer_facebook_id, pageSettings.access_token);
        
        if (userInfo && userInfo.name && userInfo.name !== customer_name) {
          // تحديث الاسم في قاعدة البيانات
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ 
              customer_name: userInfo.name,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) {
            console.error(`❌ خطأ في تحديث المحادثة ${id}:`, updateError);
            failedCount++;
          } else {
            console.log(`✅ تم تحديث: ${customer_name} → ${userInfo.name}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ لم يتم العثور على اسم حقيقي للمستخدم: ${customer_facebook_id}`);
          failedCount++;
        }

        // انتظار قصير لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ خطأ في معالجة المستخدم ${customer_facebook_id}:`, error);
        failedCount++;
      }
    }

    console.log('\n📊 ملخص النتائج:');
    console.log(`✅ تم تحديث: ${updatedCount} محادثة`);
    console.log(`❌ فشل في: ${failedCount} محادثة`);
    console.log(`📋 إجمالي: ${conversations.length} محادثة`);

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل السكريبت
updateUserNames().then(() => {
  console.log('\n🏁 انتهى تحديث أسماء المستخدمين');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل السكريبت:', error);
  process.exit(1);
});
