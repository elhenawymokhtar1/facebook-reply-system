// اختبار إرسال رسالة لـ Facebook ID حقيقي
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

function isRealFacebookId(id) {
  if (!id || typeof id !== 'string') return false;
  
  const testWords = ['test', 'user', 'customer', 'demo', 'sample', 'fake'];
  const lowerCaseId = id.toLowerCase();
  
  for (const word of testWords) {
    if (lowerCaseId.includes(word)) {
      return false;
    }
  }
  
  if (!/^\d+$/.test(id)) {
    return false;
  }
  
  if (id.length < 10 || id.length > 20) {
    return false;
  }
  
  return true;
}

async function testRealFacebookId() {
  console.log('📨 اختبار إرسال رسالة لـ Facebook ID حقيقي...\n');

  try {
    // جلب إعدادات Facebook
    const { data: settings, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', '260345600493273') // Swan shop
      .limit(1);

    if (error || !settings || settings.length === 0) {
      console.error('❌ لا توجد إعدادات Facebook لصفحة Swan shop');
      return;
    }

    const setting = settings[0];
    console.log(`🔧 استخدام صفحة: ${setting.page_name} (${setting.page_id})`);

    // جلب محادثة بـ Facebook ID حقيقي
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('facebook_page_id', setting.page_id)
      .not('last_message', 'is', null) // محادثات بها رسائل
      .order('last_message_at', { ascending: false });

    if (convError || !conversations || conversations.length === 0) {
      console.error('❌ لا توجد محادثات لهذه الصفحة');
      return;
    }

    // البحث عن أول Facebook ID حقيقي
    let realConversation = null;
    for (const conv of conversations) {
      if (isRealFacebookId(conv.customer_facebook_id)) {
        realConversation = conv;
        break;
      }
    }

    if (!realConversation) {
      console.error('❌ لم يتم العثور على محادثة بـ Facebook ID حقيقي');
      return;
    }

    const recipientId = realConversation.customer_facebook_id;
    
    console.log(`👤 إرسال رسالة لـ: ${realConversation.customer_name}`);
    console.log(`🆔 Facebook ID: ${recipientId}`);
    console.log(`💬 آخر رسالة: ${realConversation.last_message}`);

    // إعداد الرسالة
    const messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: "مرحباً! هذه رسالة اختبار من نظام الرد الآلي. شكراً لتفاعلك مع صفحتنا! 😊"
      }
    };

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${setting.access_token}`;

    console.log(`\n📤 إرسال الرسالة...`);

    // إرسال الرسالة
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log(`\n🎉 تم إرسال الرسالة بنجاح!`);
      console.log(`📨 Message ID: ${responseData.message_id}`);
      console.log(`👤 Recipient ID: ${responseData.recipient_id}`);
      
      // حفظ الرسالة في قاعدة البيانات
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          conversation_id: realConversation.id,
          content: messageData.message.text,
          sender_type: 'admin',
          is_read: true,
          is_auto_reply: false,
          facebook_message_id: responseData.message_id
        });

      if (saveError) {
        console.log(`⚠️ خطأ في حفظ الرسالة في قاعدة البيانات:`, saveError);
      } else {
        console.log(`✅ تم حفظ الرسالة في قاعدة البيانات`);
      }

      // تحديث آخر رسالة في المحادثة
      await supabase
        .from('conversations')
        .update({
          last_message: messageData.message.text,
          last_message_at: new Date().toISOString()
        })
        .eq('id', realConversation.id);

      console.log(`✅ تم تحديث المحادثة`);

    } else {
      console.log(`\n❌ فشل في إرسال الرسالة:`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📋 الاستجابة:`, responseData);

      // تحليل نوع الخطأ
      if (responseData.error) {
        const error = responseData.error;
        console.log(`\n🔍 تحليل الخطأ:`);
        console.log(`   📝 النوع: ${error.type}`);
        console.log(`   🔢 الكود: ${error.code}`);
        console.log(`   💬 الرسالة: ${error.message}`);

        // اقتراحات الحل
        if (error.code === 100) {
          console.log(`\n💡 اقتراحات الحل:`);
          console.log(`   - قد يكون المستخدم لم يتفاعل مع الصفحة مؤخراً`);
          console.log(`   - Facebook يسمح بإرسال الرسائل فقط خلال 24 ساعة من آخر تفاعل`);
        } else if (error.code === 190) {
          console.log(`\n💡 اقتراحات الحل:`);
          console.log(`   - Access Token منتهي الصلاحية`);
          console.log(`   - احصل على Token جديد`);
        } else if (error.code === 200 || error.code === 10) {
          console.log(`\n💡 اقتراحات الحل:`);
          console.log(`   - صلاحيات غير كافية`);
          console.log(`   - تحقق من صلاحيات pages_messaging`);
        }
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الاختبار
testRealFacebookId().then(() => {
  console.log('\n🎯 انتهى اختبار Facebook ID حقيقي');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
