// سكريپت نهائي لتحديث جميع أسماء المستخدمين من Facebook API
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// الحصول على أسماء المستخدمين من Facebook Conversations API
async function getFacebookUserNames(accessToken, pageId) {
  try {
    console.log(`🔍 جلب المحادثات من Facebook API للصفحة: ${pageId}`);
    
    const userNames = new Map();
    let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${accessToken}&limit=100`;
    let pageCount = 0;
    let totalUsers = 0;
    
    while (nextUrl && pageCount < 20) { // زيادة العدد لجلب أكبر قدر من الأسماء
      pageCount++;
      console.log(`📄 معالجة الصفحة ${pageCount}...`);
      
      const response = await fetch(nextUrl);
      
      if (!response.ok) {
        console.error(`❌ خطأ في Facebook API: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ خطأ في Facebook API:', data.error.message);
        break;
      }
      
      // استخراج أسماء المستخدمين
      if (data.data) {
        data.data.forEach(conversation => {
          if (conversation.participants && conversation.participants.data) {
            conversation.participants.data.forEach(participant => {
              // تجاهل الصفحة نفسها
              if (participant.id !== pageId && participant.name) {
                if (!userNames.has(participant.id)) {
                  userNames.set(participant.id, participant.name);
                  totalUsers++;
                }
              }
            });
          }
        });
      }
      
      // الانتقال للصفحة التالية
      nextUrl = data.paging?.next || null;
      
      // انتظار قصير لتجنب rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`✅ تم جلب ${userNames.size} اسم مستخدم فريد من ${pageCount} صفحة`);
    return userNames;
    
  } catch (error) {
    console.error('❌ خطأ في جلب أسماء المستخدمين:', error);
    return new Map();
  }
}

async function updateAllUserNames() {
  console.log('🚀 بدء التحديث النهائي لجميع أسماء المستخدمين من Facebook...\n');

  try {
    // الحصول على إعدادات الصفحات
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('*');

    if (pagesError) {
      console.error('❌ خطأ في جلب إعدادات الصفحات:', pagesError);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log('❌ لا توجد صفحات مربوطة');
      return;
    }

    let totalUpdated = 0;
    let totalFailed = 0;
    let totalProcessed = 0;

    for (const page of pages) {
      console.log(`\n📄 معالجة الصفحة: ${page.page_name} (${page.page_id})`);
      
      // الحصول على أسماء المستخدمين من Facebook
      const facebookUserNames = await getFacebookUserNames(page.access_token, page.page_id);
      
      if (facebookUserNames.size === 0) {
        console.log('⚠️ لم يتم العثور على أسماء مستخدمين لهذه الصفحة');
        continue;
      }
      
      // جلب جميع المحادثات للصفحة (بما في ذلك التي لها أسماء حقيقية للتحقق من التحديثات)
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, customer_facebook_id, customer_name')
        .eq('facebook_page_id', page.page_id)
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error(`❌ خطأ في جلب المحادثات للصفحة ${page.page_id}:`, convError);
        continue;
      }

      if (!conversations || conversations.length === 0) {
        console.log(`⚠️ لا توجد محادثات للصفحة ${page.page_name}`);
        continue;
      }

      console.log(`📋 وُجد ${conversations.length} محادثة للصفحة ${page.page_name}`);

      let pageUpdated = 0;
      let pageFailed = 0;
      let pageProcessed = 0;

      for (const conversation of conversations) {
        const { id, customer_facebook_id, customer_name } = conversation;
        pageProcessed++;
        
        // البحث عن الاسم الحقيقي في البيانات المجلبة من Facebook
        const realName = facebookUserNames.get(customer_facebook_id);
        
        if (realName && realName !== customer_name) {
          try {
            // تحديث الاسم في قاعدة البيانات
            const { error: updateError } = await supabase
              .from('conversations')
              .update({ 
                customer_name: realName,
                updated_at: new Date().toISOString()
              })
              .eq('id', id);

            if (updateError) {
              console.error(`❌ خطأ في تحديث المحادثة ${id}:`, updateError);
              pageFailed++;
            } else {
              console.log(`✅ تم تحديث: ${customer_name} → ${realName}`);
              pageUpdated++;
            }
          } catch (error) {
            console.error(`❌ خطأ في تحديث المستخدم ${customer_facebook_id}:`, error);
            pageFailed++;
          }
        } else if (!realName && customer_name.startsWith('User ')) {
          console.log(`⚠️ لم يتم العثور على اسم حقيقي للمستخدم: ${customer_facebook_id}`);
          pageFailed++;
        } else if (realName === customer_name) {
          console.log(`ℹ️ الاسم محدث بالفعل: ${customer_name}`);
        } else {
          console.log(`ℹ️ اسم حقيقي موجود: ${customer_name}`);
        }
        
        // انتظار قصير بين المعالجات
        if (pageProcessed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`\n📊 ملخص الصفحة ${page.page_name}:`);
      console.log(`📋 تم معالجة: ${pageProcessed} محادثة`);
      console.log(`✅ تم تحديث: ${pageUpdated} محادثة`);
      console.log(`❌ فشل في: ${pageFailed} محادثة`);
      console.log(`📈 معدل النجاح: ${Math.round((pageUpdated / pageProcessed) * 100)}%`);
      
      totalUpdated += pageUpdated;
      totalFailed += pageFailed;
      totalProcessed += pageProcessed;
    }

    console.log('\n🎉 ملخص النتائج الإجمالي:');
    console.log(`📋 إجمالي المحادثات المعالجة: ${totalProcessed}`);
    console.log(`✅ تم تحديث: ${totalUpdated} محادثة`);
    console.log(`❌ فشل في: ${totalFailed} محادثة`);
    console.log(`📈 معدل النجاح الإجمالي: ${Math.round((totalUpdated / totalProcessed) * 100)}%`);
    console.log(`📄 إجمالي الصفحات: ${pages.length} صفحة`);

    // إحصائيات نهائية
    const { data: finalStats, error: statsError } = await supabase
      .from('conversations')
      .select('customer_name')
      .in('facebook_page_id', pages.map(p => p.page_id));

    if (!statsError && finalStats) {
      const totalConversations = finalStats.length;
      const realNames = finalStats.filter(conv => !conv.customer_name.startsWith('User ')).length;
      const userNames = totalConversations - realNames;

      console.log('\n📊 الإحصائيات النهائية:');
      console.log(`📋 إجمالي المحادثات: ${totalConversations}`);
      console.log(`✅ أسماء حقيقية: ${realNames} (${Math.round(realNames/totalConversations*100)}%)`);
      console.log(`⚠️ أسماء "User": ${userNames} (${Math.round(userNames/totalConversations*100)}%)`);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل السكريپت
updateAllUserNames().then(() => {
  console.log('\n🏁 انتهى التحديث النهائي لأسماء المستخدمين');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل السكريپت:', error);
  process.exit(1);
});
