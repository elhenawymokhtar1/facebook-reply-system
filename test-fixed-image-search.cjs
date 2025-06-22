const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedImageSearch() {
  try {
    console.log('🔧 اختبار البحث المصحح عن الصور...\n');
    
    const testConversationId = 'test-fixed-search-' + Date.now();
    
    // 1. مسح أي رسائل سابقة
    await supabase
      .from('test_messages')
      .delete()
      .eq('conversation_id', testConversationId);
    
    console.log('📤 اختبار طلب صورة كوتشي أحمر...');
    
    // 2. إرسال طلب صورة
    const response = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-user-fixed',
        messageText: 'عايزة اشوف كوتشي أحمر',
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
    
    // 3. انتظار المعالجة
    console.log('\n⏳ انتظار معالجة الرسالة...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. فحص الرسائل
    const { data: messages, error } = await supabase
      .from('test_messages')
      .select('*')
      .eq('conversation_id', testConversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ خطأ في جلب الرسائل:', error.message);
      return false;
    }
    
    console.log(`\n📨 عدد الرسائل: ${messages?.length || 0}`);
    
    let foundImages = false;
    
    if (messages && messages.length > 0) {
      messages.forEach((msg, index) => {
        const sender = msg.sender_type === 'user' ? '👤 العميل' : '🤖 Gemini';
        console.log(`\n${index + 1}. ${sender}:`);
        console.log(`   📝 المحتوى: ${msg.content.substring(0, 100)}...`);
        
        // فحص رسائل الصور
        if (msg.content.startsWith('📸 صورة')) {
          console.log(`   🖼️ هذه رسالة صورة! ✅`);
          foundImages = true;
        }
        
        // فحص أوامر الصور في النص
        if (msg.content.includes('[SEND_IMAGE:')) {
          console.log(`   📸 يحتوي على أمر صورة (لم يُنفذ)`);
        }
        
        // فحص رسائل النجاح
        if (msg.content.includes('تم إرسال صور')) {
          console.log(`   ✅ رسالة نجاح إرسال الصور`);
          foundImages = true;
        }
        
        // فحص رسائل الفشل
        if (msg.content.includes('لا توجد صور متاحة')) {
          console.log(`   ❌ لا توجد صور متاحة`);
        }
      });
    }
    
    // 5. اختبار البحث المباشر
    console.log('\n🔍 اختبار البحث المباشر في قاعدة البيانات...');
    
    // البحث عن أحمر
    const { data: redVariants } = await supabase
      .from('product_variants')
      .select('image_url, color, size')
      .ilike('color', '%أحمر%')
      .not('image_url', 'is', null)
      .limit(3);
    
    console.log(`🔴 منتجات حمراء: ${redVariants?.length || 0}`);
    if (redVariants && redVariants.length > 0) {
      redVariants.forEach(v => {
        console.log(`   - ${v.color} مقاس ${v.size}: ${v.image_url.substring(0, 50)}...`);
      });
    }
    
    // 6. النتيجة النهائية
    console.log(`\n🎯 النتيجة النهائية:`);
    console.log(`   📨 إجمالي الرسائل: ${messages?.length || 0}`);
    console.log(`   🖼️ تم إرسال صور: ${foundImages ? 'نعم ✅' : 'لا ❌'}`);
    console.log(`   📸 صور متاحة في قاعدة البيانات: ${redVariants?.length || 0}`);
    
    return foundImages;
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return false;
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testFixedImageSearch().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 النظام يعمل! تم إرسال الصور بنجاح');
    } else {
      console.log('❌ النظام لا يزال لا يرسل الصور');
      console.log('💡 تحقق من:');
      console.log('   1. إعادة تشغيل السرفر');
      console.log('   2. سجلات السرفر');
      console.log('   3. دالة البحث المحدثة');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testFixedImageSearch };
