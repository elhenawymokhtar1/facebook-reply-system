const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testColorExtraction() {
  try {
    console.log('🔍 اختبار استخراج الألوان من وصف المنتج...\n');

    // 1. جلب المنتج من قاعدة البيانات
    console.log('1️⃣ جلب بيانات المنتج:');
    const { data: product, error: productError } = await supabase
      .from('ecommerce_products')
      .select('id, name, description, price')
      .ilike('name', '%حذاء كاجوال جلد طبيعي%')
      .single();

    if (productError || !product) {
      console.error('❌ خطأ في جلب المنتج:', productError);
      return;
    }

    console.log(`📦 المنتج: ${product.name}`);
    console.log(`💰 السعر: ${product.price} ج`);
    console.log(`📄 الوصف: ${product.description.substring(0, 200)}...`);

    // 2. محاولة جلب المتغيرات من جدول product_variants
    console.log('\n2️⃣ فحص جدول product_variants:');
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('color, size, price')
      .eq('product_id', product.id);

    if (variantsError) {
      console.log(`⚠️ خطأ في جلب المتغيرات: ${variantsError.message}`);
    } else if (!variants || variants.length === 0) {
      console.log('⚠️ لا توجد متغيرات في جدول product_variants');
    } else {
      console.log(`✅ وجدت ${variants.length} متغير في جدول product_variants`);
      const uniqueColors = [...new Set(variants.map(v => v.color))];
      console.log(`🎨 الألوان من جدول المتغيرات: ${uniqueColors.join(', ')}`);
    }

    // 3. استخراج الألوان من الوصف (الطريقة الجديدة)
    console.log('\n3️⃣ استخراج الألوان من الوصف:');
    const description = product.description || '';

    // استخراج الألوان من الوصف
    const colorsMatch = description.match(/متوفر بالألوان:\s*([^📏\n]+)/);
    const sizesMatch = description.match(/متوفر بالمقاسات:\s*([^\n]+)/);

    if (colorsMatch) {
      const colors = colorsMatch[1].split(',').map(c => c.trim()).filter(c => c);
      console.log(`✅ استخرجت ${colors.length} لون من الوصف:`);
      colors.forEach((color, index) => {
        console.log(`   ${index + 1}. ${color}`);
      });
    } else {
      console.log('❌ لم أجد ألوان في الوصف');
    }

    if (sizesMatch) {
      const sizes = sizesMatch[1].split(',').map(s => s.trim()).filter(s => s);
      console.log(`✅ استخرجت ${sizes.length} مقاس من الوصف:`);
      console.log(`📏 المقاسات: ${sizes.join(', ')}`);
    } else {
      console.log('❌ لم أجد مقاسات في الوصف');
    }

    // 4. بناء المعلومات الديناميكية (كما يفعل البوت)
    console.log('\n4️⃣ بناء المعلومات الديناميكية:');
    let dynamicInfo = `${product.name}\n${description}\n\n`;

    if (colorsMatch) {
      const colors = colorsMatch[1].split(',').map(c => c.trim()).filter(c => c);
      dynamicInfo += `🎨 الألوان المتاحة: ${colors.join(', ')}\n`;
    }

    if (sizesMatch) {
      const sizes = sizesMatch[1].split(',').map(s => s.trim()).filter(s => s);
      dynamicInfo += `📏 المقاسات المتاحة: ${sizes.join(', ')}\n`;
    }

    dynamicInfo += `💰 السعر: ${product.price} جنيه\n`;

    console.log('📋 المعلومات النهائية التي سيرسلها البوت:');
    console.log('='.repeat(50));
    console.log(dynamicInfo);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار
testColorExtraction();