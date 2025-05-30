// سكريپت تشخيص إرسال الرسائل
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSendMessage() {
  console.log('🔍 بدء تشخيص إرسال الرسائل...\n');

  try {
    // 1. فحص الاتصال بـ Supabase
    console.log('1️⃣ فحص الاتصال بـ Supabase...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ فشل الاتصال بـ Supabase:', connectionError);
      return;
    }
    console.log('✅ الاتصال بـ Supabase يعمل\n');

    // 2. فحص إعدادات Facebook
    console.log('2️⃣ فحص إعدادات Facebook...');
    const { data: facebookSettings, error: settingsError } = await supabase
      .from('facebook_settings')
      .select('*');

    if (settingsError) {
      console.error('❌ خطأ في جلب إعدادات Facebook:', settingsError);
      return;
    }

    if (!facebookSettings || facebookSettings.length === 0) {
      console.error('❌ لا توجد إعدادات Facebook');
      return;
    }

    console.log(`✅ تم العثور على ${facebookSettings.length} صفحة Facebook:`);
    facebookSettings.forEach(page => {
      console.log(`   📄 ${page.page_name} (${page.page_id})`);
      console.log(`   🔑 Access Token: ${page.access_token ? 'موجود' : 'مفقود'}`);
    });
    console.log('');

    // 3. اختبار صحة Access Token
    console.log('3️⃣ اختبار صحة Access Tokens...');
    for (const page of facebookSettings) {
      console.log(`🔍 اختبار صفحة: ${page.page_name}`);
      
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me?access_token=${page.access_token}`
        );
        const data = await response.json();

        if (response.ok && !data.error) {
          console.log(`✅ Access Token صالح للصفحة ${page.page_name}`);
          console.log(`   📋 معلومات الصفحة: ${data.name} (${data.id})`);
        } else {
          console.error(`❌ Access Token غير صالح للصفحة ${page.page_name}:`);
          console.error(`   📋 الخطأ: ${data.error?.message || 'خطأ غير معروف'}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في اختبار Access Token للصفحة ${page.page_name}:`, error.message);
      }
    }
    console.log('');

    // 4. فحص المحادثات
    console.log('4️⃣ فحص المحادثات...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, customer_facebook_id, facebook_page_id, customer_name')
      .limit(5);

    if (conversationsError) {
      console.error('❌ خطأ في جلب المحادثات:', conversationsError);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.error('❌ لا توجد محادثات');
      return;
    }

    console.log(`✅ تم العثور على ${conversations.length} محادثة:`);
    conversations.forEach(conv => {
      console.log(`   💬 ${conv.customer_name} (${conv.customer_facebook_id})`);
      console.log(`   📄 الصفحة: ${conv.facebook_page_id || 'غير محدد'}`);
      console.log(`   🆔 معرف المحادثة: ${conv.id}`);
    });
    console.log('');

    // 5. محاولة إرسال رسالة تجريبية
    console.log('5️⃣ محاولة إرسال رسالة تجريبية...');

    // البحث عن مستخدم حقيقي (ليس test user)
    console.log('🔍 البحث عن مستخدم حقيقي...');
    const { data: realUsers, error: realUsersError } = await supabase
      .from('conversations')
      .select('id, customer_facebook_id, facebook_page_id, customer_name')
      .not('customer_name', 'like', 'User %')
      .not('customer_facebook_id', 'like', 'test_%')
      .not('customer_facebook_id', 'eq', '1234567890123456')
      .limit(5);

    if (realUsersError || !realUsers || realUsers.length === 0) {
      console.error('❌ لم يتم العثور على مستخدمين حقيقيين');
      console.log('⚠️ سيتم اختبار مع مستخدم تجريبي (قد يفشل)');

      // اختيار أول محادثة مع صفحة محددة
      const testConversation = conversations.find(c => c.facebook_page_id);
      if (!testConversation) {
        console.error('❌ لا توجد محادثة مع facebook_page_id محدد');
        return;
      }
    } else {
      console.log(`✅ تم العثور على ${realUsers.length} مستخدم حقيقي:`);
      realUsers.forEach(user => {
        console.log(`   👤 ${user.customer_name} (${user.customer_facebook_id})`);
      });

      // اختيار أول مستخدم حقيقي
      var testConversation = realUsers[0];
    }

    if (!testConversation) {
      console.error('❌ لا توجد محادثة للاختبار');
      return;
    }

    console.log(`🎯 اختبار المحادثة: ${testConversation.customer_name}`);
    console.log(`📄 الصفحة: ${testConversation.facebook_page_id}`);
    console.log(`👤 العميل: ${testConversation.customer_facebook_id}`);

    // الحصول على إعدادات الصفحة
    const pageSettings = facebookSettings.find(p => p.page_id === testConversation.facebook_page_id);
    if (!pageSettings) {
      console.error(`❌ لم يتم العثور على إعدادات للصفحة ${testConversation.facebook_page_id}`);
      return;
    }

    console.log(`✅ تم العثور على إعدادات الصفحة: ${pageSettings.page_name}`);

    // إرسال رسالة تجريبية
    const testMessage = `🧪 رسالة اختبار تشخيص - ${new Date().toLocaleTimeString('ar-EG')}`;
    console.log(`📤 إرسال الرسالة: "${testMessage}"`);

    const sendResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${pageSettings.access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            id: testConversation.customer_facebook_id
          },
          message: {
            text: testMessage
          }
        })
      }
    );

    const sendResult = await sendResponse.json();

    if (sendResponse.ok && !sendResult.error) {
      console.log('✅ تم إرسال الرسالة بنجاح!');
      console.log(`📋 معرف الرسالة: ${sendResult.message_id}`);

      // حفظ الرسالة في قاعدة البيانات
      console.log('💾 حفظ الرسالة في قاعدة البيانات...');
      const { data: savedMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          conversation_id: testConversation.id,
          content: testMessage,
          sender_type: 'admin',
          is_read: false,
          is_auto_reply: false,
          facebook_message_id: sendResult.message_id
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ خطأ في حفظ الرسالة:', saveError);
      } else {
        console.log('✅ تم حفظ الرسالة في قاعدة البيانات');
        console.log(`📋 معرف الرسالة في قاعدة البيانات: ${savedMessage.id}`);
      }

      // تحديث المحادثة
      console.log('🔄 تحديث المحادثة...');
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: testMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', testConversation.id);

      if (updateError) {
        console.error('❌ خطأ في تحديث المحادثة:', updateError);
      } else {
        console.log('✅ تم تحديث المحادثة بنجاح');
      }

    } else {
      console.error('❌ فشل في إرسال الرسالة:');
      console.error(`📋 كود الحالة: ${sendResponse.status}`);
      console.error(`📋 الخطأ: ${sendResult.error?.message || 'خطأ غير معروف'}`);
      console.error(`📋 تفاصيل الخطأ:`, sendResult.error);
    }

  } catch (error) {
    console.error('❌ خطأ عام في التشخيص:', error);
  }
}

// تشغيل التشخيص
debugSendMessage().then(() => {
  console.log('\n🏁 انتهى تشخيص إرسال الرسائل');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل التشخيص:', error);
  process.exit(1);
});
