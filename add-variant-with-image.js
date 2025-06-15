// مثال على إضافة متغير مع صورة مخصصة
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة إضافة متغير مع صورة
async function addVariantWithImage() {
  console.log('📸 إضافة متغير مع صورة مخصصة...\n');

  try {
    // جلب منتج موجود
    const { data: products } = await supabase
      .from('ecommerce_products')
      .select('id, name')
      .limit(1);

    if (!products || products.length === 0) {
      console.log('❌ لا يوجد منتج');
      return false;
    }

    const product = products[0];
    console.log(`📦 إضافة متغير للمنتج: ${product.name}`);

    // إضافة متغير جديد مع صورة
    const newVariant = {
      product_id: product.id,
      sku: `CUSTOM-RED-L-${Date.now()}`,
      color: 'أحمر',
      size: 'L',
      price: 299.99,
      stock_quantity: 15,
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center',
      is_available: true
    };

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert(newVariant)
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في إضافة المتغير:', error.message);
      return false;
    }

    console.log('✅ تم إضافة المتغير بنجاح:');
    console.log(`   SKU: ${variant.sku}`);
    console.log(`   اللون: ${variant.color}`);
    console.log(`   المقاس: ${variant.size}`);
    console.log(`   السعر: ${variant.price} ج`);
    console.log(`   المخزون: ${variant.stock_quantity}`);
    console.log(`   الصورة: ${variant.image_url}`);

    return true;

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return false;
  }
}

// دالة تحديث صور المتغيرات الموجودة
async function updateVariantImages() {
  console.log('\n🎨 تحديث صور المتغيرات الموجودة...');

  try {
    // صور مختلفة للألوان المختلفة
    const colorImages = {
      'أحمر': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center&sat=100&hue=0',
      'أزرق': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center&sat=100&hue=240',
      'أخضر': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center&sat=100&hue=120',
      'أسود': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center&sat=0&brightness=30',
      'أبيض': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center&sat=0&brightness=100',
      'وردي': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center&sat=100&hue=300'
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
        console.log(`   ✅ تم تحديث ${data.length} متغير للون ${color}`);
      }
    }

    console.log(`\n✅ تم تحديث ${updatedCount} متغير بصور جديدة`);
    return true;

  } catch (error) {
    console.error('❌ خطأ في تحديث الصور:', error.message);
    return false;
  }
}

// دالة عرض المتغيرات مع صورها
async function showVariantsWithImages() {
  console.log('\n📋 المتغيرات مع صورها:');
  console.log('='.repeat(60));

  try {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('sku, color, size, price, image_url')
      .not('image_url', 'is', null)
      .limit(10);

    if (!variants || variants.length === 0) {
      console.log('⚠️ لا توجد متغيرات بصور');
      return;
    }

    variants.forEach((variant, index) => {
      console.log(`\n${index + 1}. ${variant.sku}`);
      console.log(`   🎨 اللون: ${variant.color}`);
      console.log(`   📏 المقاس: ${variant.size}`);
      console.log(`   💰 السعر: ${variant.price} ج`);
      console.log(`   📸 الصورة: ${variant.image_url}`);
    });

  } catch (error) {
    console.error('❌ خطأ في عرض المتغيرات:', error.message);
  }
}

// تشغيل العرض التوضيحي
async function runImageDemo() {
  console.log('📸 عرض توضيحي لصور المتغيرات');
  console.log('='.repeat(50));

  const variantAdded = await addVariantWithImage();
  const imagesUpdated = await updateVariantImages();
  
  await showVariantsWithImages();

  console.log('\n' + '='.repeat(50));
  console.log('📋 تقرير العرض التوضيحي:');
  console.log(`📸 إضافة متغير بصورة: ${variantAdded ? '✅ نجح' : '❌ فشل'}`);
  console.log(`🎨 تحديث صور المتغيرات: ${imagesUpdated ? '✅ نجح' : '❌ فشل'}`);

  if (variantAdded && imagesUpdated) {
    console.log('\n🎉 تم تحديث نظام الصور بنجاح!');
    console.log('🔗 شاهد النتائج في: http://localhost:8083/product-variants');
  }
}

// تشغيل العرض التوضيحي
runImageDemo().catch(console.error);
