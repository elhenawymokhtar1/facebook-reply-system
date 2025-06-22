// اختبار شامل لتتبع مشكلة إرسال الصور
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugImageFlow() {
  console.log('🔍 بدء تشخيص شامل لنظام إرسال الصور...\n');

  // 1. فحص البيانات في قاعدة البيانات
  console.log('1️⃣ فحص البيانات في قاعدة البيانات...');
  
  // فحص المنتجات
  const { data: products, error: productsError } = await supabase
    .from('ecommerce_products')
    .select('id, name, image_url')
    .eq('status', 'active');
  
  console.log(`   📦 المنتجات: ${products?.length || 0} منتج`);
  if (products && products.length > 0) {
    products.forEach(p => {
      console.log(`      - ${p.name} (${p.id})`);
      if (p.image_url) console.log(`        🖼️ صورة: ${p.image_url.substring(0, 50)}...`);
    });
  }

  // فحص متغيرات المنتجات
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('product_id, color, size, image_url')
    .not('image_url', 'is', null);
  
  console.log(`\n   🎨 متغيرات المنتجات: ${variants?.length || 0} متغير`);
  if (variants && variants.length > 0) {
    variants.forEach(v => {
      console.log(`      - ${v.color} ${v.size} (${v.product_id})`);
      console.log(`        🖼️ صورة: ${v.image_url.substring(0, 50)}...`);
    });
  }

  // 2. اختبار دالة البحث عن الصور
  console.log('\n2️⃣ اختبار دالة البحث عن الصور...');
  
  // محاكاة دالة findProductImages
  async function testFindProductImages(searchQuery) {
    console.log(`   🔍 البحث عن: "${searchQuery}"`);
    
    let targetProduct = null;
    
    // إذا كان النص يحتوي على "حذاء" أو "كاجوال"، استخدم المنتج المعروف مباشرة
    if (searchQuery.includes('حذاء') || searchQuery.includes('كاجوال')) {
      targetProduct = {
        id: 'f99524cc-3361-4a86-a383-f3a02e030282',
        name: 'حذاء كاجوال جلد طبيعي'
      };
      console.log(`   ✅ استخدام المنتج المعروف: ${targetProduct.name}`);
    }

    if (!targetProduct) {
      console.log(`   ❌ لم يتم العثور على منتج مطابق`);
      return [];
    }

    // جلب متغيرات المنتج
    const { data: productVariants, error: productError } = await supabase
      .from('product_variants')
      .select('image_url, color, size, sku')
      .eq('product_id', targetProduct.id)
      .not('image_url', 'is', null)
      .order('color, size');

    console.log(`   📊 نتيجة البحث:`, {
      productVariants: productVariants?.length || 0,
      productError: productError?.message || 'لا يوجد خطأ'
    });

    if (productVariants && productVariants.length > 0) {
      console.log(`   ✅ وجدت ${productVariants.length} متغير:`);
      productVariants.forEach(v => {
        console.log(`      - ${v.color} ${v.size}: ${v.image_url.substring(0, 50)}...`);
      });
      
      // جمع الصور
      const imageUrls = [];
      const seenUrls = new Set();
      
      productVariants.forEach(variant => {
        if (variant.image_url && !seenUrls.has(variant.image_url)) {
          imageUrls.push(variant.image_url);
          seenUrls.add(variant.image_url);
        }
      });
      
      console.log(`   📤 سيتم إرسال: ${imageUrls.length} صورة`);
      return imageUrls.slice(0, 3); // حد أقصى 3 صور
    } else {
      console.log(`   ⚠️ لا توجد متغيرات للمنتج`);
      return [];
    }
  }

  const imageUrls = await testFindProductImages('حذاء كاجوال');

  // 3. اختبار دالة إرسال الصور
  console.log('\n3️⃣ اختبار دالة إرسال الصور...');
  
  if (imageUrls.length > 0) {
    console.log(`   📤 محاولة إرسال ${imageUrls.length} صورة...`);
    
    // محاكاة إرسال للمحادثة التجريبية
    const testConversationId = `test-debug-${Date.now()}`;
    
    let successCount = 0;
    for (const imageUrl of imageUrls) {
      try {
        const { error } = await supabase.from('test_messages').insert({
          conversation_id: testConversationId,
          content: `📸 صورة حذاء كاجوال: ${imageUrl}`,
          sender_type: 'bot'
        });
        
        if (!error) {
          successCount++;
          console.log(`   ✅ تم حفظ صورة: ${imageUrl.substring(0, 50)}...`);
        } else {
          console.log(`   ❌ فشل حفظ صورة: ${error.message}`);
        }
      } catch (error) {
        console.log(`   ❌ خطأ في حفظ صورة: ${error.message}`);
      }
    }
    
    console.log(`   📊 النتيجة: ${successCount}/${imageUrls.length} صورة تم حفظها بنجاح`);
    
    // فحص الرسائل المحفوظة
    const { data: savedMessages } = await supabase
      .from('test_messages')
      .select('*')
      .eq('conversation_id', testConversationId);
    
    console.log(`   🔍 الرسائل المحفوظة: ${savedMessages?.length || 0}`);
    
  } else {
    console.log(`   ❌ لا توجد صور للإرسال`);
  }

  // 4. اختبار دالة isImageRequest
  console.log('\n4️⃣ اختبار دالة isImageRequest...');
  
  function testIsImageRequest(message) {
    const imageKeywords = [
      'صور', 'صورة', 'اشوف', 'أشوف', 'عايز أشوف', 'عايزة أشوف',
      'اعرضي', 'اعرض', 'ممكن أشوف', 'عرضي', 'شكل', 'ألوان'
    ];
    
    const lowerMessage = message.toLowerCase();
    const result = imageKeywords.some(keyword => lowerMessage.includes(keyword));
    
    console.log(`   📝 "${message}" → ${result ? '✅ طلب صور' : '❌ ليس طلب صور'}`);
    return result;
  }

  testIsImageRequest('عايز أشوف صور حذاء كاجوال');
  testIsImageRequest('اعرضيلي الألوان');
  testIsImageRequest('ممكن أشوف الحذاء');
  testIsImageRequest('كام سعر الحذاء');

  console.log('\n✅ انتهى التشخيص الشامل');
}

// تشغيل التشخيص
debugImageFlow().catch(console.error);
