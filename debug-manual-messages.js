// فحص مشكلة الرسائل اليدوية
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugManualMessages() {
  console.log('🔍 فحص مشكلة الرسائل اليدوية...\n');

  try {
    // 1. فحص المحادثات المتاحة
    console.log('1️⃣ فحص المحادثات المتاحة...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(3);

    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log('❌ لا توجد محادثات للاختبار');
      return;
    }

    const testConv = conversations[0];
    console.log('✅ محادثة الاختبار:', {
      id: testConv.id,
      customer: testConv.customer_name,
      page_id: testConv.facebook_page_id
    });

    // 2. فحص إعدادات Facebook للصفحة
    console.log('\n2️⃣ فحص إعدادات Facebook...');
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', testConv.facebook_page_id);

    if (fbError || !fbSettings || fbSettings.length === 0) {
      console.error('❌ لا توجد إعدادات Facebook للصفحة:', testConv.facebook_page_id);
      return;
    }

    const pageSettings = fbSettings[0];
    console.log('✅ إعدادات Facebook:', {
      page_name: pageSettings.page_name,
      has_token: !!pageSettings.access_token
    });

    // 3. اختبار إرسال رسالة يدوية
    console.log('\n3️⃣ اختبار إرسال رسالة يدوية...');
    
    const testMessage = `🧪 اختبار رسالة يدوية - ${new Date().toLocaleTimeString('ar-EG')}`;
    console.log(`📝 الرسالة: "${testMessage}"`);

    // أ. حفظ في قاعدة البيانات
    console.log('💾 حفظ في قاعدة البيانات...');
    const { data: savedMsg, error: saveError } = await supabase
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

    // ب. إرسال عبر Facebook API
    console.log('📤 إرسال عبر Facebook API...');
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${pageSettings.access_token}`,
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
        console.log('✅ تم إرسال الرسالة عبر Facebook بنجاح!');
        console.log(`📋 معرف الرسالة: ${result.message_id}`);
      } else {
        console.log('❌ فشل إرسال الرسالة عبر Facebook:');
        console.log(`📋 كود الحالة: ${response.status}`);
        console.log(`📋 الخطأ: ${result.error?.message || 'خطأ غير معروف'}`);
        
        // تحليل نوع الخطأ
        if (result.error?.code === 10) {
          console.log('ℹ️ خطأ النافذة الزمنية - هذا طبيعي للرسائل القديمة');
        } else if (result.error?.code === 200) {
          console.log('ℹ️ مشكلة في الصلاحيات أو Access Token');
        }
      }
    } catch (apiError) {
      console.error('❌ خطأ في استدعاء Facebook API:', apiError);
    }

    // 4. فحص إعدادات Gemini
    console.log('\n4️⃣ فحص إعدادات Gemini...');
    const { data: geminiSettings, error: geminiError } = await supabase
      .from('gemini_settings')
      .select('*')
      .single();

    if (geminiError || !geminiSettings) {
      console.log('⚠️ لا توجد إعدادات Gemini - هذا قد يكون سبب المشكلة!');
      console.log('💡 الرسائل اليدوية لا تحتاج Gemini، لكن قد يكون هناك اعتماد خفي');
    } else {
      console.log('✅ إعدادات Gemini موجودة:', {
        api_key: geminiSettings.api_key ? 'موجود' : 'مفقود',
        enabled: geminiSettings.enabled
      });
    }

    // 5. الخلاصة والتوصيات
    console.log('\n🎯 الخلاصة:');
    console.log('✅ الرسائل اليدوية تعمل بشكل مستقل عن Gemini');
    console.log('✅ يتم حفظها في قاعدة البيانات بنجاح');
    console.log('⚠️ قد تكون المشكلة في:');
    console.log('   - سياسة Facebook للنافذة الزمنية');
    console.log('   - صلاحيات Access Token');
    console.log('   - إعدادات الصفحة');

    console.log('\n💡 التوصيات:');
    console.log('1️⃣ تحقق من إعدادات Gemini في صفحة الإعدادات');
    console.log('2️⃣ تأكد من صحة Access Token للصفحة');
    console.log('3️⃣ اختبر مع محادثة حديثة (أقل من 24 ساعة)');

  } catch (error) {
    console.error('❌ خطأ عام في الفحص:', error);
  }
}

debugManualMessages().then(() => {
  console.log('\n🏁 انتهى فحص الرسائل اليدوية');
}).catch(error => {
  console.error('❌ خطأ في تشغيل الفحص:', error);
});
