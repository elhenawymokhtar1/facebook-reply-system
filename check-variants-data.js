// فحص بيانات المنتجات متعددة المتغيرات
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// فحص الجداول الموجودة
async function checkTables() {
  console.log('🔍 فحص الجداول الموجودة في قاعدة البيانات...\n');

  try {
    // فحص جدول المنتجات الأساسي
    const { data: products, error: productsError } = await supabase
      .from('ecommerce_products')
      .select('id, name, description, stock_quantity, created_at')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.log('❌ خطأ في جلب المنتجات:', productsError.message);
    } else {
      console.log(`📦 جدول المنتجات الأساسي: ${products?.length || 0} منتج`);
      
      if (products && products.length > 0) {
        console.log('\n📋 المنتجات الموجودة:');
        products.forEach((product, index) => {
          const hasVariants = product.description?.includes('متوفر بالألوان') || 
                             product.description?.includes('متوفر بالمقاسات');
          console.log(`   ${index + 1}. ${product.name} ${hasVariants ? '🎨' : '📦'}`);
          console.log(`      المخزون: ${product.stock_quantity || 0}`);
          if (hasVariants) {
            console.log(`      ✅ يحتوي على متغيرات`);
          }
        });
      }
    }

    // فحص جدول المتغيرات
    console.log('\n🔍 فحص جدول المتغيرات...');
    try {
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .order('created_at', { ascending: false });

      if (variantsError) {
        console.log('⚠️ جدول المتغيرات غير موجود أو فارغ');
        console.log('   السبب:', variantsError.message);
      } else {
        console.log(`✅ جدول المتغيرات: ${variants?.length || 0} متغير`);
        
        if (variants && variants.length > 0) {
          console.log('\n📋 المتغيرات الموجودة:');
          variants.slice(0, 10).forEach((variant, index) => {
            console.log(`   ${index + 1}. ${variant.name || variant.sku}`);
            console.log(`      SKU: ${variant.sku}`);
            console.log(`      السعر: ${variant.price} ج`);
            console.log(`      المخزون: ${variant.stock_quantity}`);
          });
          
          if (variants.length > 10) {
            console.log(`   ... و ${variants.length - 10} متغير آخر`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ جدول المتغيرات غير موجود');
    }

    // فحص جدول الخواص
    console.log('\n🔍 فحص جدول الخواص...');
    try {
      const { data: attributes, error: attributesError } = await supabase
        .from('product_attributes')
        .select('*')
        .order('display_order');

      if (attributesError) {
        console.log('⚠️ جدول الخواص غير موجود أو فارغ');
      } else {
        console.log(`✅ جدول الخواص: ${attributes?.length || 0} خاصية`);
        
        if (attributes && attributes.length > 0) {
          console.log('\n📋 الخواص المتاحة:');
          attributes.forEach((attr, index) => {
            console.log(`   ${index + 1}. ${attr.name} (${attr.type})`);
            console.log(`      القيم: ${attr.values?.slice(0, 5).join(', ')}${attr.values?.length > 5 ? '...' : ''}`);
          });
        }
      }
    } catch (error) {
      console.log('⚠️ جدول الخواص غير موجود');
    }

    // فحص جدول ربط المتغيرات بالخواص
    console.log('\n🔍 فحص جدول ربط المتغيرات بالخواص...');
    try {
      const { data: variantAttrs, error: variantAttrsError } = await supabase
        .from('variant_attribute_values')
        .select('*')
        .limit(10);

      if (variantAttrsError) {
        console.log('⚠️ جدول ربط المتغيرات بالخواص غير موجود أو فارغ');
      } else {
        console.log(`✅ جدول ربط المتغيرات: ${variantAttrs?.length || 0} ربط`);
      }
    } catch (error) {
      console.log('⚠️ جدول ربط المتغيرات بالخواص غير موجود');
    }

  } catch (error) {
    console.error('❌ خطأ عام في فحص الجداول:', error.message);
  }
}

// فحص المنتجات متعددة المتغيرات
async function checkVariantProducts() {
  console.log('\n🎨 فحص المنتجات متعددة المتغيرات...\n');

  try {
    const { data: products } = await supabase
      .from('ecommerce_products')
      .select('*')
      .or('description.ilike.%متوفر بالألوان%,description.ilike.%متوفر بالمقاسات%');

    if (!products || products.length === 0) {
      console.log('❌ لا توجد منتجات متعددة المتغيرات');
      return;
    }

    console.log(`✅ تم العثور على ${products.length} منتج متعدد المتغيرات:`);
    console.log('='.repeat(60));

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. 📦 ${product.name}`);
      console.log(`   💰 السعر: ${product.price} ج`);
      console.log(`   📊 المخزون: ${product.stock_quantity}`);
      console.log(`   🏷️ الفئة: ${product.category}`);
      console.log(`   🏢 العلامة: ${product.brand}`);
      console.log(`   📅 تاريخ الإضافة: ${new Date(product.created_at).toLocaleDateString('ar-EG')}`);
      
      // استخراج معلومات المتغيرات من الوصف
      if (product.description) {
        const colorsMatch = product.description.match(/متوفر بالألوان: ([^\\n]+)/);
        const sizesMatch = product.description.match(/متوفر بالمقاسات: ([^\\n]+)/);
        const variantsMatch = product.description.match(/إجمالي المتغيرات: (\\d+)/);
        
        if (colorsMatch) {
          console.log(`   🎨 الألوان: ${colorsMatch[1]}`);
        }
        if (sizesMatch) {
          console.log(`   📏 المقاسات: ${sizesMatch[1]}`);
        }
        if (variantsMatch) {
          console.log(`   🔢 عدد المتغيرات: ${variantsMatch[1]}`);
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في فحص المنتجات متعددة المتغيرات:', error.message);
  }
}

// إحصائيات شاملة
async function getStatistics() {
  console.log('\n📊 إحصائيات شاملة...\n');

  try {
    // عدد المنتجات الإجمالي
    const { data: allProducts } = await supabase
      .from('ecommerce_products')
      .select('id, description, stock_quantity');

    const totalProducts = allProducts?.length || 0;
    const variantProducts = allProducts?.filter(p => 
      p.description?.includes('متوفر بالألوان') || 
      p.description?.includes('متوفر بالمقاسات')
    ).length || 0;
    const totalStock = allProducts?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;

    // عدد المتغيرات (إذا كان الجدول موجود)
    let totalVariants = 0;
    try {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id');
      totalVariants = variants?.length || 0;
    } catch (error) {
      // جدول المتغيرات غير موجود
    }

    // عدد الخواص (إذا كان الجدول موجود)
    let totalAttributes = 0;
    try {
      const { data: attributes } = await supabase
        .from('product_attributes')
        .select('id');
      totalAttributes = attributes?.length || 0;
    } catch (error) {
      // جدول الخواص غير موجود
    }

    console.log('📈 الإحصائيات:');
    console.log('='.repeat(40));
    console.log(`📦 إجمالي المنتجات: ${totalProducts}`);
    console.log(`🎨 منتجات متعددة المتغيرات: ${variantProducts}`);
    console.log(`📊 إجمالي المخزون: ${totalStock} قطعة`);
    console.log(`🔢 إجمالي المتغيرات: ${totalVariants}`);
    console.log(`🏷️ إجمالي الخواص: ${totalAttributes}`);

    // حالة النظام
    console.log('\n🎯 حالة النظام:');
    console.log('='.repeat(40));
    
    if (variantProducts > 0) {
      console.log('✅ النظام يدعم المنتجات متعددة المتغيرات');
      console.log('✅ توجد منتجات بمتغيرات متعددة');
      
      if (totalVariants > 0) {
        console.log('✅ جدول المتغيرات موجود ويحتوي على بيانات');
      } else {
        console.log('⚠️ جدول المتغيرات غير موجود أو فارغ');
        console.log('💡 المتغيرات محفوظة في وصف المنتج الأساسي');
      }
      
      if (totalAttributes > 0) {
        console.log('✅ جدول الخواص موجود ويحتوي على بيانات');
      } else {
        console.log('⚠️ جدول الخواص غير موجود أو فارغ');
      }
    } else {
      console.log('❌ لا توجد منتجات متعددة المتغيرات');
    }

  } catch (error) {
    console.error('❌ خطأ في حساب الإحصائيات:', error.message);
  }
}

// تشغيل الفحص الشامل
async function runCompleteCheck() {
  console.log('🔍 فحص شامل لبيانات المنتجات متعددة المتغيرات');
  console.log('='.repeat(70));

  await checkTables();
  await checkVariantProducts();
  await getStatistics();

  console.log('\n🎯 الخلاصة:');
  console.log('='.repeat(40));
  console.log('✅ تم فحص جميع الجداول والبيانات');
  console.log('🔗 للوصول للواجهة: http://localhost:8083/product-variants');
  console.log('🛍️ للوصول للمتجر: http://localhost:8083/shop');
}

// تشغيل الفحص
runCompleteCheck().catch(console.error);
