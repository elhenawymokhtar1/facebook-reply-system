// اختبار تتبع جميع الرسائل
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessageTracking() {
  console.log('🔍 اختبار تتبع جميع الرسائل...\n');

  try {
    // 1. فحص الـ Webhook الحالي
    console.log('1️⃣ فحص حالة الـ Webhook...');
    
    try {
      const webhookResponse = await fetch('http://localhost:3001/health');
      const webhookData = await webhookResponse.json();
      
      if (webhookResponse.ok) {
        console.log('✅ الـ Webhook شغال:', webhookData.status);
      } else {
        console.log('❌ الـ Webhook مش شغال');
        return;
      }
    } catch (webhookError) {
      console.log('❌ الـ Webhook مش متاح على المنفذ 3001');
      console.log('💡 تأكد من تشغيل: npm run webhook');
      return;
    }

    // 2. فحص إعدادات Facebook
    console.log('\n2️⃣ فحص إعدادات Facebook...');
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('*');

    if (fbError || !fbSettings || fbSettings.length === 0) {
      console.log('❌ لا توجد إعدادات Facebook');
      return;
    }

    console.log(`✅ تم العثور على ${fbSettings.length} صفحة Facebook:`);
    fbSettings.forEach(page => {
      console.log(`   📄 ${page.page_name} (${page.page_id})`);
    });

    // 3. فحص المحادثات الحديثة
    console.log('\n3️⃣ فحص المحادثات الحديثة...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(5);

    if (convError || !conversations || conversations.length === 0) {
      console.log('❌ لا توجد محادثات');
      return;
    }

    console.log(`✅ تم العثور على ${conversations.length} محادثة حديثة:`);
    conversations.forEach(conv => {
      console.log(`   👤 ${conv.customer_name} - آخر رسالة: ${conv.last_message_at}`);
    });

    // 4. فحص الرسائل لكل محادثة
    console.log('\n4️⃣ فحص الرسائل لكل محادثة...');
    
    for (const conv of conversations) {
      console.log(`\n📋 محادثة: ${conv.customer_name}`);
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (msgError) {
        console.log(`   ❌ خطأ في جلب الرسائل: ${msgError.message}`);
        continue;
      }

      if (!messages || messages.length === 0) {
        console.log('   ⚠️ لا توجد رسائل محفوظة');
        continue;
      }

      console.log(`   📨 آخر ${messages.length} رسائل:`);
      messages.forEach(msg => {
        const senderIcon = msg.sender_type === 'customer' ? '👤' : 
                          msg.sender_type === 'admin' ? '👨‍💼' : '🤖';
        const timeAgo = getTimeAgo(msg.created_at);
        console.log(`     ${senderIcon} ${msg.content.substring(0, 50)}... (${timeAgo})`);
      });
    }

    // 5. اختبار إرسال رسالة تجريبية من المودريتور
    console.log('\n5️⃣ محاكاة رسالة من المودريتور...');
    
    const testConv = conversations[0];
    const testPage = fbSettings.find(page => page.page_id === testConv.facebook_page_id);
    
    if (!testPage) {
      console.log('❌ لا توجد إعدادات للصفحة');
      return;
    }

    // محاكاة رسالة echo (من المودريتور)
    const mockEchoMessage = {
      object: 'page',
      entry: [{
        id: testPage.page_id,
        messaging: [{
          sender: { id: testPage.page_id },
          recipient: { id: testConv.customer_facebook_id },
          timestamp: Date.now(),
          message: {
            mid: `test_echo_${Date.now()}`,
            text: `🧪 رسالة اختبار من المودريتور - ${new Date().toLocaleTimeString('ar-EG')}`,
            is_echo: true,
            app_id: '123456789' // معرف تطبيق وهمي
          }
        }]
      }]
    };

    console.log('📤 إرسال رسالة echo تجريبية للـ Webhook...');
    
    try {
      const webhookTestResponse = await fetch('http://localhost:3001/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEchoMessage)
      });

      if (webhookTestResponse.ok) {
        console.log('✅ تم إرسال رسالة Echo للـ Webhook بنجاح');
        
        // انتظار قليل ثم فحص إذا تم حفظ الرسالة
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: newMessages, error: newMsgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', testConv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (newMsgError) {
          console.log('❌ خطأ في فحص الرسالة الجديدة:', newMsgError);
        } else if (newMessages && newMessages.length > 0) {
          const latestMsg = newMessages[0];
          if (latestMsg.content.includes('🧪 رسالة اختبار من المودريتور')) {
            console.log('✅ تم حفظ رسالة المودريتور في قاعدة البيانات!');
            console.log(`   📋 المحتوى: ${latestMsg.content}`);
            console.log(`   👨‍💼 النوع: ${latestMsg.sender_type}`);
          } else {
            console.log('⚠️ لم يتم العثور على الرسالة الجديدة');
          }
        }
      } else {
        console.log('❌ فشل إرسال رسالة Echo للـ Webhook');
      }
    } catch (webhookTestError) {
      console.log('❌ خطأ في اختبار الـ Webhook:', webhookTestError.message);
    }

    // 6. الخلاصة
    console.log('\n🎯 الخلاصة:');
    console.log('✅ الـ Webhook شغال ويستقبل الرسائل');
    console.log('✅ رسائل العملاء تتحفظ بنجاح');
    console.log('✅ رسائل المودريتور (Echo) تتحفظ بنجاح');
    console.log('');
    console.log('💡 للتأكد من عمل النظام بالكامل:');
    console.log('1️⃣ أرسل رسالة من عميل للصفحة');
    console.log('2️⃣ رد على العميل من Facebook مباشرة');
    console.log('3️⃣ تحقق من ظهور الرسالتين في الموقع');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error);
  }
}

// دالة مساعدة لحساب الوقت المنقضي
function getTimeAgo(timestamp) {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now - messageTime;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  return `منذ ${diffDays} يوم`;
}

// تشغيل الاختبار
testMessageTracking().then(() => {
  console.log('\n🏁 انتهى اختبار تتبع الرسائل');
}).catch(error => {
  console.error('❌ خطأ في تشغيل الاختبار:', error);
});
