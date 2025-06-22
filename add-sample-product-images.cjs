const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleProductImages() {
  console.log('📸 إضافة صور تجريبية للمنتجات...\n');

  try {
    // 1. إضافة منتجات تجريبية مع صور
    console.log('1️⃣ إضافة منتجات تجريبية...');
    
    const sampleProducts = [
      {
        name: 'كوتشي رياضي أحمر',
        description: 'حذاء رياضي مريح باللون الأحمر',
        price: 200,
        category: 'أحذية',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center',
        is_available: true,
        stock_quantity: 10
      },
      {
        name: 'حذاء كلاسيكي أسود',
        description: 'حذاء كلاسيكي أنيق باللون الأسود',
        price: 250,
        category: 'أحذية',
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
        is_available: true,
        stock_quantity: 8
      },
      {
        name: 'كوتشي أبيض عصري',
        description: 'حذاء رياضي عصري باللون الأبيض',
        price: 180,
        category: 'أحذية',
        image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center',
        is_available: true,
        stock_quantity: 15
      },
      {
        name: 'حذاء بني كاجوال',
        description: 'حذاء كاجوال مريح باللون البني',
        price: 220,
        category: 'أحذية',
        image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop&crop=center',
        is_available: true,
        stock_quantity: 12
      }
    ];

    for (const product of sampleProducts) {
      const { data, error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'name' })
        .select();

      if (error) {
        console.error(`❌ خطأ في إضافة ${product.name}:`, error.message);
      } else {
        console.log(`✅ تم إضافة: ${product.name}`);
      }
    }

    // 2. تحديث متغيرات المنتجات بصور إضافية
    console.log('\n2️⃣ تحديث متغيرات المنتجات بصور...');
    
    const colorImages = {
      'أحمر': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center',
      'أسود': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
      'أبيض': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center',
      'بني': 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop&crop=center',
      'بيج': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center'
    };

    let updatedCount = 0;
    for (const [color, imageUrl] of Object.entries(colorImages)) {
      const { data, error } = await supabase
        .from('product_variants')
        .update({ image_url: imageUrl })
        .eq('color', color)
        .select('sku');

      if (!error && data) {
        updatedCount += data.length;
        console.log(`✅ تم تحديث ${data.length} متغير للون ${color}`);
      }
    }

    console.log(`\n📊 إجمالي المتغيرات المحدثة: ${updatedCount}`);

    // 3. فحص النتائج
    console.log('\n3️⃣ فحص النتائج...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, image_url')
      .not('image_url', 'is', null);

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('color, image_url')
      .not('image_url', 'is', null);

    console.log(`📸 المنتجات مع الصور: ${products?.length || 0}`);
    console.log(`📸 متغيرات المنتجات مع الصور: ${variants?.length || 0}`);

    if (products?.length > 0) {
      console.log('\n🖼️ أمثلة على صور المنتجات:');
      products.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name}`);
      });
    }

    if (variants?.length > 0) {
      console.log('\n🎨 أمثلة على صور المتغيرات:');
      variants.slice(0, 5).forEach(v => {
        console.log(`   - لون ${v.color}`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ خطأ في إضافة الصور:', error.message);
    return false;
  }
}

// تشغيل الإضافة
if (require.main === module) {
  addSampleProductImages().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ تم إضافة صور المنتجات التجريبية بنجاح!');
      console.log('🧪 يمكن الآن اختبار نظام إرسال الصور');
    } else {
      console.log('❌ فشل في إضافة الصور');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { addSampleProductImages };
