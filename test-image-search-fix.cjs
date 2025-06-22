const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageSearch() {
  try {
    console.log('🔍 اختبار البحث المحسن عن صور المنتجات...\n');

    // 1. اختبار البحث عن منتج محدد
    console.log('1️⃣ اختبار البحث عن "حذاء كاجوال جلد طبيعي":');
    await testNewProductSearch('حذاء كاجوال جلد طبيعي');

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. اختبار البحث عن منتج محدد + لون
    console.log('2️⃣ اختبار البحث عن "حذاء كاجوال أزرق":');
    await testNewProductSearch('حذاء كاجوال أزرق');

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. اختبار البحث عن منتج محدد + لون داكن
    console.log('3️⃣ اختبار البحث عن "حذاء كاجوال أزرق داكن":');
    await testNewProductSearch('حذاء كاجوال أزرق داكن');

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. اختبار البحث عن منتج غير موجود
    console.log('4️⃣ اختبار البحث عن منتج غير موجود:');
    await testNewProductSearch('حذاء رياضي نايك');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

async function testNewProductSearch(searchQuery) {
  console.log(`🔍 البحث المحسن عن: "${searchQuery}"`);

  // أولاً: تحديد المنتج المطلوب (محاكاة المنطق الجديد)
  let targetProduct = null;

  const productPatterns = [
    { pattern: /حذاء كاجوال|كاجوال جلد|جلد طبيعي/i, search: '%حذاء كاجوال%' },
    { pattern: /حذاء رياضي|كوتشي رياضي/i, search: '%رياضي%' },
    { pattern: /صندل|شبشب/i, search: '%صندل%' },
    { pattern: /بوت|جزمة/i, search: '%بوت%' }
  ];

  for (const { pattern, search } of productPatterns) {
    if (pattern.test(searchQuery)) {
      console.log(`🎯 وجدت منتج محدد: ${search}`);

      const { data: product, error } = await supabase
        .from('ecommerce_products')
        .select('id, name')
        .ilike('name', search)
        .single();

      if (!error && product) {
        targetProduct = product;
        console.log(`✅ تم العثور على المنتج: ${product.name}`);
        break;
      }
    }
  }

  if (!targetProduct) {
    console.log(`🔍 البحث العام عن المنتج...`);

    const { data: product, error } = await supabase
      .from('ecommerce_products')
      .select('id, name')
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(1)
      .single();

    if (!error && product) {
      targetProduct = product;
      console.log(`✅ وجدت منتج: ${product.name}`);
    }
  }

  // ثانياً: جلب صور المنتج المحدد
  if (targetProduct) {
    console.log(`🎯 جلب صور المنتج المحدد: ${targetProduct.name}`);

    const { data: variants } = await supabase
      .from('product_variants')
      .select('image_url, color, size, sku')
      .eq('product_id', targetProduct.id)
      .not('image_url', 'is', null)
      .order('color, size');

    if (variants && variants.length > 0) {
      const uniqueColors = [...new Set(variants.map(v => v.color))];
      console.log(`✅ وجدت ${variants.length} متغير للمنتج "${targetProduct.name}"`);
      console.log(`🎨 الألوان المتوفرة: ${uniqueColors.join(', ')}`);

      // إذا طلب لون محدد، اعرض هذا اللون فقط
      const colorKeywords = ['أحمر', 'أسود', 'أبيض', 'بني', 'أزرق', 'أزرق داكن', 'أخضر', 'رمادي', 'بيج'];
      const foundColors = colorKeywords.filter(color => searchQuery.includes(color));

      let filteredVariants = variants;
      if (foundColors.length > 0) {
        console.log(`🎨 تصفية حسب الألوان المطلوبة: ${foundColors.join(', ')}`);
        filteredVariants = variants.filter(variant =>
          foundColors.some(color => variant.color.includes(color))
        );
        console.log(`✅ بعد التصفية: ${filteredVariants.length} متغير`);
      }

      // عرض عينة من النتائج
      filteredVariants.slice(0, 5).forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.color} ${variant.size}: ${variant.image_url.substring(0, 50)}...`);
      });
    } else {
      console.log(`⚠️ لا توجد صور للمنتج "${targetProduct.name}"`);
    }
  } else {
    console.log('❌ لم أجد المنتج المطلوب');
  }
}

async function testColorSearch(searchQuery) {
  console.log(`🔍 البحث عن اللون: "${searchQuery}"`);
  
  const colorKeywords = ['أحمر', 'أسود', 'أبيض', 'بني', 'أزرق', 'أزرق داكن', 'أخضر', 'رمادي', 'بيج'];
  const foundColors = colorKeywords.filter(color => searchQuery.includes(color));
  
  console.log(`🎨 الألوان المطابقة: ${foundColors.join(', ')}`);
  
  if (foundColors.length > 0) {
    for (const color of foundColors) {
      const { data: colorVariants } = await supabase
        .from('product_variants')
        .select('image_url, color, size')
        .ilike('color', `%${color}%`)
        .not('image_url', 'is', null)
        .limit(3);

      if (colorVariants && colorVariants.length > 0) {
        console.log(`✅ وجدت ${colorVariants.length} صورة للون ${color}`);
        colorVariants.forEach((variant, index) => {
          console.log(`   ${index + 1}. ${variant.color} ${variant.size}: ${variant.image_url.substring(0, 50)}...`);
        });
      } else {
        console.log(`❌ لا توجد صور للون ${color}`);
      }
    }
  }
}

async function testGeneralSearch(searchQuery) {
  console.log(`🔍 البحث العام: "${searchQuery}"`);
  
  const { data: generalVariants } = await supabase
    .from('product_variants')
    .select('image_url, color, size')
    .not('image_url', 'is', null)
    .limit(6);

  if (generalVariants && generalVariants.length > 0) {
    console.log(`✅ وجدت ${generalVariants.length} صورة في البحث العام`);
    
    const uniqueColors = [...new Set(generalVariants.map(v => v.color))];
    console.log(`🎨 الألوان في النتائج: ${uniqueColors.join(', ')}`);
    
    generalVariants.forEach((variant, index) => {
      console.log(`   ${index + 1}. ${variant.color} ${variant.size}: ${variant.image_url.substring(0, 50)}...`);
    });
  } else {
    console.log('❌ لا توجد صور في البحث العام');
  }
}

// تشغيل الاختبار
testImageSearch();
