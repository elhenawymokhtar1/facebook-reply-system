// البحث عن Facebook IDs حقيقية
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

function isRealFacebookId(id) {
  // Facebook IDs الحقيقية عادة:
  // - أرقام فقط
  // - طولها بين 15-17 رقم
  // - لا تحتوي على كلمات مثل "test", "user", "customer"
  
  if (!id || typeof id !== 'string') return false;
  
  // تحقق من وجود كلمات تجريبية
  const testWords = ['test', 'user', 'customer', 'demo', 'sample', 'fake'];
  const lowerCaseId = id.toLowerCase();
  
  for (const word of testWords) {
    if (lowerCaseId.includes(word)) {
      return false;
    }
  }
  
  // تحقق من أن ID يحتوي على أرقام فقط
  if (!/^\d+$/.test(id)) {
    return false;
  }
  
  // تحقق من الطول
  if (id.length < 10 || id.length > 20) {
    return false;
  }
  
  return true;
}

async function findRealFacebookIds() {
  console.log('🔍 البحث عن Facebook IDs حقيقية...\n');

  try {
    // جلب جميع المحادثات
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في جلب المحادثات:', error);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log('❌ لا توجد محادثات');
      return;
    }

    console.log(`📋 فحص ${conversations.length} محادثة...\n`);

    const realIds = [];
    const testIds = [];

    conversations.forEach(conv => {
      const id = conv.customer_facebook_id;
      
      if (isRealFacebookId(id)) {
        realIds.push({
          id: id,
          name: conv.customer_name,
          pageId: conv.facebook_page_id,
          lastMessage: conv.last_message,
          lastMessageAt: conv.last_message_at
        });
      } else {
        testIds.push({
          id: id,
          name: conv.customer_name,
          reason: 'يحتوي على كلمات تجريبية أو format غير صحيح'
        });
      }
    });

    console.log(`✅ Facebook IDs حقيقية: ${realIds.length}`);
    console.log(`❌ Facebook IDs تجريبية: ${testIds.length}\n`);

    if (realIds.length > 0) {
      console.log('🎯 Facebook IDs حقيقية:');
      console.log('=' .repeat(80));
      
      realIds.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   👤 الاسم: ${item.name}`);
        console.log(`   📄 Page ID: ${item.pageId}`);
        console.log(`   💬 آخر رسالة: ${item.lastMessage ? item.lastMessage.substring(0, 50) + '...' : 'لا توجد'}`);
        console.log(`   📅 التاريخ: ${new Date(item.lastMessageAt).toLocaleString('ar-EG')}`);
        console.log('');
      });

      if (realIds.length > 10) {
        console.log(`... و ${realIds.length - 10} محادثة أخرى\n`);
      }
    }

    if (testIds.length > 0) {
      console.log('❌ أمثلة على IDs تجريبية:');
      console.log('=' .repeat(50));
      
      testIds.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.id} - ${item.reason}`);
      });
      
      if (testIds.length > 5) {
        console.log(`... و ${testIds.length - 5} ID تجريبي آخر\n`);
      }
    }

    // إحصائيات حسب الصفحة
    console.log('\n📊 إحصائيات حسب الصفحة:');
    console.log('=' .repeat(50));
    
    const pageStats = {};
    realIds.forEach(item => {
      if (!pageStats[item.pageId]) {
        pageStats[item.pageId] = 0;
      }
      pageStats[item.pageId]++;
    });

    Object.entries(pageStats).forEach(([pageId, count]) => {
      console.log(`📄 Page ${pageId}: ${count} محادثة حقيقية`);
    });

    return realIds;

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل البحث
findRealFacebookIds().then((realIds) => {
  console.log('\n🎯 انتهى البحث عن Facebook IDs');
  
  if (realIds && realIds.length > 0) {
    console.log(`\n✅ وجد ${realIds.length} Facebook ID حقيقي`);
    console.log('💡 يمكن الآن اختبار إرسال رسالة لأحد هذه IDs');
  } else {
    console.log('\n❌ لم يتم العثور على Facebook IDs حقيقية');
    console.log('💡 جميع IDs في قاعدة البيانات تبدو تجريبية');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
