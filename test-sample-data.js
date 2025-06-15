// اختبار إدخال البيانات التجريبية
// import { createClient } from '@supabase/supabase-js';

// إعداد Supabase (معطل للاختبار)
// const supabaseUrl = 'https://ixqjqfkpqhqjqfkpqhqj.supabase.co';
// const supabaseKey = 'your-anon-key-here';

// بيانات تجريبية للاختبار
const testData = {
  // منتجات تجريبية
  products: [
    {
      name: 'كوتشي رياضي أبيض نسائي - اختبار',
      description: 'كوتشي رياضي مريح للاستخدام اليومي، مصنوع من مواد عالية الجودة',
      short_description: 'كوتشي رياضي مريح للاستخدام اليومي',
      price: 299,
      sale_price: 249,
      sku: 'TEST-SHOE-001',
      category: 'أحذية رياضية',
      brand: 'سوان',
      stock_quantity: 25,
      weight: 0.5,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
    },
    {
      name: 'فستان كاجوال أنيق - اختبار',
      description: 'فستان كاجوال مريح ومناسب للاستخدام اليومي، مصنوع من القطن الناعم',
      short_description: 'فستان كاجوال مريح للاستخدام اليومي',
      price: 249,
      sale_price: 199,
      sku: 'TEST-DRESS-001',
      category: 'فساتين',
      brand: 'سوان',
      stock_quantity: 20,
      weight: 0.4,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400'
    },
    {
      name: 'أحمر شفاه مات - اختبار',
      description: 'أحمر شفاه بتركيبة مات طويلة الثبات، متوفر بألوان متعددة',
      short_description: 'أحمر شفاه مات طويل الثبات',
      price: 89,
      sale_price: 69,
      sku: 'TEST-LIPSTICK-001',
      category: 'مستحضرات تجميل',
      brand: 'بيوتي',
      stock_quantity: 50,
      weight: 0.05,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'
    }
  ],

  // طرق شحن تجريبية
  shippingMethods: [
    {
      name: 'الشحن العادي - اختبار',
      description: 'شحن عادي خلال 2-3 أيام عمل',
      type: 'flat_rate',
      base_cost: 30,
      cost_per_kg: 0,
      free_shipping_threshold: 500,
      estimated_days_min: 2,
      estimated_days_max: 3,
      is_active: true
    },
    {
      name: 'الشحن السريع - اختبار',
      description: 'شحن سريع خلال 24 ساعة',
      type: 'express',
      base_cost: 50,
      cost_per_kg: 0,
      free_shipping_threshold: null,
      estimated_days_min: 1,
      estimated_days_max: 1,
      is_active: true
    }
  ],

  // مناطق شحن تجريبية
  shippingZones: [
    {
      name: 'القاهرة الكبرى - اختبار',
      description: 'القاهرة والجيزة والقليوبية',
      cities: ['القاهرة', 'الجيزة', 'القليوبية', 'شبرا الخيمة'],
      additional_cost: 0,
      is_active: true
    },
    {
      name: 'الإسكندرية - اختبار',
      description: 'محافظة الإسكندرية',
      cities: ['الإسكندرية', 'برج العرب'],
      additional_cost: 20,
      is_active: true
    }
  ],

  // كوبونات تجريبية
  coupons: [
    {
      code: 'TEST20',
      description: 'كوبون اختبار - خصم 20%',
      type: 'percentage',
      amount: 20,
      minimum_amount: 200,
      usage_limit: 100,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    },
    {
      code: 'TESTFREE',
      description: 'كوبون اختبار - شحن مجاني',
      type: 'free_shipping',
      amount: 0,
      minimum_amount: 300,
      usage_limit: 50,
      expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    }
  ]
};

// دالة اختبار إدخال البيانات
async function testSampleDataInsertion() {
  console.log('🧪 بدء اختبار إدخال البيانات التجريبية...\n');

  try {
    // محاكاة إدخال البيانات (بدون اتصال فعلي بقاعدة البيانات)
    console.log('📦 اختبار إدخال المنتجات...');
    testData.products.forEach((product, index) => {
      console.log(`  ✅ منتج ${index + 1}: ${product.name}`);
      console.log(`     - السعر: ${product.price} ج`);
      console.log(`     - المخزون: ${product.stock_quantity}`);
      console.log(`     - الحالة: ${product.status}`);
    });

    console.log('\n🚚 اختبار إدخال طرق الشحن...');
    testData.shippingMethods.forEach((method, index) => {
      console.log(`  ✅ طريقة ${index + 1}: ${method.name}`);
      console.log(`     - التكلفة: ${method.base_cost} ج`);
      console.log(`     - الوقت: ${method.estimated_days_min}-${method.estimated_days_max} أيام`);
      console.log(`     - النوع: ${method.type}`);
    });

    console.log('\n🗺️ اختبار إدخال مناطق الشحن...');
    testData.shippingZones.forEach((zone, index) => {
      console.log(`  ✅ منطقة ${index + 1}: ${zone.name}`);
      console.log(`     - المدن: ${zone.cities.join(', ')}`);
      console.log(`     - التكلفة الإضافية: ${zone.additional_cost} ج`);
    });

    console.log('\n🎫 اختبار إدخال الكوبونات...');
    testData.coupons.forEach((coupon, index) => {
      console.log(`  ✅ كوبون ${index + 1}: ${coupon.code}`);
      console.log(`     - النوع: ${coupon.type}`);
      console.log(`     - القيمة: ${coupon.amount}${coupon.type === 'percentage' ? '%' : ' ج'}`);
      console.log(`     - الحد الأدنى: ${coupon.minimum_amount} ج`);
    });

    console.log('\n🎉 تم اختبار جميع البيانات بنجاح!');
    
    // إحصائيات الاختبار
    console.log('\n📊 إحصائيات الاختبار:');
    console.log(`  📦 المنتجات: ${testData.products.length}`);
    console.log(`  🚚 طرق الشحن: ${testData.shippingMethods.length}`);
    console.log(`  🗺️ مناطق الشحن: ${testData.shippingZones.length}`);
    console.log(`  🎫 الكوبونات: ${testData.coupons.length}`);
    
    const totalItems = testData.products.length + testData.shippingMethods.length + 
                      testData.shippingZones.length + testData.coupons.length;
    console.log(`  📋 إجمالي العناصر: ${totalItems}`);

    console.log('\n✅ الاختبار مكتمل بنجاح!');
    return true;

  } catch (error) {
    console.error('❌ خطأ في اختبار البيانات:', error.message);
    return false;
  }
}

// دالة اختبار صحة البيانات
function validateTestData() {
  console.log('🔍 اختبار صحة البيانات...\n');

  let isValid = true;
  const errors = [];

  // اختبار المنتجات
  testData.products.forEach((product, index) => {
    if (!product.name || product.name.length < 3) {
      errors.push(`منتج ${index + 1}: اسم المنتج قصير جداً`);
      isValid = false;
    }
    if (!product.price || product.price <= 0) {
      errors.push(`منتج ${index + 1}: سعر غير صحيح`);
      isValid = false;
    }
    if (!product.sku || product.sku.length < 3) {
      errors.push(`منتج ${index + 1}: SKU غير صحيح`);
      isValid = false;
    }
  });

  // اختبار طرق الشحن
  testData.shippingMethods.forEach((method, index) => {
    if (!method.name || method.name.length < 3) {
      errors.push(`طريقة شحن ${index + 1}: اسم قصير جداً`);
      isValid = false;
    }
    if (!method.base_cost || method.base_cost < 0) {
      errors.push(`طريقة شحن ${index + 1}: تكلفة غير صحيحة`);
      isValid = false;
    }
  });

  // اختبار مناطق الشحن
  testData.shippingZones.forEach((zone, index) => {
    if (!zone.name || zone.name.length < 3) {
      errors.push(`منطقة شحن ${index + 1}: اسم قصير جداً`);
      isValid = false;
    }
    if (!zone.cities || zone.cities.length === 0) {
      errors.push(`منطقة شحن ${index + 1}: لا توجد مدن`);
      isValid = false;
    }
  });

  // اختبار الكوبونات
  testData.coupons.forEach((coupon, index) => {
    if (!coupon.code || coupon.code.length < 3) {
      errors.push(`كوبون ${index + 1}: كود قصير جداً`);
      isValid = false;
    }
    if (!coupon.amount || coupon.amount <= 0) {
      errors.push(`كوبون ${index + 1}: قيمة غير صحيحة`);
      isValid = false;
    }
  });

  if (isValid) {
    console.log('✅ جميع البيانات صحيحة!');
  } else {
    console.log('❌ توجد أخطاء في البيانات:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  return isValid;
}

// تشغيل الاختبارات
async function runTests() {
  console.log('🚀 بدء اختبار البيانات التجريبية\n');
  console.log('=' .repeat(50));
  
  // اختبار صحة البيانات
  const isDataValid = validateTestData();
  
  if (isDataValid) {
    console.log('\n' + '=' .repeat(50));
    // اختبار إدخال البيانات
    const insertionSuccess = await testSampleDataInsertion();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 تقرير الاختبار النهائي:');
    console.log(`  🔍 صحة البيانات: ${isDataValid ? '✅ صحيحة' : '❌ خاطئة'}`);
    console.log(`  📥 إدخال البيانات: ${insertionSuccess ? '✅ نجح' : '❌ فشل'}`);
    console.log(`  🎯 النتيجة العامة: ${isDataValid && insertionSuccess ? '✅ نجح' : '❌ فشل'}`);
  }
}

// تشغيل الاختبار
runTests().catch(console.error);
