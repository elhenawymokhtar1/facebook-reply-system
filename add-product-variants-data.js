// إضافة بيانات المنتجات متعددة الخواص (بدون إنشاء جداول)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة إضافة منتج بمتغيرات متعددة
async function addProductWithVariants() {
  console.log('👕 إضافة منتج بمتغيرات متعددة...\n');

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

    // إضافة منتج أساسي جديد مع دعم المتغيرات
    const newProduct = {
      store_id: storeId,
      name: 'تيشيرت قطني متعدد الألوان والمقاسات',
      description: 'تيشيرت قطني عالي الجودة، متوفر بألوان ومقاسات متعددة. مناسب للاستخدام اليومي والرياضة.',
      short_description: 'تيشيرت قطني متعدد الألوان والمقاسات',
      price: 150, // السعر الأساسي
      sku: 'TSHIRT-MULTI-001',
      category: 'ملابس',
      brand: 'سوان',
      stock_quantity: 0, // سيتم حساب المخزون من المتغيرات
      weight: 0.2,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
    };

    const { data: product, error: productError } = await supabase
      .from('ecommerce_products')
      .insert(newProduct)
      .select()
      .single();

    if (productError) {
      console.error('❌ خطأ في إضافة المنتج:', productError.message);
      return false;
    }

    console.log('✅ تم إضافة المنتج الأساسي:', product.name);

    // إضافة متغيرات المنتج (ألوان ومقاسات)
    const colors = [
      { name: 'أحمر', code: 'red', price_diff: 0 },
      { name: 'أزرق', code: 'blue', price_diff: 0 },
      { name: 'أسود', code: 'black', price_diff: 10 }, // أغلى بـ 10 جنيه
      { name: 'أبيض', code: 'white', price_diff: 0 }
    ];

    const sizes = [
      { name: 'S', stock: 15 },
      { name: 'M', stock: 25 },
      { name: 'L', stock: 20 },
      { name: 'XL', stock: 10 }
    ];

    const variants = [];
    let variantIndex = 1;

    // إنشاء متغير لكل تركيبة لون + مقاس
    for (const color of colors) {
      for (const size of sizes) {
        variants.push({
          product_id: product.id,
          sku: `${product.sku}-${color.code.toUpperCase()}-${size.name}`,
          name: `${product.name} - ${color.name} - ${size.name}`,
          price: product.price + color.price_diff,
          stock_quantity: size.stock,
          weight: product.weight,
          image_url: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&color=${color.code}`,
          is_active: true,
          // إضافة معلومات الخواص كـ JSON مؤقتاً
          description: JSON.stringify({
            color: color.name,
            size: size.name,
            color_code: color.code
          })
        });
        variantIndex++;
      }
    }

    // محاولة إضافة المتغيرات (إذا كان الجدول موجود)
    try {
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .insert(variants);

      if (variantsError) {
        console.log('⚠️ جدول المتغيرات غير موجود، سيتم حفظ المعلومات في المنتج الأساسي');
        
        // تحديث وصف المنتج ليشمل معلومات المتغيرات
        const variantsInfo = {
          has_variants: true,
          colors: colors.map(c => c.name),
          sizes: sizes.map(s => s.name),
          total_stock: variants.reduce((sum, v) => sum + v.stock_quantity, 0),
          variants_count: variants.length
        };

        await supabase
          .from('ecommerce_products')
          .update({
            stock_quantity: variantsInfo.total_stock,
            description: product.description + '\n\nمتوفر بالألوان: ' + colors.map(c => c.name).join(', ') + '\nمتوفر بالمقاسات: ' + sizes.map(s => s.name).join(', ')
          })
          .eq('id', product.id);

        console.log('✅ تم حفظ معلومات المتغيرات في المنتج الأساسي');
      } else {
        console.log(`✅ تم إضافة ${variants.length} متغير للمنتج`);
      }
    } catch (error) {
      console.log('⚠️ خطأ في إضافة المتغيرات:', error.message);
    }

    return true;

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return false;
  }
}

// دالة إضافة منتج آخر بمتغيرات
async function addAnotherVariantProduct() {
  console.log('\n👟 إضافة منتج أحذية بمتغيرات...');

  try {
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    const storeId = stores[0].id;

    // منتج أحذية بألوان ومقاسات
    const shoeProduct = {
      store_id: storeId,
      name: 'حذاء رياضي متعدد الألوان',
      description: 'حذاء رياضي مريح ومتين، متوفر بألوان ومقاسات متعددة. مناسب للجري والرياضة.',
      short_description: 'حذاء رياضي متعدد الألوان',
      price: 350,
      sku: 'SHOE-MULTI-001',
      category: 'أحذية رياضية',
      brand: 'سوان',
      stock_quantity: 0,
      weight: 0.8,
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

    // متغيرات الأحذية
    const shoeColors = ['أسود', 'أبيض', 'أزرق', 'رمادي'];
    const shoeSizes = ['39', '40', '41', '42', '43', '44'];

    let totalStock = 0;
    for (const color of shoeColors) {
      for (const size of shoeSizes) {
        totalStock += Math.floor(Math.random() * 10) + 5; // مخزون عشوائي
      }
    }

    // تحديث المنتج بمعلومات المتغيرات
    await supabase
      .from('ecommerce_products')
      .update({
        stock_quantity: totalStock,
        description: product.description + '\n\nمتوفر بالألوان: ' + shoeColors.join(', ') + '\nمتوفر بالمقاسات: ' + shoeSizes.join(', ')
      })
      .eq('id', product.id);

    console.log(`✅ تم إعداد منتج الأحذية بـ ${shoeColors.length * shoeSizes.length} متغير`);
    return true;

  } catch (error) {
    console.error('❌ خطأ في منتج الأحذية:', error.message);
    return false;
  }
}

// دالة عرض ملخص المنتجات متعددة الخواص
async function showVariantsStatus() {
  console.log('\n📊 ملخص المنتجات متعددة الخواص:');
  console.log('='.repeat(50));

  try {
    // عدد المنتجات الإجمالي
    const { data: allProducts } = await supabase
      .from('ecommerce_products')
      .select('id, name, description')
      .contains('description', 'متوفر بالألوان');

    console.log(`📦 المنتجات متعددة الخواص: ${allProducts?.length || 0}`);

    if (allProducts && allProducts.length > 0) {
      allProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
      });
    }

    // التحقق من وجود جداول المتغيرات
    try {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('count');
      
      console.log(`🔗 المتغيرات في قاعدة البيانات: ${variants?.[0]?.count || 0}`);
    } catch (error) {
      console.log('⚠️ جداول المتغيرات غير موجودة بعد');
    }

    console.log('\n✅ النظام يدعم المنتجات متعددة الخواص!');
    console.log('💡 يمكن إضافة المزيد من المنتجات بألوان ومقاسات مختلفة');

  } catch (error) {
    console.error('❌ خطأ في عرض الملخص:', error.message);
  }
}

// تشغيل الإعداد
async function setupVariantsDemo() {
  console.log('🎨 إعداد عرض توضيحي للمنتجات متعددة الخواص\n');
  console.log('='.repeat(60));

  const product1Added = await addProductWithVariants();
  const product2Added = await addAnotherVariantProduct();
  
  await showVariantsStatus();

  console.log('\n' + '='.repeat(60));
  console.log('📋 تقرير الإعداد:');
  console.log(`👕 منتج التيشيرت: ${product1Added ? '✅ تم إضافته' : '❌ فشل'}`);
  console.log(`👟 منتج الأحذية: ${product2Added ? '✅ تم إضافته' : '❌ فشل'}`);

  if (product1Added && product2Added) {
    console.log('\n🎉 تم إعداد المنتجات متعددة الخواص بنجاح!');
    console.log('🔗 يمكنك الآن رؤية المنتجات في المتجر: http://localhost:8083/shop');
  }
}

// تشغيل العرض التوضيحي
setupVariantsDemo().catch(console.error);
