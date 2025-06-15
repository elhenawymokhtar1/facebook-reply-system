// أداة إضافة منتج متعدد الخواص بسهولة
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة إضافة منتج متعدد الخواص
async function addMultiVariantProduct() {
  console.log('🎨 إضافة منتج متعدد الخواص جديد...\n');

  try {
    // الحصول على معرف المتجر
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (!stores || stores.length === 0) {
      console.log('❌ لا يوجد متجر');
      return false;
    }

    const storeId = stores[0].id;

    // بيانات المنتج الجديد
    const productData = {
      store_id: storeId,
      name: 'فستان صيفي أنيق',
      description: 'فستان صيفي جميل ومريح، مصنوع من القطن الخالص، متوفر بألوان ومقاسات متعددة. مناسب للمناسبات والاستخدام اليومي.',
      short_description: 'فستان صيفي أنيق متعدد الألوان والمقاسات',
      price: 180, // السعر الأساسي
      sku: 'DRESS-SUMMER-001',
      category: 'فساتين',
      brand: 'سوان',
      stock_quantity: 0, // سيتم حساب المخزون من المتغيرات
      weight: 0.3,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400'
    };

    console.log('📦 إضافة المنتج الأساسي...');
    const { data: product, error: productError } = await supabase
      .from('ecommerce_products')
      .insert(productData)
      .select()
      .single();

    if (productError) {
      console.error('❌ خطأ في إضافة المنتج:', productError.message);
      return false;
    }

    console.log('✅ تم إضافة المنتج:', product.name);

    // تعريف الخواص المتاحة
    const availableColors = [
      { name: 'أحمر', code: 'red', price_diff: 0 },
      { name: 'أزرق', code: 'blue', price_diff: 0 },
      { name: 'أخضر', code: 'green', price_diff: 5 }, // أغلى بـ 5 جنيه
      { name: 'أسود', code: 'black', price_diff: 10 }, // أغلى بـ 10 جنيه
      { name: 'وردي', code: 'pink', price_diff: 0 }
    ];

    const availableSizes = [
      { name: 'S', stock: 12 },
      { name: 'M', stock: 20 },
      { name: 'L', stock: 15 },
      { name: 'XL', stock: 8 }
    ];

    console.log('\n🎨 إضافة المتغيرات...');
    const variants = [];
    let variantIndex = 1;

    // إنشاء متغير لكل تركيبة لون + مقاس
    for (const color of availableColors) {
      for (const size of availableSizes) {
        const variant = {
          product_id: product.id,
          sku: `${product.sku}-${color.code.toUpperCase()}-${size.name}`,
          name: `${product.name} - ${color.name} - ${size.name}`,
          price: product.price + color.price_diff,
          stock_quantity: size.stock,
          weight: product.weight,
          image_url: `https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&color=${color.code}`,
          is_active: true,
          description: JSON.stringify({
            color: color.name,
            size: size.name,
            color_code: color.code,
            material: 'قطن',
            style: 'صيفي'
          })
        };

        variants.push(variant);
        console.log(`   ${variantIndex}. ${variant.name} - ${variant.price} ج - مخزون: ${variant.stock_quantity}`);
        variantIndex++;
      }
    }

    // محاولة إضافة المتغيرات لجدول product_variants
    try {
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .insert(variants);

      if (variantsError) {
        console.log('⚠️ جدول المتغيرات غير موجود، سيتم حفظ المعلومات في المنتج الأساسي');
        
        // تحديث وصف المنتج ليشمل معلومات المتغيرات
        const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
        const colorsText = availableColors.map(c => c.name).join(', ');
        const sizesText = availableSizes.map(s => s.name).join(', ');

        await supabase
          .from('ecommerce_products')
          .update({
            stock_quantity: totalStock,
            description: product.description + 
              `\n\n🎨 متوفر بالألوان: ${colorsText}` +
              `\n📏 متوفر بالمقاسات: ${sizesText}` +
              `\n📦 إجمالي المتغيرات: ${variants.length}`
          })
          .eq('id', product.id);

        console.log('✅ تم حفظ معلومات المتغيرات في المنتج الأساسي');
      } else {
        console.log(`✅ تم إضافة ${variants.length} متغير للمنتج`);
      }
    } catch (error) {
      console.log('⚠️ خطأ في إضافة المتغيرات:', error.message);
    }

    // عرض ملخص المنتج
    console.log('\n📊 ملخص المنتج الجديد:');
    console.log('='.repeat(50));
    console.log(`📦 اسم المنتج: ${product.name}`);
    console.log(`💰 السعر الأساسي: ${product.price} ج`);
    console.log(`🎨 الألوان: ${availableColors.length} ألوان`);
    console.log(`📏 المقاسات: ${availableSizes.length} مقاسات`);
    console.log(`📦 إجمالي المتغيرات: ${variants.length}`);
    console.log(`📊 إجمالي المخزون: ${variants.reduce((sum, v) => sum + v.stock_quantity, 0)}`);

    return true;

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return false;
  }
}

// دالة إضافة منتج أحذية متعدد الخواص
async function addShoesProduct() {
  console.log('\n👟 إضافة منتج أحذية متعدد الخواص...');

  try {
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    const storeId = stores[0].id;

    // بيانات منتج الأحذية
    const shoeProduct = {
      store_id: storeId,
      name: 'حذاء كاجوال جلد طبيعي',
      description: 'حذاء كاجوال أنيق مصنوع من الجلد الطبيعي، مريح ومتين، مناسب للاستخدام اليومي والمناسبات غير الرسمية.',
      short_description: 'حذاء كاجوال جلد طبيعي متعدد الألوان',
      price: 420,
      sku: 'SHOE-CASUAL-001',
      category: 'أحذية كاجوال',
      brand: 'سوان',
      stock_quantity: 0,
      weight: 0.9,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
    };

    const { data: product, error: productError } = await supabase
      .from('ecommerce_products')
      .insert(shoeProduct)
      .select()
      .single();

    if (productError) {
      console.error('❌ خطأ في إضافة منتج الأحذية:', productError.message);
      return false;
    }

    console.log('✅ تم إضافة منتج الأحذية:', product.name);

    // خواص الأحذية
    const shoeColors = [
      { name: 'أسود', code: 'black', price_diff: 0 },
      { name: 'بني', code: 'brown', price_diff: 0 },
      { name: 'أزرق داكن', code: 'navy', price_diff: 15 }
    ];

    const shoeSizes = [
      { name: '40', stock: 8 },
      { name: '41', stock: 12 },
      { name: '42', stock: 15 },
      { name: '43', stock: 10 },
      { name: '44', stock: 6 }
    ];

    const shoeVariants = [];
    for (const color of shoeColors) {
      for (const size of shoeSizes) {
        shoeVariants.push({
          product_id: product.id,
          sku: `${product.sku}-${color.code.toUpperCase()}-${size.name}`,
          name: `${product.name} - ${color.name} - مقاس ${size.name}`,
          price: product.price + color.price_diff,
          stock_quantity: size.stock,
          weight: product.weight,
          image_url: `https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&color=${color.code}`,
          is_active: true,
          description: JSON.stringify({
            color: color.name,
            size: size.name,
            color_code: color.code,
            material: 'جلد طبيعي',
            style: 'كاجوال'
          })
        });
      }
    }

    // تحديث المنتج بمعلومات المتغيرات
    const totalStock = shoeVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
    await supabase
      .from('ecommerce_products')
      .update({
        stock_quantity: totalStock,
        description: product.description + 
          `\n\n🎨 متوفر بالألوان: ${shoeColors.map(c => c.name).join(', ')}` +
          `\n📏 متوفر بالمقاسات: ${shoeSizes.map(s => s.name).join(', ')}`
      })
      .eq('id', product.id);

    console.log(`✅ تم إعداد منتج الأحذية بـ ${shoeVariants.length} متغير`);
    return true;

  } catch (error) {
    console.error('❌ خطأ في منتج الأحذية:', error.message);
    return false;
  }
}

// دالة عرض دليل الاستخدام
function showUsageGuide() {
  console.log('\n📚 دليل إضافة المنتجات متعددة الخواص:');
  console.log('='.repeat(60));
  
  console.log('\n🎯 الطريقة الأولى: من الواجهة');
  console.log('1. اذهب إلى: http://localhost:8083/product-variants');
  console.log('2. اختر منتج موجود واضغط "إدارة المتغيرات"');
  console.log('3. اضغط "إضافة متغير" واملأ البيانات');
  
  console.log('\n🎯 الطريقة الثانية: إضافة منتج جديد');
  console.log('1. اذهب إلى: http://localhost:8083/ecommerce-products');
  console.log('2. اضغط "إضافة منتج جديد"');
  console.log('3. أضف المنتج الأساسي');
  console.log('4. اذهب لصفحة المتغيرات وأضف الخواص');
  
  console.log('\n🎯 الطريقة الثالثة: استخدام هذا السكريبت');
  console.log('- يضيف منتجات جاهزة بمتغيرات متعددة');
  console.log('- يوفر أمثلة عملية للتطبيق');
  
  console.log('\n📋 البيانات المطلوبة لكل متغير:');
  console.log('• SKU فريد للمتغير');
  console.log('• اسم المتغير (اختياري)');
  console.log('• اللون');
  console.log('• المقاس');
  console.log('• السعر (يمكن أن يختلف)');
  console.log('• المخزون');
  console.log('• الصورة (اختياري)');
}

// تشغيل الإضافة
async function runDemo() {
  console.log('🚀 بدء إضافة منتجات متعددة الخواص\n');
  console.log('='.repeat(60));

  showUsageGuide();

  const dressAdded = await addMultiVariantProduct();
  const shoesAdded = await addShoesProduct();

  console.log('\n' + '='.repeat(60));
  console.log('📋 تقرير الإضافة:');
  console.log(`👗 فستان صيفي: ${dressAdded ? '✅ تم إضافته' : '❌ فشل'}`);
  console.log(`👟 حذاء كاجوال: ${shoesAdded ? '✅ تم إضافته' : '❌ فشل'}`);

  if (dressAdded && shoesAdded) {
    console.log('\n🎉 تم إضافة المنتجات بنجاح!');
    console.log('🔗 شاهد النتائج في: http://localhost:8083/product-variants');
    console.log('🛍️ أو في المتجر: http://localhost:8083/shop');
  }
}

// تشغيل العرض التوضيحي
runDemo().catch(console.error);
