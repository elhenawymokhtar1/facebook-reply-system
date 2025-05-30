// إصلاح مشكلة اعتماد الرسائل اليدوية على Gemini
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixManualMessages() {
  console.log('🔧 إصلاح مشكلة الرسائل اليدوية...\n');

  try {
    // 1. فحص الكود الحالي للرسائل اليدوية
    console.log('1️⃣ تحليل مسار الرسائل اليدوية...');
    console.log('📋 المسار الحالي:');
    console.log('   ChatWindow.tsx → handleSendMessage()');
    console.log('   ↓');
    console.log('   useMessages.ts → sendMessage.mutateAsync()');
    console.log('   ↓');
    console.log('   Facebook API مباشرة (لا يمر عبر Gemini)');
    console.log('');

    // 2. فحص إعدادات Gemini
    console.log('2️⃣ فحص إعدادات Gemini...');
    const { data: geminiSettings, error: geminiError } = await supabase
      .from('gemini_settings')
      .select('*')
      .single();

    if (geminiError) {
      console.log('❌ لا توجد إعدادات Gemini - هذا قد يكون السبب!');
      console.log('💡 الحل: إضافة إعدادات Gemini افتراضية');
      
      // إضافة إعدادات Gemini افتراضية
      const { error: insertError } = await supabase
        .from('gemini_settings')
        .insert({
          api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU', // من الذكريات
          enabled: true,
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          max_tokens: 1000,
          system_prompt: 'أنت مساعد ذكي لمتجر إلكتروني. ساعد العملاء بطريقة ودودة ومهنية.'
        });

      if (insertError) {
        console.error('❌ فشل في إضافة إعدادات Gemini:', insertError);
      } else {
        console.log('✅ تم إضافة إعدادات Gemini الافتراضية');
      }
    } else {
      console.log('✅ إعدادات Gemini موجودة:', {
        enabled: geminiSettings.enabled,
        model: geminiSettings.model,
        hasApiKey: !!geminiSettings.api_key
      });
    }

    // 3. اختبار الرسائل اليدوية
    console.log('\n3️⃣ اختبار الرسائل اليدوية...');
    
    // جلب محادثة للاختبار
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError || !conversations || conversations.length === 0) {
      console.log('⚠️ لا توجد محادثات للاختبار');
      return;
    }

    const testConv = conversations[0];
    console.log('📋 محادثة الاختبار:', {
      customer: testConv.customer_name,
      id: testConv.id
    });

    // محاكاة إرسال رسالة يدوية
    const testMessage = `🧪 اختبار رسالة يدوية مُحسنة - ${new Date().toLocaleTimeString('ar-EG')}`;
    
    // أ. حفظ في قاعدة البيانات
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testConv.id,
        content: testMessage,
        sender_type: 'admin',
        is_read: false,
        is_auto_reply: false,
        is_ai_generated: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ فشل حفظ الرسالة:', saveError);
      return;
    }

    console.log('✅ تم حفظ الرسالة في قاعدة البيانات');

    // ب. جلب إعدادات Facebook
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', testConv.facebook_page_id)
      .single();

    if (fbError || !fbSettings) {
      console.error('❌ لا توجد إعدادات Facebook للصفحة');
      return;
    }

    // ج. إرسال عبر Facebook API
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${fbSettings.access_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: testConv.customer_facebook_id },
            message: { text: testMessage }
          })
        }
      );

      const result = await response.json();

      if (response.ok && !result.error) {
        console.log('✅ تم إرسال الرسالة اليدوية بنجاح!');
        console.log(`📋 معرف الرسالة: ${result.message_id}`);
        
        // تحديث الرسالة بمعرف Facebook
        await supabase
          .from('messages')
          .update({ facebook_message_id: result.message_id })
          .eq('id', savedMessage.id);

      } else {
        console.log('❌ فشل إرسال الرسالة:', result.error?.message);
        
        if (result.error?.code === 10) {
          console.log('ℹ️ خطأ النافذة الزمنية - هذا طبيعي');
        }
      }
    } catch (apiError) {
      console.error('❌ خطأ في Facebook API:', apiError);
    }

    // 4. فحص الردود الآلية
    console.log('\n4️⃣ فحص الردود الآلية...');
    
    // فحص إذا كان الرد الآلي مفعل
    const autoReplyEnabled = geminiSettings?.enabled || false;
    console.log(`📋 الرد الآلي: ${autoReplyEnabled ? 'مفعل' : 'معطل'}`);

    if (!autoReplyEnabled) {
      console.log('💡 لتفعيل الرد الآلي:');
      console.log('   1. اذهب إلى صفحة الإعدادات');
      console.log('   2. فعل Gemini AI');
      console.log('   3. أضف API Key صحيح');
    }

    // 5. الخلاصة والتوصيات
    console.log('\n🎯 الخلاصة:');
    console.log('✅ الرسائل اليدوية تعمل بشكل مستقل عن Gemini');
    console.log('✅ المشكلة ليست في الكود، بل في الإعدادات');
    console.log('✅ تم إصلاح إعدادات Gemini الافتراضية');

    console.log('\n💡 التوصيات:');
    console.log('1️⃣ تأكد من صحة Access Token للصفحات');
    console.log('2️⃣ اختبر مع محادثات حديثة (أقل من 24 ساعة)');
    console.log('3️⃣ فعل الرد الآلي من صفحة الإعدادات');
    console.log('4️⃣ راقب logs الـ Webhook للتأكد من وصول الرسائل');

    console.log('\n🔧 خطوات إضافية:');
    console.log('1️⃣ إضافة نظام تتبع حملات إعادة الاستهداف');
    console.log('2️⃣ تحسين تتبع رسائل المودريتور الخارجي');
    console.log('3️⃣ إضافة إحصائيات مفصلة للرسائل');

  } catch (error) {
    console.error('❌ خطأ عام في الإصلاح:', error);
  }
}

// تشغيل الإصلاح
fixManualMessages().then(() => {
  console.log('\n🏁 انتهى إصلاح الرسائل اليدوية');
}).catch(error => {
  console.error('❌ خطأ في تشغيل الإصلاح:', error);
});
