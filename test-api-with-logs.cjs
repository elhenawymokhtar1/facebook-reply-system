const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testApiWithLogs() {
  try {
    console.log('🧪 اختبار API مع مراقبة السجلات...\n');
    
    const testConversationId = 'test-api-logs-' + Date.now();
    const testMessage = 'عايزة اشوف كوتشي أحمر';
    
    console.log(`📝 معرف المحادثة: ${testConversationId}`);
    console.log(`💬 الرسالة: "${testMessage}"`);
    
    // 1. مسح أي رسائل سابقة
    await supabase
      .from('test_messages')
      .delete()
      .eq('conversation_id', testConversationId);
    
    console.log('\n📤 إرسال طلب إلى API...');
    
    // 2. إرسال الطلب
    const startTime = Date.now();
    const response = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-user-logs',
        messageText: testMessage,
        pageId: 'test-page',
        conversationId: testConversationId
      })
    });
    
    const endTime = Date.now();
    console.log(`⏱️ وقت الاستجابة: ${endTime - startTime}ms`);
    
    if (!response.ok) {
      console.error(`❌ خطأ في API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`📄 تفاصيل الخطأ: ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`📊 نتيجة API:`, result);
    
    // 3. انتظار قصير للمعالجة
    console.log('\n⏳ انتظار معالجة الرسالة...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
    
    console.log(`📊 عدد الرسائل المحفوظة: ${messages?.length || 0}`);
    
    if (messages && messages.length > 0) {
      messages.forEach((msg, index) => {
        const sender = msg.sender_type === 'user' ? '👤 العميل' : '🤖 Gemini';
        console.log(`\n${index + 1}. ${sender}:`);
        console.log(`   📝 المحتوى: ${msg.content}`);
        console.log(`   🕒 الوقت: ${new Date(msg.created_at).toLocaleTimeString()}`);
        
        // فحص أوامر الصور
        if (msg.content.includes('[SEND_IMAGE:')) {
          const imageCommands = msg.content.match(/\[SEND_IMAGE:[^\]]+\]/g);
          if (imageCommands) {
            console.log(`   📸 أوامر الصور: ${imageCommands.join(', ')}`);
          }
        }
        
        // فحص رسائل الصور المحفوظة
        if (msg.content.startsWith('📸 صورة')) {
          console.log(`   🖼️ هذه رسالة صورة! ✅`);
        }
      });
    }
    
    // 5. فحص إضافي - البحث عن صور في قاعدة البيانات
    console.log('\n🔍 فحص صور المنتجات المتاحة...');
    
    const { data: variants } = await supabase
      .from('product_variants')
      .select('color, image_url')
      .not('image_url', 'is', null)
      .limit(5);
    
    console.log(`📸 عدد صور المتغيرات المتاحة: ${variants?.length || 0}`);
    if (variants && variants.length > 0) {
      variants.forEach(v => {
        console.log(`   - ${v.color}: ${v.image_url?.substring(0, 50)}...`);
      });
    }
    
    // 6. اختبار البحث المباشر
    console.log('\n🔍 اختبار البحث المباشر عن "أحمر"...');
    
    const { data: redProducts } = await supabase
      .from('product_variants')
      .select('color, image_url')
      .ilike('color', '%أحمر%')
      .not('image_url', 'is', null);
    
    console.log(`🔴 منتجات حمراء: ${redProducts?.length || 0}`);
    
    // 7. النتيجة النهائية
    const imageMessages = messages?.filter(msg => 
      msg.sender_type === 'bot' && msg.content.startsWith('📸 صورة')
    ) || [];
    
    console.log(`\n🎯 النتيجة النهائية:`);
    console.log(`   📨 إجمالي الرسائل: ${messages?.length || 0}`);
    console.log(`   🖼️ رسائل الصور: ${imageMessages.length}`);
    console.log(`   ✅ نجح إرسال الصور: ${imageMessages.length > 0 ? 'نعم' : 'لا'}`);
    
    return imageMessages.length > 0;
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return false;
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testApiWithLogs().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 النظام يعمل! تم إرسال الصور بنجاح');
    } else {
      console.log('❌ النظام لا يرسل الصور - يحتاج مراجعة');
      console.log('💡 تحقق من:');
      console.log('   1. سجلات السرفر في الطرفية');
      console.log('   2. إعدادات Gemini في قاعدة البيانات');
      console.log('   3. وجود صور في قاعدة البيانات');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testApiWithLogs };
