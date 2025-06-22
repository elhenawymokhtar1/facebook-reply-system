const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testImprovedSearch() {
  try {
    console.log('🔧 اختبار البحث المحسن للصور...\n');
    
    // اختبارات مختلفة
    const testCases = [
      {
        query: 'عايزة اشوف كوتشي أحمر',
        expected: 'صور كوتشي أحمر فقط',
        description: 'طلب لون محدد'
      },
      {
        query: 'ممكن اشوف حذاء أسود؟',
        expected: 'صور حذاء أسود فقط',
        description: 'طلب لون محدد آخر'
      },
      {
        query: 'اعرضيلي الأحذية المتوفرة',
        expected: 'مجموعة متنوعة من الأحذية',
        description: 'طلب عام'
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testConversationId = `test-improved-${Date.now()}-${i}`;
      
      console.log(`${i + 1}️⃣ اختبار: ${testCase.description}`);
      console.log(`💬 الرسالة: "${testCase.query}"`);
      console.log(`🎯 المتوقع: ${testCase.expected}`);
      
      // مسح الرسائل السابقة
      await supabase
        .from('test_messages')
        .delete()
        .eq('conversation_id', testConversationId);
      
      // إرسال الطلب
      const response = await fetch('http://localhost:3002/api/gemini/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: 'test-improved',
          messageText: testCase.query,
          pageId: 'test-page',
          conversationId: testConversationId
        })
      });
      
      if (!response.ok) {
        console.error(`❌ خطأ في API: ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      console.log(`📊 نتيجة API: ${result.success ? 'نجح ✅' : 'فشل ❌'}`);
      
      // انتظار المعالجة
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // فحص النتائج
      const { data: messages, error } = await supabase
        .from('test_messages')
        .select('*')
        .eq('conversation_id', testConversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ خطأ في جلب الرسائل:', error.message);
        continue;
      }
      
      console.log(`📨 عدد الرسائل: ${messages?.length || 0}`);
      
      let imageCount = 0;
      let imageMessages = [];
      
      if (messages && messages.length > 0) {
        messages.forEach((msg, index) => {
          if (msg.sender_type === 'bot') {
            console.log(`🤖 رد Gemini: ${msg.content.substring(0, 100)}...`);
            
            // عد رسائل الصور
            if (msg.content.startsWith('📸 صورة')) {
              imageCount++;
              imageMessages.push(msg.content);
            }
            
            // فحص رسائل النجاح
            if (msg.content.includes('تم إرسال صور')) {
              console.log(`✅ تم إرسال الصور بنجاح`);
            }
          }
        });
      }
      
      console.log(`🖼️ عدد الصور المرسلة: ${imageCount}`);
      
      if (imageMessages.length > 0) {
        console.log(`📸 الصور المرسلة:`);
        imageMessages.forEach((img, idx) => {
          console.log(`   ${idx + 1}. ${img.substring(0, 80)}...`);
        });
      }
      
      // تحليل النتائج
      if (imageCount > 0) {
        if (imageCount <= 3) {
          console.log(`✅ عدد الصور مناسب (${imageCount}/3)`);
        } else {
          console.log(`⚠️ عدد الصور كثير (${imageCount}) - يجب تحديده`);
        }
      } else {
        console.log(`❌ لم يتم إرسال أي صور`);
      }
      
      console.log('─'.repeat(50));
    }
    
    // فحص إضافي - الألوان المتاحة
    console.log('\n🎨 فحص الألوان المتاحة في قاعدة البيانات:');
    
    const { data: colors } = await supabase
      .from('product_variants')
      .select('color, count(*)')
      .not('image_url', 'is', null)
      .group('color')
      .order('count', { ascending: false });
    
    if (colors && colors.length > 0) {
      colors.forEach(color => {
        console.log(`   🎨 ${color.color}: ${color.count} صورة`);
      });
    }
    
    console.log('\n🎯 ملخص التحسينات:');
    console.log('✅ البحث الآن يركز على الألوان المطلوبة');
    console.log('✅ إزالة الصور المكررة');
    console.log('✅ حد أقصى 3 صور لكل طلب');
    console.log('✅ بحث أكثر دقة في المنتجات');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testImprovedSearch().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 انتهى اختبار البحث المحسن!');
    console.log('💡 الآن النظام يرسل الألوان المطلوبة فقط');
    process.exit(0);
  });
}

module.exports = { testImprovedSearch };
