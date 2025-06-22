const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageSystemFinal() {
  console.log('🎯 اختبار نهائي لنظام إرسال الصور...\n');

  try {
    // 1. مسح المحادثة التجريبية
    const testConversationId = 'test-conversation-fixed';
    console.log('🧹 مسح المحادثة التجريبية السابقة...');
    
    await supabase
      .from('test_messages')
      .delete()
      .eq('conversation_id', testConversationId);

    console.log('✅ تم مسح المحادثة السابقة');

    // 2. اختبار طلب صورة
    console.log('\n📸 اختبار طلب صورة من Gemini...');
    
    const testMessage = 'عايزة اشوف كوتشي أحمر';
    console.log(`💬 الرسالة: "${testMessage}"`);

    // استدعاء API مباشرة
    const response = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-user',
        messageText: testMessage,
        pageId: 'test-page',
        conversationId: testConversationId
      })
    });

    if (!response.ok) {
      console.error(`❌ خطأ في API: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log(`📊 نتيجة API: ${result.success ? 'نجح ✅' : 'فشل ❌'}`);

    // 3. انتظار قصير للمعالجة
    console.log('\n⏳ انتظار معالجة الرسالة...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. فحص الرسائل المحفوظة
    console.log('\n📨 فحص الرسائل المحفوظة...');
    
    const { data: messages, error } = await supabase
      .from('test_messages')
      .select('*')
      .eq('conversation_id', testConversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ خطأ في جلب الرسائل:', error.message);
      return false;
    }

    console.log(`📊 عدد الرسائل: ${messages?.length || 0}`);

    if (messages && messages.length > 0) {
      messages.forEach((msg, index) => {
        const sender = msg.sender_type === 'user' ? '👤 العميل' : '🤖 Gemini';
        console.log(`\n${index + 1}. ${sender}:`);
        console.log(`   📝 المحتوى: ${msg.content.substring(0, 100)}...`);
        
        // فحص الصور
        if (msg.content.startsWith('📸 صورة')) {
          console.log(`   🖼️ هذه رسالة صورة! ✅`);
          
          // استخراج رابط الصورة
          const imageUrl = msg.content.split(': ')[1];
          if (imageUrl && imageUrl.startsWith('http')) {
            console.log(`   🔗 رابط الصورة: ${imageUrl.substring(0, 50)}...`);
          }
        }
        
        // فحص أوامر الصور في النص
        if (msg.content.includes('[SEND_IMAGE:')) {
          const imageCommands = msg.content.match(/\[SEND_IMAGE:[^\]]+\]/g);
          if (imageCommands) {
            console.log(`   📸 أوامر الصور: ${imageCommands.join(', ')}`);
          }
        }
      });
    }

    // 5. فحص وجود صور في الردود
    const imageMessages = messages?.filter(msg => 
      msg.sender_type === 'bot' && msg.content.startsWith('📸 صورة')
    ) || [];

    console.log(`\n📊 إحصائيات النتائج:`);
    console.log(`   📨 إجمالي الرسائل: ${messages?.length || 0}`);
    console.log(`   🖼️ رسائل الصور: ${imageMessages.length}`);
    console.log(`   ✅ نجح إرسال الصور: ${imageMessages.length > 0 ? 'نعم' : 'لا'}`);

    // 6. اختبار إضافي - طلب آخر
    console.log('\n🔄 اختبار إضافي - طلب صور أخرى...');
    
    const testMessage2 = 'ممكن اشوف حذاء أسود؟';
    console.log(`💬 الرسالة: "${testMessage2}"`);

    const response2 = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-user',
        messageText: testMessage2,
        pageId: 'test-page',
        conversationId: testConversationId
      })
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log(`📊 نتيجة الاختبار الثاني: ${result2.success ? 'نجح ✅' : 'فشل ❌'}`);
    }

    // انتظار ثم فحص نهائي
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: finalMessages } = await supabase
      .from('test_messages')
      .select('*')
      .eq('conversation_id', testConversationId)
      .order('created_at', { ascending: true });

    const finalImageMessages = finalMessages?.filter(msg => 
      msg.sender_type === 'bot' && msg.content.startsWith('📸 صورة')
    ) || [];

    console.log(`\n🎯 النتيجة النهائية:`);
    console.log(`   📨 إجمالي الرسائل: ${finalMessages?.length || 0}`);
    console.log(`   🖼️ إجمالي رسائل الصور: ${finalImageMessages.length}`);
    
    if (finalImageMessages.length > 0) {
      console.log(`\n✅ نجح النظام! تم إرسال ${finalImageMessages.length} صورة`);
      console.log(`🎉 يمكن للعملاء الآن طلب صور المنتجات من Gemini!`);
      return true;
    } else {
      console.log(`\n❌ لم يتم إرسال أي صور - يحتاج النظام مراجعة`);
      return false;
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return false;
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testImageSystemFinal().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 نظام إرسال الصور يعمل بالكامل!');
      console.log('🚀 جاهز للاستخدام في صفحة http://localhost:8080/simple-test-chat');
    } else {
      console.log('❌ يحتاج النظام إلى مراجعة إضافية');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testImageSystemFinal };
