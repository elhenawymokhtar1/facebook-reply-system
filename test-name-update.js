// سكريپت لاختبار خدمة تحديث الأسماء
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNameUpdate() {
  console.log('🧪 اختبار خدمة تحديث الأسماء...\n');

  try {
    // فحص المحادثات المحدثة
    const { data: updatedConversations, error } = await supabase
      .from('conversations')
      .select('customer_name, customer_facebook_id, updated_at')
      .not('customer_name', 'like', 'User %')
      .in('facebook_page_id', ['240244019177739', '260345600493273'])
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ خطأ في جلب المحادثات:', error);
      return;
    }

    if (!updatedConversations || updatedConversations.length === 0) {
      console.log('⚠️ لا توجد محادثات محدثة');
      return;
    }

    console.log('✅ المحادثات المحدثة:');
    updatedConversations.forEach((conv, index) => {
      console.log(`${index + 1}. ${conv.customer_name} (ID: ${conv.customer_facebook_id})`);
      console.log(`   آخر تحديث: ${new Date(conv.updated_at).toLocaleString('ar-EG')}\n`);
    });

    // إحصائيات
    const { data: totalStats, error: statsError } = await supabase
      .from('conversations')
      .select('customer_name')
      .in('facebook_page_id', ['240244019177739', '260345600493273']);

    if (!statsError && totalStats) {
      const totalConversations = totalStats.length;
      const realNames = totalStats.filter(conv => !conv.customer_name.startsWith('User ')).length;
      const userNames = totalConversations - realNames;

      console.log('📊 إحصائيات:');
      console.log(`📋 إجمالي المحادثات: ${totalConversations}`);
      console.log(`✅ أسماء حقيقية: ${realNames} (${Math.round(realNames/totalConversations*100)}%)`);
      console.log(`⚠️ أسماء "User": ${userNames} (${Math.round(userNames/totalConversations*100)}%)`);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الاختبار
testNameUpdate().then(() => {
  console.log('\n🏁 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الاختبار:', error);
  process.exit(1);
});
