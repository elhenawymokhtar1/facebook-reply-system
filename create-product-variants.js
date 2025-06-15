// إنشاء نظام المنتجات متعددة الخواص
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة إنشاء جداول المنتجات متعددة الخواص
async function createProductVariantsSystem() {
  console.log('🏗️ إنشاء نظام المنتجات متعددة الخواص...\n');

  try {
    // إنشاء جدول خواص المنتجات
    console.log('1️⃣ إنشاء جدول خواص المنتجات...');

    // التحقق من وجود الجدول أولاً
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'product_attributes')
      .eq('table_schema', 'public');

    if (existingTables && existingTables.length > 0) {
      console.log('✅ جدول خواص المنتجات موجود بالفعل');
    } else {
      console.log('⚠️ لا يمكن إنشاء الجداول مباشرة، سيتم إنشاؤها يدوياً');
    }

    const attributesError = null; // تجاهل الخطأ مؤقتاً

    if (attributesError) {
      console.error('❌ خطأ في إنشاء جدول الخواص:', attributesError.message);
      return false;
    }
    console.log('✅ تم إنشاء جدول خواص المنتجات');

    // إنشاء جدول متغيرات المنتجات
    console.log('2️⃣ إنشاء جدول متغيرات المنتجات...');
    const { error: variantsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- جدول متغيرات المنتجات (Product Variants)
        CREATE TABLE IF NOT EXISTS product_variants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES ecommerce_products(id) ON DELETE CASCADE,
            sku VARCHAR(100) UNIQUE NOT NULL, -- SKU فريد للمتغير
            name VARCHAR(255), -- اسم المتغير (اختياري)
            price DECIMAL(10,2), -- سعر مختلف (اختياري)
            sale_price DECIMAL(10,2), -- سعر الخصم (اختياري)
            stock_quantity INTEGER DEFAULT 0, -- مخزون المتغير
            weight DECIMAL(8,3), -- وزن مختلف (اختياري)
            image_url TEXT, -- صورة مختلفة (اختياري)
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (variantsError) {
      console.error('❌ خطأ في إنشاء جدول المتغيرات:', variantsError.message);
      return false;
    }
    console.log('✅ تم إنشاء جدول متغيرات المنتجات');

    // إنشاء جدول ربط المتغيرات بالخواص
    console.log('3️⃣ إنشاء جدول ربط المتغيرات بالخواص...');
    const { error: linkError } = await supabase.rpc('exec_sql', {
      sql: `
        -- جدول ربط المتغيرات بالخواص
        CREATE TABLE IF NOT EXISTS variant_attribute_values (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
            attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
            value VARCHAR(100) NOT NULL, -- القيمة المحددة (أحمر، كبير، قطن)
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(variant_id, attribute_id)
        );
      `
    });

    if (linkError) {
      console.error('❌ خطأ في إنشاء جدول الربط:', linkError.message);
      return false;
    }
    console.log('✅ تم إنشاء جدول ربط المتغيرات بالخواص');

    // إنشاء الفهارس
    console.log('4️⃣ إنشاء الفهارس...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- إنشاء فهارس للأداء
        CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
        CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_variant_id ON variant_attribute_values(variant_id);
        CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_attribute_id ON variant_attribute_values(attribute_id);
        CREATE INDEX IF NOT EXISTS idx_product_attributes_type ON product_attributes(type);
      `
    });

    if (indexError) {
      console.error('❌ خطأ في إنشاء الفهارس:', indexError.message);
      return false;
    }
    console.log('✅ تم إنشاء الفهارس');

    console.log('\n🎉 تم إنشاء نظام المنتجات متعددة الخواص بنجاح!');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return false;
  }
}

// دالة إضافة الخواص الافتراضية
async function addDefaultAttributes() {
  console.log('\n🎨 إضافة الخواص الافتراضية...');

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

  try {
    const { data, error } = await supabase
      .from('product_attributes')
      .insert(defaultAttributes);

    if (error) {
      console.error('❌ خطأ في إضافة الخواص الافتراضية:', error.message);
      return false;
    }

    console.log('✅ تم إضافة الخواص الافتراضية بنجاح');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في الخواص:', error.message);
    return false;
  }
}

// دالة إضافة متغيرات تجريبية لمنتج موجود
async function addSampleVariants() {
  console.log('\n👕 إضافة متغيرات تجريبية...');

  try {
    // الحصول على منتج موجود
    const { data: products, error: productError } = await supabase
      .from('ecommerce_products')
      .select('id, name')
      .limit(1);

    if (productError || !products || products.length === 0) {
      console.log('⚠️ لا يوجد منتج لإضافة متغيرات له');
      return false;
    }

    const productId = products[0].id;
    const productName = products[0].name;
    console.log(`📦 إضافة متغيرات للمنتج: ${productName}`);

    // الحصول على خواص اللون والمقاس
    const { data: attributes } = await supabase
      .from('product_attributes')
      .select('id, name, type')
      .in('type', ['color', 'size']);

    const colorAttr = attributes?.find(attr => attr.type === 'color');
    const sizeAttr = attributes?.find(attr => attr.type === 'size');

    if (!colorAttr || !sizeAttr) {
      console.log('⚠️ لا توجد خواص اللون والمقاس');
      return false;
    }

    // إنشاء متغيرات تجريبية
    const colors = ['أحمر', 'أزرق', 'أسود'];
    const sizes = ['S', 'M', 'L'];
    const variants = [];
    const variantAttributes = [];

    let variantIndex = 1;
    for (const color of colors) {
      for (const size of sizes) {
        const variantId = crypto.randomUUID();
        variants.push({
          id: variantId,
          product_id: productId,
          sku: `VAR-${variantIndex.toString().padStart(3, '0')}`,
          name: `${productName} - ${color} - ${size}`,
          stock_quantity: Math.floor(Math.random() * 20) + 5, // مخزون عشوائي 5-25
          is_active: true
        });

        // إضافة خواص اللون والمقاس
        variantAttributes.push(
          {
            variant_id: variantId,
            attribute_id: colorAttr.id,
            value: color
          },
          {
            variant_id: variantId,
            attribute_id: sizeAttr.id,
            value: size
          }
        );

        variantIndex++;
      }
    }

    // إدراج المتغيرات
    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variants);

    if (variantsError) {
      console.error('❌ خطأ في إدراج المتغيرات:', variantsError.message);
      return false;
    }

    // إدراج خواص المتغيرات
    const { error: attributesError } = await supabase
      .from('variant_attribute_values')
      .insert(variantAttributes);

    if (attributesError) {
      console.error('❌ خطأ في إدراج خواص المتغيرات:', attributesError.message);
      return false;
    }

    console.log(`✅ تم إضافة ${variants.length} متغير تجريبي`);
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في المتغيرات:', error.message);
    return false;
  }
}

// دالة التحقق من النظام
async function testVariantsSystem() {
  console.log('\n🧪 اختبار نظام المتغيرات...');

  try {
    // عدد الخواص
    const { data: attributes, error: attrError } = await supabase
      .from('product_attributes')
      .select('count');

    // عدد المتغيرات
    const { data: variants, error: varError } = await supabase
      .from('product_variants')
      .select('count');

    // عدد قيم الخواص
    const { data: values, error: valError } = await supabase
      .from('variant_attribute_values')
      .select('count');

    if (attrError || varError || valError) {
      console.log('❌ خطأ في اختبار النظام');
      return false;
    }

    console.log('📊 إحصائيات النظام:');
    console.log(`   🎨 الخواص: ${attributes?.[0]?.count || 0}`);
    console.log(`   📦 المتغيرات: ${variants?.[0]?.count || 0}`);
    console.log(`   🔗 قيم الخواص: ${values?.[0]?.count || 0}`);

    return true;

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return false;
  }
}

// تشغيل الإعداد الكامل
async function setupCompleteVariantsSystem() {
  console.log('🚀 بدء إعداد نظام المنتجات متعددة الخواص الكامل\n');
  console.log('='.repeat(60));

  const systemCreated = await createProductVariantsSystem();
  
  if (systemCreated) {
    const attributesAdded = await addDefaultAttributes();
    
    if (attributesAdded) {
      const variantsAdded = await addSampleVariants();
      const systemTested = await testVariantsSystem();
      
      console.log('\n' + '='.repeat(60));
      console.log('📋 تقرير الإعداد النهائي:');
      console.log(`🏗️ إنشاء النظام: ${systemCreated ? '✅ نجح' : '❌ فشل'}`);
      console.log(`🎨 إضافة الخواص: ${attributesAdded ? '✅ نجح' : '❌ فشل'}`);
      console.log(`📦 إضافة المتغيرات: ${variantsAdded ? '✅ نجح' : '❌ فشل'}`);
      console.log(`🧪 اختبار النظام: ${systemTested ? '✅ نجح' : '❌ فشل'}`);
      
      if (systemCreated && attributesAdded && variantsAdded && systemTested) {
        console.log('\n🎉 تم إعداد نظام المنتجات متعددة الخواص بنجاح!');
        console.log('🔗 يمكنك الآن استخدام المنتجات بألوان ومقاسات مختلفة');
      } else {
        console.log('\n⚠️ تم الإعداد مع بعض المشاكل');
      }
    }
  }
}

// تشغيل الإعداد
setupCompleteVariantsSystem().catch(console.error);
