// إضافة الجداول المفقودة لنظام المنتجات متعددة الخواص
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة إضافة جدول الخواص
async function createAttributesTable() {
  console.log('🎨 إضافة جدول خواص المنتجات...');

  try {
    // محاولة إضافة البيانات مباشرة لجدول product_attributes
    const defaultAttributes = [
      {
        name: 'اللون',
        type: 'color',
        values: ['أحمر', 'أزرق', 'أخضر', 'أسود', 'أبيض', 'وردي', 'بنفسجي', 'برتقالي', 'أصفر', 'بني', 'رمادي', 'ذهبي', 'فضي'],
        is_required: true,
        display_order: 1
      },
      {
        name: 'المقاس',
        type: 'size',
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
        is_required: true,
        display_order: 2
      },
      {
        name: 'المادة',
        type: 'material',
        values: ['قطن', 'بوليستر', 'جلد', 'حرير', 'صوف', 'دنيم', 'كتان', 'مخلوط', 'نايلون', 'فيسكوز'],
        is_required: false,
        display_order: 3
      },
      {
        name: 'النمط',
        type: 'style',
        values: ['كلاسيكي', 'عصري', 'رياضي', 'كاجوال', 'رسمي', 'عتيق', 'بوهيمي', 'مينيمال'],
        is_required: false,
        display_order: 4
      }
    ];

    const { data, error } = await supabase
      .from('product_attributes')
      .insert(defaultAttributes);

    if (error) {
      console.log('⚠️ جدول الخواص غير موجود، سيتم إنشاؤه يدوياً');
      console.log('   خطأ:', error.message);
      return false;
    }

    console.log('✅ تم إضافة الخواص الافتراضية بنجاح');
    return true;

  } catch (error) {
    console.log('⚠️ جدول الخواص غير موجود، سيتم إنشاؤه يدوياً');
    return false;
  }
}

// دالة ربط المتغيرات الموجودة بالخواص
async function linkExistingVariants() {
  console.log('\n🔗 ربط المتغيرات الموجودة بالخواص...');

  try {
    // جلب المتغيرات الموجودة
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*');

    if (variantsError || !variants) {
      console.log('❌ لا توجد متغيرات للربط');
      return false;
    }

    // جلب الخواص
    const { data: attributes, error: attributesError } = await supabase
      .from('product_attributes')
      .select('*');

    if (attributesError || !attributes) {
      console.log('❌ لا توجد خواص للربط');
      return false;
    }

    const colorAttr = attributes.find(attr => attr.type === 'color');
    const sizeAttr = attributes.find(attr => attr.type === 'size');

    if (!colorAttr || !sizeAttr) {
      console.log('❌ لا توجد خواص اللون والمقاس');
      return false;
    }

    console.log(`📦 تم العثور على ${variants.length} متغير للربط`);

    const variantAttributeValues = [];

    // ربط كل متغير بخواصه
    for (const variant of variants) {
      try {
        // استخراج معلومات الخواص من الوصف
        if (variant.description) {
          const attrs = JSON.parse(variant.description);
          
          if (attrs.color) {
            variantAttributeValues.push({
              variant_id: variant.id,
              attribute_id: colorAttr.id,
              value: attrs.color
            });
          }

          if (attrs.size) {
            variantAttributeValues.push({
              variant_id: variant.id,
              attribute_id: sizeAttr.id,
              value: attrs.size
            });
          }
        }
      } catch (error) {
        // تجاهل الأخطاء في تحليل JSON
        console.log(`⚠️ لا يمكن تحليل وصف المتغير: ${variant.sku}`);
      }
    }

    if (variantAttributeValues.length === 0) {
      console.log('⚠️ لا توجد خواص للربط');
      return false;
    }

    // إدراج روابط الخواص
    const { error: linkError } = await supabase
      .from('variant_attribute_values')
      .insert(variantAttributeValues);

    if (linkError) {
      console.log('⚠️ جدول ربط الخواص غير موجود');
      console.log('   خطأ:', linkError.message);
      return false;
    }

    console.log(`✅ تم ربط ${variantAttributeValues.length} خاصية بالمتغيرات`);
    return true;

  } catch (error) {
    console.error('❌ خطأ في ربط المتغيرات:', error.message);
    return false;
  }
}

// دالة إنشاء متغيرات جديدة مع الخواص
async function createVariantsWithAttributes() {
  console.log('\n🎨 إنشاء متغيرات جديدة مع الخواص...');

  try {
    // جلب منتج للاختبار
    const { data: products } = await supabase
      .from('ecommerce_products')
      .select('*')
      .ilike('description', '%متوفر بالألوان%')
      .limit(1);

    if (!products || products.length === 0) {
      console.log('⚠️ لا توجد منتجات متعددة الخواص للاختبار');
      return false;
    }

    const product = products[0];
    console.log(`📦 اختبار مع المنتج: ${product.name}`);

    // جلب الخواص
    const { data: attributes } = await supabase
      .from('product_attributes')
      .select('*');

    if (!attributes) {
      console.log('❌ لا توجد خواص');
      return false;
    }

    const colorAttr = attributes.find(attr => attr.type === 'color');
    const sizeAttr = attributes.find(attr => attr.type === 'size');

    // إنشاء متغير تجريبي جديد
    const testVariant = {
      product_id: product.id,
      sku: `TEST-VARIANT-${Date.now()}`,
      name: `${product.name} - اختبار - أحمر - M`,
      price: product.price,
      stock_quantity: 10,
      is_active: true,
      description: JSON.stringify({
        color: 'أحمر',
        size: 'M',
        test: true
      })
    };

    const { data: newVariant, error: variantError } = await supabase
      .from('product_variants')
      .insert(testVariant)
      .select()
      .single();

    if (variantError) {
      console.log('❌ خطأ في إنشاء المتغير التجريبي:', variantError.message);
      return false;
    }

    console.log('✅ تم إنشاء متغير تجريبي');

    // ربط المتغير بالخواص
    const variantAttributes = [
      {
        variant_id: newVariant.id,
        attribute_id: colorAttr.id,
        value: 'أحمر'
      },
      {
        variant_id: newVariant.id,
        attribute_id: sizeAttr.id,
        value: 'M'
      }
    ];

    const { error: linkError } = await supabase
      .from('variant_attribute_values')
      .insert(variantAttributes);

    if (linkError) {
      console.log('⚠️ لا يمكن ربط المتغير بالخواص:', linkError.message);
      return false;
    }

    console.log('✅ تم ربط المتغير التجريبي بالخواص');
    return true;

  } catch (error) {
    console.error('❌ خطأ في إنشاء المتغيرات:', error.message);
    return false;
  }
}

// دالة اختبار النظام الكامل
async function testCompleteSystem() {
  console.log('\n🧪 اختبار النظام الكامل...');

  try {
    // اختبار جلب المتغيرات مع الخواص
    const { data: variantsWithAttrs, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        variant_attribute_values (
          value,
          product_attributes (
            name,
            type
          )
        )
      `)
      .limit(5);

    if (error) {
      console.log('⚠️ لا يمكن جلب المتغيرات مع الخواص:', error.message);
      return false;
    }

    console.log(`✅ تم جلب ${variantsWithAttrs?.length || 0} متغير مع الخواص`);

    if (variantsWithAttrs && variantsWithAttrs.length > 0) {
      console.log('\n📋 أمثلة على المتغيرات مع الخواص:');
      variantsWithAttrs.slice(0, 3).forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.name || variant.sku}`);
        if (variant.variant_attribute_values && variant.variant_attribute_values.length > 0) {
          variant.variant_attribute_values.forEach(attr => {
            console.log(`      ${attr.product_attributes?.name}: ${attr.value}`);
          });
        }
      });
    }

    return true;

  } catch (error) {
    console.error('❌ خطأ في اختبار النظام:', error.message);
    return false;
  }
}

// دالة عرض الإرشادات لإنشاء الجداول يدوياً
function showManualInstructions() {
  console.log('\n📚 إرشادات إنشاء الجداول يدوياً:');
  console.log('='.repeat(60));
  
  console.log('\n🎯 إذا لم تنجح الطريقة التلقائية، يمكنك إنشاء الجداول يدوياً:');
  
  console.log('\n1️⃣ جدول خواص المنتجات (product_attributes):');
  console.log(`
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('color', 'size', 'material', 'style', 'custom')),
    values TEXT[] NOT NULL,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
  `);

  console.log('\n2️⃣ جدول ربط المتغيرات بالخواص (variant_attribute_values):');
  console.log(`
CREATE TABLE IF NOT EXISTS variant_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, attribute_id)
);
  `);

  console.log('\n3️⃣ إنشاء الفهارس:');
  console.log(`
CREATE INDEX IF NOT EXISTS idx_product_attributes_type ON product_attributes(type);
CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_variant_id ON variant_attribute_values(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_attribute_id ON variant_attribute_values(attribute_id);
  `);

  console.log('\n🔗 يمكنك تشغيل هذه الأوامر في:');
  console.log('   • Supabase Dashboard > SQL Editor');
  console.log('   • أو أي أداة إدارة قواعد بيانات PostgreSQL');
}

// تشغيل الإعداد الكامل
async function runCompleteSetup() {
  console.log('🚀 بدء إضافة الجداول المفقودة لنظام المنتجات متعددة الخواص');
  console.log('='.repeat(80));

  // محاولة إضافة الخواص
  const attributesAdded = await createAttributesTable();
  
  if (attributesAdded) {
    console.log('\n✅ تم إنشاء جدول الخواص بنجاح');
    
    // محاولة ربط المتغيرات الموجودة
    const variantsLinked = await linkExistingVariants();
    
    if (variantsLinked) {
      console.log('✅ تم ربط المتغيرات الموجودة بالخواص');
    }
    
    // اختبار إنشاء متغيرات جديدة
    const newVariantsCreated = await createVariantsWithAttributes();
    
    if (newVariantsCreated) {
      console.log('✅ تم اختبار إنشاء متغيرات جديدة مع الخواص');
    }
    
    // اختبار النظام الكامل
    const systemTested = await testCompleteSystem();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 تقرير الإعداد النهائي:');
    console.log(`🎨 إضافة الخواص: ${attributesAdded ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🔗 ربط المتغيرات: ${variantsLinked ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🆕 متغيرات جديدة: ${newVariantsCreated ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🧪 اختبار النظام: ${systemTested ? '✅ نجح' : '❌ فشل'}`);
    
    if (attributesAdded && variantsLinked && systemTested) {
      console.log('\n🎉 تم إعداد النظام الكامل بنجاح!');
      console.log('🔗 يمكنك الآن استخدام جميع ميزات المنتجات متعددة الخواص');
    }
  } else {
    console.log('\n⚠️ لم يتم إنشاء الجداول تلقائياً');
    showManualInstructions();
  }

  console.log('\n🔗 روابط مفيدة:');
  console.log('   • إدارة المنتجات: http://localhost:8083/product-variants');
  console.log('   • المتجر: http://localhost:8083/shop');
  console.log('   • إدارة المنتجات: http://localhost:8083/ecommerce-products');
}

// تشغيل الإعداد
runCompleteSetup().catch(console.error);
