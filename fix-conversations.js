// إصلاح جدول المحادثات - إضافة عمود page_id
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConversationsTable() {
  console.log('🔧 إصلاح جدول المحادثات...\n');

  try {
    // 1. إضافة عمود page_id
    console.log('📝 إضافة عمود page_id...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE conversations ADD COLUMN IF NOT EXISTS page_id TEXT;'
    });

    if (alterError) {
      console.log('⚠️ لا يمكن إضافة العمود عبر RPC، سنحاول طريقة أخرى...');
      
      // محاولة إضافة البيانات مباشرة
      console.log('🔄 تحديث المحادثات مباشرة...');
      
      // تحديث المحادثات للصفحة الثانية
      const secondPageCustomers = [
        '28174130505519768',
        '7508737372516485'
      ];
      
      for (const customerId of secondPageCustomers) {
        // محاولة إدراج page_id في البيانات الموجودة
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('customer_facebook_id', customerId)
          .single();
        
        if (conversation) {
          console.log(`📝 تحديث محادثة ${customerId} للصفحة الثانية`);
          // إنشاء محادثة جديدة مع page_id إذا لزم الأمر
          const { error: updateError } = await supabase
            .from('conversations')
            .upsert({
              ...conversation,
              page_id: '260345600493273'
            });
          
          if (updateError) {
            console.error(`❌ خطأ في تحديث ${customerId}:`, updateError.message);
          } else {
            console.log(`✅ تم تحديث ${customerId}`);
          }
        }
      }
      
      // تحديث باقي المحادثات للصفحة الأولى
      const { data: allConversations } = await supabase
        .from('conversations')
        .select('*');
      
      if (allConversations) {
        for (const conv of allConversations) {
          if (!secondPageCustomers.includes(conv.customer_facebook_id)) {
            const { error: updateError } = await supabase
              .from('conversations')
              .upsert({
                ...conv,
                page_id: '240244019177739'
              });
            
            if (updateError) {
              console.error(`❌ خطأ في تحديث ${conv.customer_facebook_id}:`, updateError.message);
            } else {
              console.log(`✅ تم تحديث ${conv.customer_facebook_id} للصفحة الأولى`);
            }
          }
        }
      }
      
    } else {
      console.log('✅ تم إضافة عمود page_id بنجاح');
    }

    console.log('\n✅ تم إصلاح جدول المحادثات');

  } catch (error) {
    console.error('❌ خطأ في إصلاح الجدول:', error);
  }
}

// تشغيل الإصلاح
fixConversationsTable().then(() => {
  console.log('\n🎯 انتهى الإصلاح');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
