// محاكاة الرسائل المرسلة من الصفحة
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulatePageMessages() {
  console.log('📱 محاكاة الرسائل المرسلة من الصفحة...\n');

  try {
    // الحصول على المحادثات الموجودة
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);

    if (error || !conversations || conversations.length === 0) {
      console.error('❌ لا توجد محادثات للاختبار');
      return;
    }

    console.log(`📋 تم العثور على ${conversations.length} محادثة`);

    // رسائل تجريبية من الصفحة
    const pageMessages = [
      'مرحباً! كيف يمكنني مساعدتك اليوم؟',
      'شكراً لتواصلك معنا. سيتم الرد عليك قريباً.',
      'هل تحتاج مساعدة في اختيار المنتج المناسب؟',
      'نحن متاحون للرد على استفساراتك.',
      'شكراً لثقتك بنا! 🙏'
    ];

    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      const messageText = pageMessages[i % pageMessages.length];

      console.log(`\n📤 إضافة رسالة للمحادثة: ${conversation.customer_name}`);
      console.log(`📝 الرسالة: "${messageText}"`);

      try {
        // إضافة رسالة من الصفحة/الأدمن
        const { data: newMessage, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            content: messageText,
            sender_type: 'admin', // رسالة من الأدمن/الصفحة
            is_read: true,
            is_auto_reply: false,
            image_url: null
          })
          .select()
          .single();

        if (messageError) {
          console.error(`❌ خطأ في إضافة الرسالة:`, messageError);
          continue;
        }

        console.log(`✅ تم إضافة الرسالة بنجاح: ${newMessage.id}`);

        // تحديث آخر رسالة في المحادثة
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            last_message: messageText,
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        if (updateError) {
          console.error(`❌ خطأ في تحديث المحادثة:`, updateError);
        } else {
          console.log(`✅ تم تحديث المحادثة بنجاح`);
        }

        // انتظار قصير بين الرسائل
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ خطأ في معالجة المحادثة ${conversation.id}:`, error);
      }
    }

    console.log('\n🎉 تم إضافة الرسائل التجريبية بنجاح!');
    console.log('📱 يمكنك الآن رؤية الرسائل في التطبيق');

    // عرض ملخص الرسائل المضافة
    console.log('\n📊 ملخص الرسائل المضافة:');
    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!msgError && messages) {
        console.log(`\n👤 ${conversation.customer_name}:`);
        messages.reverse().forEach(msg => {
          const senderIcon = msg.sender_type === 'customer' ? '👤' : 
                           msg.sender_type === 'admin' ? '👨‍💼' : '🤖';
          const timeStr = new Date(msg.created_at).toLocaleTimeString('ar-EG');
          console.log(`  ${senderIcon} ${timeStr}: ${msg.content}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام في محاكاة الرسائل:', error);
  }
}

// دالة لإضافة رسائل عملاء تجريبية أيضاً
async function addCustomerMessages() {
  console.log('\n👥 إضافة رسائل عملاء تجريبية...');

  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(3);

    if (error || !conversations) {
      console.error('❌ لا توجد محادثات');
      return;
    }

    const customerMessages = [
      'مرحبا، أريد الاستفسار عن المنتجات',
      'هل يمكنني معرفة الأسعار؟',
      'متى يمكن التوصيل؟',
      'شكراً لكم',
      'أريد طلب هذا المنتج'
    ];

    for (let i = 0; i < Math.min(conversations.length, 3); i++) {
      const conversation = conversations[i];
      const messageText = customerMessages[i % customerMessages.length];

      console.log(`📨 إضافة رسالة عميل للمحادثة: ${conversation.customer_name}`);

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: messageText,
          sender_type: 'customer',
          is_read: false,
          is_auto_reply: false,
          image_url: null
        });

      if (messageError) {
        console.error(`❌ خطأ في إضافة رسالة العميل:`, messageError);
      } else {
        console.log(`✅ تم إضافة رسالة العميل بنجاح`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

  } catch (error) {
    console.error('❌ خطأ في إضافة رسائل العملاء:', error);
  }
}

// تشغيل المحاكاة
async function runSimulation() {
  await addCustomerMessages();
  await simulatePageMessages();
}

runSimulation().then(() => {
  console.log('\n🏁 انتهت محاكاة الرسائل');
  console.log('\n📋 لحل المشكلة نهائياً، تحتاج إلى:');
  console.log('1️⃣ رفع التطبيق على Netlify أو Vercel');
  console.log('2️⃣ إعداد Facebook Webhook');
  console.log('3️⃣ ربط الـ Webhook بصفحات Facebook');
  console.log('\n🔗 بعدها ستظهر جميع الرسائل تلقائياً!');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل المحاكاة:', error);
  process.exit(1);
});
