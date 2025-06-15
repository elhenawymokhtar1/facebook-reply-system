// اختبار نظام صور المتغيرات
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// اختبار جلب المتغيرات مع الصور
async function testVariantImages() {
  console.log('🧪 اختبار نظام صور المتغيرات...\n');

  try {
    // جلب المنتج "حذاء كاجوال جلد طبيعي"
    const { data: products } = await supabase
      .from('ecommerce_products')
      .select('id, name')
      .ilike('name', '%جلد طبيعي%');

    if (!products || products.length === 0) {
      console.log('❌ لم يتم العثور على المنتج');
      return;
    }

    const product = products[0];
    console.log(`📦 اختبار المنتج: ${product.name}`);
    console.log(`🆔 معرف المنتج: ${product.id}\n`);

    // جلب المتغيرات
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('color, size');

    if (error) {
      console.error('❌ خطأ في جلب المتغيرات:', error.message);
      return;
    }

    if (!variants || variants.length === 0) {
      console.log('⚠️ لا توجد متغيرات لهذا المنتج');
      return;
    }

    console.log(`✅ تم العثور على ${variants.length} متغير:\n`);

    // عرض المتغيرات مع الصور
    variants.forEach((variant, index) => {
      console.log(`${index + 1}. ${variant.sku}`);
      console.log(`   🎨 اللون: ${variant.color}`);
      console.log(`   📏 المقاس: ${variant.size}`);
      console.log(`   💰 السعر: ${variant.price} ج`);
      console.log(`   📦 المخزون: ${variant.stock_quantity}`);
      console.log(`   📸 الصورة: ${variant.image_url ? '✅ موجودة' : '❌ مفقودة'}`);
      if (variant.image_url) {
        console.log(`      الرابط: ${variant.image_url.substring(0, 50)}...`);
      }
      console.log('');
    });

    // إحصائيات
    const withImages = variants.filter(v => v.image_url).length;
    const withoutImages = variants.length - withImages;

    console.log('📊 الإحصائيات:');
    console.log(`   ✅ متغيرات بصور: ${withImages}`);
    console.log(`   ❌ متغيرات بدون صور: ${withoutImages}`);
    console.log(`   📈 نسبة التغطية: ${Math.round((withImages / variants.length) * 100)}%`);

    return variants;

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

// اختبار إضافة متغير جديد بصورة
async function testAddVariantWithImage() {
  console.log('\n🆕 اختبار إضافة متغير جديد بصورة...');

  try {
    // جلب المنتج
    const { data: products } = await supabase
      .from('ecommerce_products')
      .select('id, name')
      .ilike('name', '%جلد طبيعي%');

    if (!products || products.length === 0) {
      console.log('❌ لم يتم العثور على المنتج');
      return;
    }

    const product = products[0];

    // إضافة متغير جديد
    const newVariant = {
      product_id: product.id,
      sku: `TEST-VARIANT-${Date.now()}`,
      color: 'رمادي',
      size: '42',
      price: 450,
      stock_quantity: 5,
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&auto=format&q=80&cs=tinysrgb&bg=gray',
      is_available: true
    };

    const { data: addedVariant, error } = await supabase
      .from('product_variants')
      .insert(newVariant)
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في إضافة المتغير:', error.message);
      return;
    }

    console.log('✅ تم إضافة المتغير الجديد:');
    console.log(`   SKU: ${addedVariant.sku}`);
    console.log(`   اللون: ${addedVariant.color}`);
    console.log(`   المقاس: ${addedVariant.size}`);
    console.log(`   الصورة: ${addedVariant.image_url ? '✅ موجودة' : '❌ مفقودة'}`);

    return addedVariant;

  } catch (error) {
    console.error('❌ خطأ في إضافة المتغير:', error.message);
  }
}

// اختبار تحديث صور المتغيرات
async function testUpdateVariantImages() {
  console.log('\n🎨 اختبار تحديث صور المتغيرات...');

  try {
    // تحديث صور المتغيرات بناءً على اللون
    const colorImageMap = {
      'أسود': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&auto=format&q=80&cs=tinysrgb&bg=black',
      'بني': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&auto=format&q=80&cs=tinysrgb&bg=brown',
      'أزرق داكن': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center&auto=format&q=80&cs=tinysrgb&bg=navy'
    };

    let updatedCount = 0;

    for (const [color, imageUrl] of Object.entries(colorImageMap)) {
      const { data, error } = await supabase
        .from('product_variants')
        .update({ image_url: imageUrl })
        .eq('color', color)
        .select('sku');

      if (!error && data) {
        updatedCount += data.length;
        console.log(`   ✅ تم تحديث ${data.length} متغير للون ${color}`);
      }
    }

    console.log(`\n✅ تم تحديث ${updatedCount} متغير بصور محدثة`);
    return updatedCount;

  } catch (error) {
    console.error('❌ خطأ في تحديث الصور:', error.message);
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبارات نظام صور المتغيرات');
  console.log('='.repeat(60));

  // اختبار 1: جلب المتغيرات الحالية
  const variants = await testVariantImages();

  // اختبار 2: تحديث الصور
  const updatedCount = await testUpdateVariantImages();

  // اختبار 3: إضافة متغير جديد
  const newVariant = await testAddVariantWithImage();

  // اختبار 4: جلب المتغيرات مرة أخرى للتأكد
  console.log('\n🔄 إعادة اختبار بعد التحديثات...');
  await testVariantImages();

  console.log('\n' + '='.repeat(60));
  console.log('📋 تقرير الاختبارات:');
  console.log(`📦 المتغيرات الأصلية: ${variants ? variants.length : 0}`);
  console.log(`🎨 الصور المحدثة: ${updatedCount || 0}`);
  console.log(`🆕 متغير جديد: ${newVariant ? '✅ تم إضافته' : '❌ فشل'}`);

  console.log('\n🎯 النتيجة النهائية:');
  if (variants && variants.length > 0 && updatedCount > 0) {
    console.log('✅ نظام صور المتغيرات يعمل بشكل مثالي!');
    console.log('🔗 يمكنك الآن رؤية الصور في الواجهة');
  } else {
    console.log('⚠️ هناك مشاكل في النظام تحتاج لمراجعة');
  }
}

// تشغيل الاختبارات
runAllTests().catch(console.error);
