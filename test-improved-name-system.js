// سكريپت لاختبار النظام المحسن لجلب أسماء المستخدمين
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// محاكاة دالة getUserInfo المحسنة
async function testImprovedGetUserInfo(userId, pageAccessToken) {
  console.log(`🧪 اختبار جلب اسم المستخدم: ${userId}`);
  
  try {
    // محاولة الطريقة المباشرة
    console.log('📋 محاولة الطريقة المباشرة...');
    const directResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=id,name&access_token=${pageAccessToken}`
    );

    if (directResponse.ok) {
      const directData = await directResponse.json();
      if (directData.name && !directData.error) {
        console.log(`✅ نجحت الطريقة المباشرة: ${directData.name}`);
        return {
          method: 'direct',
          id: directData.id,
          name: directData.name
        };
      }
    }

    // محاولة Conversations API
    console.log('🔄 محاولة Conversations API...');
    let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${pageAccessToken}&limit=100`;
    let pageCount = 0;
    const maxPages = 3; // حد أقصى للاختبار

    while (nextUrl && pageCount < maxPages) {
      pageCount++;
      console.log(`📄 فحص الصفحة ${pageCount}...`);
      
      const conversationsResponse = await fetch(nextUrl);

      if (!conversationsResponse.ok) {
        console.error(`❌ خطأ في Facebook API: ${conversationsResponse.status}`);
        break;
      }

      const conversationsData = await conversationsResponse.json();

      if (conversationsData.error) {
        console.error('❌ خطأ في Facebook API:', conversationsData.error.message);
        break;
      }

      // البحث عن المستخدم
      if (conversationsData.data) {
        for (const conversation of conversationsData.data) {
          if (conversation.participants && conversation.participants.data) {
            for (const participant of conversation.participants.data) {
              if (participant.id === userId && participant.name) {
                console.log(`✅ تم العثور على الاسم في الصفحة ${pageCount}: ${participant.name}`);
                return {
                  method: 'conversations',
                  page: pageCount,
                  id: participant.id,
                  name: participant.name
                };
              }
            }
          }
        }
      }

      nextUrl = conversationsData.paging?.next || null;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`⚠️ لم يتم العثور على اسم للمستخدم ${userId}`);
    return null;

  } catch (error) {
    console.error('❌ خطأ في جلب معلومات المستخدم:', error);
    return null;
  }
}

async function testNameSystem() {
  console.log('🚀 بدء اختبار النظام المحسن لجلب الأسماء\n');

  try {
    // الحصول على إعدادات الصفحات
    const { data: pages, error } = await supabase
      .from('facebook_settings')
      .select('*');

    if (error) {
      console.error('❌ خطأ في جلب إعدادات الصفحات:', error);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log('❌ لا توجد صفحات مربوطة');
      return;
    }

    for (const page of pages) {
      console.log(`\n📄 اختبار الصفحة: ${page.page_name} (${page.page_id})`);
      
      // جلب عينة من المستخدمين للاختبار
      const { data: testUsers, error: usersError } = await supabase
        .from('conversations')
        .select('customer_facebook_id, customer_name')
        .eq('facebook_page_id', page.page_id)
        .like('customer_name', 'User %')
        .limit(5);

      if (usersError) {
        console.error(`❌ خطأ في جلب المستخدمين للاختبار:`, usersError);
        continue;
      }

      if (!testUsers || testUsers.length === 0) {
        console.log(`⚠️ لا توجد مستخدمين بأسماء "User" للاختبار في الصفحة ${page.page_name}`);
        continue;
      }

      console.log(`📋 اختبار ${testUsers.length} مستخدم من الصفحة ${page.page_name}:`);

      let successCount = 0;
      let failCount = 0;

      for (const user of testUsers) {
        console.log(`\n👤 اختبار المستخدم: ${user.customer_name} (${user.customer_facebook_id})`);
        
        const result = await testImprovedGetUserInfo(user.customer_facebook_id, page.access_token);
        
        if (result) {
          console.log(`✅ نجح! الطريقة: ${result.method}, الاسم: ${result.name}`);
          successCount++;
        } else {
          console.log(`❌ فشل في العثور على اسم`);
          failCount++;
        }

        // انتظار قصير بين الاختبارات
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`\n📊 ملخص الصفحة ${page.page_name}:`);
      console.log(`✅ نجح: ${successCount}/${testUsers.length}`);
      console.log(`❌ فشل: ${failCount}/${testUsers.length}`);
      console.log(`📈 معدل النجاح: ${Math.round((successCount / testUsers.length) * 100)}%`);
    }

    // اختبار إضافي: محاولة جلب أسماء من مستخدمين معروفين
    console.log('\n🎯 اختبار إضافي: مستخدمين معروفين');
    
    const { data: knownUsers, error: knownError } = await supabase
      .from('conversations')
      .select('customer_facebook_id, customer_name, facebook_page_id')
      .not('customer_name', 'like', 'User %')
      .limit(3);

    if (!knownError && knownUsers && knownUsers.length > 0) {
      for (const user of knownUsers) {
        console.log(`\n👤 اختبار مستخدم معروف: ${user.customer_name} (${user.customer_facebook_id})`);
        
        const { data: pageSettings } = await supabase
          .from('facebook_settings')
          .select('access_token')
          .eq('page_id', user.facebook_page_id)
          .single();

        if (pageSettings) {
          const result = await testImprovedGetUserInfo(user.customer_facebook_id, pageSettings.access_token);
          
          if (result) {
            console.log(`✅ نجح! الطريقة: ${result.method}, الاسم المجلب: ${result.name}, الاسم المحفوظ: ${user.customer_name}`);
            
            if (result.name === user.customer_name) {
              console.log(`🎯 تطابق مثالي!`);
            } else {
              console.log(`⚠️ اختلاف في الأسماء`);
            }
          } else {
            console.log(`❌ فشل في العثور على اسم`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error);
  }
}

// تشغيل الاختبار
testNameSystem().then(() => {
  console.log('\n🏁 انتهى اختبار النظام المحسن');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الاختبار:', error);
  process.exit(1);
});
