// سكريپت لاختبار التحديث التلقائي للأسماء مع الرسائل الجديدة
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// محاكاة رسالة جديدة من عميل
async function simulateNewMessage() {
  console.log('🧪 محاكاة رسالة جديدة من عميل...\n');

  try {
    // إنشاء محادثة تجريبية جديدة
    const testUserId = `test_${Date.now()}`;
    const testPageId = '240244019177739'; // استخدام صفحة حقيقية
    
    console.log(`📱 محاكاة رسالة من المستخدم: ${testUserId}`);
    console.log(`📄 للصفحة: ${testPageId}`);

    // محاولة الحصول على الاسم الحقيقي (سيفشل للمستخدم التجريبي)
    const { data: pageSettings } = await supabase
      .from('facebook_settings')
      .select('access_token')
      .eq('page_id', testPageId)
      .single();

    if (!pageSettings) {
      console.log('❌ لم يتم العثور على إعدادات الصفحة');
      return;
    }

    // محاولة الحصول على اسم حقيقي من Facebook API
    let realName = `User ${testUserId}`;
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${pageSettings.access_token}&limit=5`
      );

      if (response.ok) {
        const data = await response.json();
        
        // البحث عن مستخدم حقيقي لاستخدام اسمه
        if (data.data && data.data.length > 0) {
          for (const conversation of data.data) {
            if (conversation.participants && conversation.participants.data) {
              for (const participant of conversation.participants.data) {
                if (participant.id !== testPageId && participant.name) {
                  realName = participant.name;
                  console.log(`✅ استخدام اسم حقيقي للاختبار: ${realName}`);
                  break;
                }
              }
              if (realName !== `User ${testUserId}`) break;
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ لم يتم الحصول على اسم حقيقي، سيتم استخدام اسم تجريبي');
    }

    // إنشاء محادثة جديدة
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        facebook_page_id: testPageId,
        customer_facebook_id: testUserId,
        customer_name: realName,
        last_message: 'مرحبا، أريد الاستفسار عن المنتجات',
        last_message_at: new Date().toISOString(),
        is_online: true,
        unread_count: 1
      })
      .select('id')
      .single();

    if (convError) {
      console.error('❌ خطأ في إنشاء المحادثة:', convError);
      return;
    }

    console.log(`✅ تم إنشاء محادثة جديدة: ${newConversation.id}`);

    // إضافة رسالة
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: newConversation.id,
        content: 'مرحبا، أريد الاستفسار عن المنتجات',
        sender_type: 'customer',
        is_read: false,
        is_auto_reply: false
      });

    if (messageError) {
      console.error('❌ خطأ في إضافة الرسالة:', messageError);
      return;
    }

    console.log('✅ تم إضافة الرسالة بنجاح');
    console.log(`📋 اسم العميل المحفوظ: ${realName}`);

    // انتظار قليل ثم حذف البيانات التجريبية
    console.log('\n⏰ انتظار 5 ثوان ثم حذف البيانات التجريبية...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // حذف البيانات التجريبية
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', newConversation.id);

    await supabase
      .from('conversations')
      .delete()
      .eq('id', newConversation.id);

    console.log('🗑️ تم حذف البيانات التجريبية');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// اختبار التحديث التلقائي للأسماء الموجودة
async function testExistingNameUpdate() {
  console.log('\n🔄 اختبار تحديث الأسماء الموجودة...\n');

  try {
    // البحث عن محادثة بـ "User" في الاسم
    const { data: testConversation, error } = await supabase
      .from('conversations')
      .select('id, customer_facebook_id, customer_name, facebook_page_id')
      .like('customer_name', 'User %')
      .limit(1)
      .single();

    if (error || !testConversation) {
      console.log('⚠️ لا توجد محادثات بأسماء "User" للاختبار');
      return;
    }

    console.log(`📋 اختبار المحادثة: ${testConversation.id}`);
    console.log(`👤 الاسم الحالي: ${testConversation.customer_name}`);
    console.log(`🆔 Facebook ID: ${testConversation.customer_facebook_id}`);

    // محاولة الحصول على الاسم الحقيقي
    const { data: pageSettings } = await supabase
      .from('facebook_settings')
      .select('access_token')
      .eq('page_id', testConversation.facebook_page_id)
      .single();

    if (!pageSettings) {
      console.log('❌ لم يتم العثور على إعدادات الصفحة');
      return;
    }

    // جلب المحادثات من Facebook API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${pageSettings.access_token}&limit=100`
    );

    if (!response.ok) {
      console.log('❌ خطأ في Facebook API');
      return;
    }

    const data = await response.json();
    let realName = null;

    // البحث عن الاسم الحقيقي
    if (data.data) {
      for (const conversation of data.data) {
        if (conversation.participants && conversation.participants.data) {
          for (const participant of conversation.participants.data) {
            if (participant.id === testConversation.customer_facebook_id && participant.name) {
              realName = participant.name;
              break;
            }
          }
          if (realName) break;
        }
      }
    }

    if (realName && realName !== testConversation.customer_name) {
      console.log(`✅ تم العثور على الاسم الحقيقي: ${realName}`);
      
      // تحديث الاسم
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          customer_name: realName,
          updated_at: new Date().toISOString()
        })
        .eq('id', testConversation.id);

      if (updateError) {
        console.error('❌ خطأ في التحديث:', updateError);
      } else {
        console.log(`🔄 تم التحديث: ${testConversation.customer_name} → ${realName}`);
      }
    } else {
      console.log('⚠️ لم يتم العثور على اسم حقيقي أو الاسم محدث بالفعل');
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار التحديث:', error);
  }
}

// تشغيل الاختبارات
async function runTests() {
  console.log('🚀 بدء اختبار التحديث التلقائي للأسماء\n');
  
  await simulateNewMessage();
  await testExistingNameUpdate();
  
  console.log('\n🏁 انتهى الاختبار');
}

runTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الاختبارات:', error);
  process.exit(1);
});
