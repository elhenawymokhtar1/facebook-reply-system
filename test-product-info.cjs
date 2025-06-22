const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductInfo() {
  try {
    console.log('🔍 اختبار معلومات المنتج المحدثة...\n');
    
    // 1. فحص البيانات المحدثة
    console.log('1️⃣ فحص وصف المنتج المحدث:');
    const { data: product } = await supabase
      .from('ecommerce_products')
      .select('name, description')
      .eq('name', 'حذاء كاجوال جلد طبيعي')
      .single();
    
    if (product) {
      console.log(`📝 الاسم: ${product.name}`);
      console.log(`📄 الوصف: ${product.description}`);
      
      // استخراج الألوان من الوصف
      const colorsMatch = product.description.match(/متوفر بالألوان: ([^📏\n]+)/);
      if (colorsMatch) {
        const colors = colorsMatch[1].split(', ');
        console.log(`🎨 الألوان في الوصف: ${colors.length} لون`);
        colors.forEach((color, index) => {
          console.log(`   ${index + 1}. ${color.trim()}`);
        });
      }
    }
    
    // 2. فحص المتغيرات الفعلية
    console.log('\n2️⃣ فحص المتغيرات الفعلية:');
    const { data: variants } = await supabase
      .from('product_variants')
      .select('color, size, price')
      .eq('product_id', product ? await getProductId('حذاء كاجوال جلد طبيعي') : null);
    
    if (variants && variants.length > 0) {
      const uniqueColors = [...new Set(variants.map(v => v.color))];
      const uniqueSizes = [...new Set(variants.map(v => v.size))];
      
      console.log(`🎨 الألوان الفعلية: ${uniqueColors.length} لون`);
      uniqueColors.forEach((color, index) => {
        const count = variants.filter(v => v.color === color).length;
        console.log(`   ${index + 1}. ${color} (${count} متغير)`);
      });
      
      console.log(`📏 المقاسات: ${uniqueSizes.join(', ')}`);
    }
    
    // 3. اختبار Gemini مع السؤال عن الحذاء الكاجوال
    console.log('\n3️⃣ اختبار Gemini مع السؤال عن الحذاء الكاجوال:');
    
    const testConversationId = `test-product-info-${Date.now()}`;
    
    // مسح الرسائل السابقة
    await supabase
      .from('test_messages')
      .delete()
      .eq('conversation_id', testConversationId);
    
    // إرسال السؤال
    const response = await fetch('http://localhost:3002/api/gemini/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-product-info',
        messageText: 'عايز أعرف تفاصيل حذاء كاجوال جلد طبيعي',
        pageId: 'test-page',
        conversationId: testConversationId
      })
    });
    
    if (!response.ok) {
      console.error(`❌ خطأ في API: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    console.log(`📊 نتيجة API: ${result.success ? 'نجح ✅' : 'فشل ❌'}`);
    
    // انتظار المعالجة
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // فحص الرد
    const { data: messages } = await supabase
      .from('test_messages')
      .select('*')
      .eq('conversation_id', testConversationId)
      .order('created_at', { ascending: true });
    
    if (messages && messages.length > 0) {
      const botMessage = messages.find(m => m.sender_type === 'bot');
      if (botMessage) {
        console.log(`🤖 رد Gemini:`);
        console.log(botMessage.content);
        
        // تحليل الرد للبحث عن الألوان
        const mentionedColors = [];
        const allColors = ['بني', 'أسود', 'أحمر', 'أزرق داكن', 'أزرق', 'رمادي'];
        
        allColors.forEach(color => {
          if (botMessage.content.includes(color)) {
            mentionedColors.push(color);
          }
        });
        
        console.log(`\n📊 تحليل الرد:`);
        console.log(`🎨 الألوان المذكورة: ${mentionedColors.length}/${allColors.length}`);
        mentionedColors.forEach(color => {
          console.log(`   ✅ ${color}`);
        });
        
        const missingColors = allColors.filter(color => !mentionedColors.includes(color));
        if (missingColors.length > 0) {
          console.log(`❌ الألوان المفقودة:`);
          missingColors.forEach(color => {
            console.log(`   ❌ ${color}`);
          });
        }
        
        if (mentionedColors.length === allColors.length) {
          console.log(`\n🎉 ممتاز! Gemini ذكر جميع الألوان المتاحة`);
        } else {
          console.log(`\n⚠️ Gemini لم يذكر جميع الألوان المتاحة`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

async function getProductId(productName) {
  try {
    const { data: product } = await supabase
      .from('ecommerce_products')
      .select('id')
      .eq('name', productName)
      .single();
    
    return product ? product.id : null;
  } catch (error) {
    console.error('خطأ في جلب معرف المنتج:', error);
    return null;
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testProductInfo().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ انتهى اختبار معلومات المنتج');
    process.exit(0);
  });
}

module.exports = { testProductInfo };
