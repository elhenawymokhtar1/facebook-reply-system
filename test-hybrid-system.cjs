const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHybridSystem() {
  console.log('🧪 اختبار النظام الهجين الذكي...');

  try {
    // 1. إنشاء محادثة اختبار
    console.log('1️⃣ إنشاء محادثة اختبار...');
    
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        customer_name: 'اختبار النظام الهجين',
        customer_phone: '01000000000',
        facebook_page_id: 'test-page',
        status: 'active'
      })
      .select()
      .single();

    const testConversationId = conversation.id;

    if (convError) {
      console.error('❌ خطأ في إنشاء المحادثة:', convError.message);
      return;
    }

    console.log('✅ تم إنشاء المحادثة:', testConversationId);

    // 2. اختبار الأسئلة المختلفة
    const testMessages = [
      {
        type: 'عادي',
        message: 'إزيك؟',
        expected: 'رد ودود بدون منتجات'
      },
      {
        type: 'منتجات',
        message: 'عايزة اشوف المنتجات',
        expected: 'عرض المنتجات مع الأسعار'
      },
      {
        type: 'عادي',
        message: 'شكراً ليكي',
        expected: 'رد ودود بدون منتجات'
      },
      {
        type: 'منتجات',
        message: 'عندكم كوتشي أبيض؟',
        expected: 'بحث في المنتجات'
      }
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const test = testMessages[i];
      console.log(`\n${i + 2}️⃣ اختبار ${test.type}: "${test.message}"`);

      // إرسال رسالة العميل
      const { error: msgError } = await supabase
        .from('test_messages')
        .insert({
          conversation_id: testConversationId,
          content: test.message,
          sender_type: 'user'
        });

      if (msgError) {
        console.error('❌ خطأ في إرسال الرسالة:', msgError.message);
        continue;
      }

      // استدعاء Gemini AI
      try {
        const response = await fetch('http://localhost:3002/api/gemini/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            senderId: 'test-user',
            messageText: test.message,
            pageId: 'test-page'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ تم معالجة الرسالة بنجاح');
          
          // جلب رد Gemini
          const { data: aiResponse } = await supabase
            .from('test_messages')
            .select('content')
            .eq('conversation_id', testConversationId)
            .eq('sender_type', 'bot')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (aiResponse) {
            console.log('🤖 رد Gemini:', aiResponse.content.substring(0, 100) + '...');
            
            // تحليل الرد
            const hasProducts = aiResponse.content.includes('منتجات') || 
                              aiResponse.content.includes('سعر') || 
                              aiResponse.content.includes('ج');
            
            console.log('📊 تحليل الرد:');
            console.log('- يحتوي على معلومات منتجات:', hasProducts ? 'نعم ✅' : 'لا ❌');
            console.log('- طول الرد:', aiResponse.content.length, 'حرف');
            
            if (test.type === 'منتجات' && hasProducts) {
              console.log('🎯 النتيجة: مطابق للتوقع ✅');
            } else if (test.type === 'عادي' && !hasProducts) {
              console.log('🎯 النتيجة: مطابق للتوقع ✅');
            } else {
              console.log('⚠️ النتيجة: غير مطابق للتوقع');
            }
          }
        } else {
          console.log('❌ فشل في معالجة الرسالة:', result.message);
        }
      } catch (error) {
        console.error('❌ خطأ في استدعاء API:', error.message);
      }

      // انتظار قصير بين الاختبارات
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 3. تنظيف الاختبار
    console.log('\n🧹 تنظيف بيانات الاختبار...');
    
    await supabase
      .from('test_messages')
      .delete()
      .eq('conversation_id', testConversationId);
    
    await supabase
      .from('conversations')
      .delete()
      .eq('id', testConversationId);

    console.log('✅ تم تنظيف بيانات الاختبار');

    console.log('\n🎉 اكتمل اختبار النظام الهجين!');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error);
  }
}

testHybridSystem().catch(console.error);
