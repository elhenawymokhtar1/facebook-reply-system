// سكريپت لاستخراج أسماء العملاء من رسائلهم وتحديث قاعدة البيانات
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// دالة لاستخراج الاسم من النص
function extractNameFromText(text) {
  if (!text) return null;
  
  // أنماط مختلفة لاستخراج الاسم
  const patterns = [
    /(?:اسمي|انا\s+اسمي|انا\s+سمي|سمي)\s+([^من]+?)(?:\s+من|\s*$)/i,
    /(?:اسمي|انا)\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+من|\s+عايز|\s+محتاج|\s*$)/i,
    /(?:انا\s+)?([أ-ي]+)\s+[٠-٩\d]/,
    /^([أ-ي\s]+)\s+[٠-٩\d]/,
    /اسمي\s+([أ-ي\s]+)/i,
    /انا\s+([أ-ي\s]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // تأكد إن الاسم مش فيه كلمات غريبة
      if (name.length > 1 && name.length < 50 && 
          !name.includes('عايز') && !name.includes('محتاج') && 
          !name.includes('كوتشي') && !name.includes('حذاء')) {
        return name;
      }
    }
  }
  
  return null;
}

async function updateNamesFromMessages() {
  console.log('🔄 بدء استخراج الأسماء من الرسائل...\n');

  try {
    // جلب المحادثات التي تحتوي على "User" في الاسم
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, customer_facebook_id, customer_name, facebook_page_id')
      .like('customer_name', 'User %')
      .in('facebook_page_id', ['240244019177739', '260345600493273'])
      .order('last_message_at', { ascending: false })
      .limit(20);

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
        // جلب رسائل العميل من هذه المحادثة
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', id)
          .eq('sender_type', 'customer')
          .order('created_at', { ascending: true })
          .limit(10);

        if (messagesError) {
          console.error(`❌ خطأ في جلب الرسائل للمحادثة ${id}:`, messagesError);
          failedCount++;
          continue;
        }

        if (!messages || messages.length === 0) {
          console.log(`⚠️ لا توجد رسائل للعميل في المحادثة ${id}`);
          failedCount++;
          continue;
        }

        // البحث عن اسم في الرسائل
        let extractedName = null;
        for (const message of messages) {
          const name = extractNameFromText(message.content);
          if (name) {
            extractedName = name;
            console.log(`📝 تم استخراج الاسم من الرسالة: "${message.content.substring(0, 50)}..."`);
            break;
          }
        }

        if (extractedName && extractedName !== customer_name) {
          // تحديث الاسم في قاعدة البيانات
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ 
              customer_name: extractedName,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) {
            console.error(`❌ خطأ في تحديث المحادثة ${id}:`, updateError);
            failedCount++;
          } else {
            console.log(`✅ تم تحديث: ${customer_name} → ${extractedName}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ لم يتم العثور على اسم في رسائل المستخدم: ${customer_facebook_id}`);
          failedCount++;
        }

        // انتظار قصير
        await new Promise(resolve => setTimeout(resolve, 100));

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

// تشغيل السكريپت
updateNamesFromMessages().then(() => {
  console.log('\n🏁 انتهى استخراج الأسماء من الرسائل');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل السكريپت:', error);
  process.exit(1);
});
