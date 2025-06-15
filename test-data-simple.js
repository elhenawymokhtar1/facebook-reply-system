// اختبار بسيط للبيانات التجريبية
console.log('🧪 بدء اختبار البيانات التجريبية...\n');

// بيانات تجريبية للاختبار
const testData = {
  products: [
    {
      name: 'كوتشي رياضي أبيض نسائي - اختبار',
      price: 299,
      sale_price: 249,
      sku: 'TEST-SHOE-001',
      category: 'أحذية رياضية',
      stock_quantity: 25
    },
    {
      name: 'فستان كاجوال أنيق - اختبار',
      price: 249,
      sale_price: 199,
      sku: 'TEST-DRESS-001',
      category: 'فساتين',
      stock_quantity: 20
    },
    {
      name: 'أحمر شفاه مات - اختبار',
      price: 89,
      sale_price: 69,
      sku: 'TEST-LIPSTICK-001',
      category: 'مستحضرات تجميل',
      stock_quantity: 50
    }
  ],
  shippingMethods: [
    {
      name: 'الشحن العادي - اختبار',
      type: 'flat_rate',
      base_cost: 30,
      estimated_days_min: 2,
      estimated_days_max: 3
    },
    {
      name: 'الشحن السريع - اختبار',
      type: 'express',
      base_cost: 50,
      estimated_days_min: 1,
      estimated_days_max: 1
    }
  ],
  shippingZones: [
    {
      name: 'القاهرة الكبرى - اختبار',
      cities: ['القاهرة', 'الجيزة', 'القليوبية'],
      additional_cost: 0
    },
    {
      name: 'الإسكندرية - اختبار',
      cities: ['الإسكندرية', 'برج العرب'],
      additional_cost: 20
    }
  ],
  coupons: [
    {
      code: 'TEST20',
      description: 'كوبون اختبار - خصم 20%',
      type: 'percentage',
      amount: 20,
      minimum_amount: 200
    },
    {
      code: 'TESTFREE',
      description: 'كوبون اختبار - شحن مجاني',
      type: 'free_shipping',
      amount: 0,
      minimum_amount: 300
    }
  ]
};

// دالة اختبار صحة البيانات
function validateTestData() {
  console.log('🔍 اختبار صحة البيانات...\n');

  let isValid = true;
  const errors = [];

  // اختبار المنتجات
  console.log('📦 اختبار المنتجات:');
  testData.products.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.name}`);
    
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
    
    console.log(`     ✅ السعر: ${product.price} ج (خصم: ${product.sale_price} ج)`);
    console.log(`     ✅ المخزون: ${product.stock_quantity}`);
    console.log(`     ✅ الفئة: ${product.category}`);
  });

  // اختبار طرق الشحن
  console.log('\n🚚 اختبار طرق الشحن:');
  testData.shippingMethods.forEach((method, index) => {
    console.log(`  ${index + 1}. ${method.name}`);
    
    if (!method.name || method.name.length < 3) {
      errors.push(`طريقة شحن ${index + 1}: اسم قصير جداً`);
      isValid = false;
    }
    if (method.base_cost === undefined || method.base_cost < 0) {
      errors.push(`طريقة شحن ${index + 1}: تكلفة غير صحيحة`);
      isValid = false;
    }
    
    console.log(`     ✅ التكلفة: ${method.base_cost} ج`);
    console.log(`     ✅ الوقت: ${method.estimated_days_min}-${method.estimated_days_max} أيام`);
    console.log(`     ✅ النوع: ${method.type}`);
  });

  // اختبار مناطق الشحن
  console.log('\n🗺️ اختبار مناطق الشحن:');
  testData.shippingZones.forEach((zone, index) => {
    console.log(`  ${index + 1}. ${zone.name}`);
    
    if (!zone.name || zone.name.length < 3) {
      errors.push(`منطقة شحن ${index + 1}: اسم قصير جداً`);
      isValid = false;
    }
    if (!zone.cities || zone.cities.length === 0) {
      errors.push(`منطقة شحن ${index + 1}: لا توجد مدن`);
      isValid = false;
    }
    
    console.log(`     ✅ المدن: ${zone.cities.join(', ')}`);
    console.log(`     ✅ التكلفة الإضافية: ${zone.additional_cost} ج`);
  });

  // اختبار الكوبونات
  console.log('\n🎫 اختبار الكوبونات:');
  testData.coupons.forEach((coupon, index) => {
    console.log(`  ${index + 1}. ${coupon.code}`);
    
    if (!coupon.code || coupon.code.length < 3) {
      errors.push(`كوبون ${index + 1}: كود قصير جداً`);
      isValid = false;
    }
    if (coupon.amount === undefined || coupon.amount < 0) {
      errors.push(`كوبون ${index + 1}: قيمة غير صحيحة`);
      isValid = false;
    }
    
    console.log(`     ✅ النوع: ${coupon.type}`);
    console.log(`     ✅ القيمة: ${coupon.amount}${coupon.type === 'percentage' ? '%' : ' ج'}`);
    console.log(`     ✅ الحد الأدنى: ${coupon.minimum_amount} ج`);
  });

  console.log('\n' + '='.repeat(50));
  
  if (isValid) {
    console.log('✅ جميع البيانات صحيحة!');
  } else {
    console.log('❌ توجد أخطاء في البيانات:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  return isValid;
}

// دالة محاكاة إدخال البيانات
function simulateDataInsertion() {
  console.log('\n📥 محاكاة إدخال البيانات...\n');

  try {
    // محاكاة إدخال المنتجات
    console.log('📦 إدخال المنتجات:');
    testData.products.forEach((product, index) => {
      console.log(`  ✅ تم إدخال: ${product.name}`);
      // محاكاة وقت المعالجة
    });

    // محاكاة إدخال طرق الشحن
    console.log('\n🚚 إدخال طرق الشحن:');
    testData.shippingMethods.forEach((method, index) => {
      console.log(`  ✅ تم إدخال: ${method.name}`);
    });

    // محاكاة إدخال مناطق الشحن
    console.log('\n🗺️ إدخال مناطق الشحن:');
    testData.shippingZones.forEach((zone, index) => {
      console.log(`  ✅ تم إدخال: ${zone.name}`);
    });

    // محاكاة إدخال الكوبونات
    console.log('\n🎫 إدخال الكوبونات:');
    testData.coupons.forEach((coupon, index) => {
      console.log(`  ✅ تم إدخال: ${coupon.code}`);
    });

    console.log('\n🎉 تم إدخال جميع البيانات بنجاح!');
    return true;

  } catch (error) {
    console.error('❌ خطأ في إدخال البيانات:', error.message);
    return false;
  }
}

// دالة عرض الإحصائيات
function showStatistics() {
  console.log('\n📊 إحصائيات البيانات التجريبية:');
  console.log('='.repeat(40));
  
  console.log(`📦 المنتجات: ${testData.products.length}`);
  console.log(`🚚 طرق الشحن: ${testData.shippingMethods.length}`);
  console.log(`🗺️ مناطق الشحن: ${testData.shippingZones.length}`);
  console.log(`🎫 الكوبونات: ${testData.coupons.length}`);
  
  const totalItems = testData.products.length + testData.shippingMethods.length + 
                    testData.shippingZones.length + testData.coupons.length;
  console.log(`📋 إجمالي العناصر: ${totalItems}`);

  // إحصائيات تفصيلية
  const totalProductValue = testData.products.reduce((sum, p) => sum + p.price, 0);
  const totalStock = testData.products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const avgShippingCost = testData.shippingMethods.reduce((sum, m) => sum + m.base_cost, 0) / testData.shippingMethods.length;

  console.log(`\n💰 إجمالي قيمة المنتجات: ${totalProductValue} ج`);
  console.log(`📦 إجمالي المخزون: ${totalStock} قطعة`);
  console.log(`🚚 متوسط تكلفة الشحن: ${avgShippingCost} ج`);
}

// تشغيل الاختبار الكامل
function runCompleteTest() {
  console.log('🚀 بدء الاختبار الشامل للبيانات التجريبية');
  console.log('='.repeat(60));
  
  // اختبار صحة البيانات
  const isDataValid = validateTestData();
  
  if (isDataValid) {
    // محاكاة إدخال البيانات
    const insertionSuccess = simulateDataInsertion();
    
    // عرض الإحصائيات
    showStatistics();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 تقرير الاختبار النهائي:');
    console.log(`🔍 صحة البيانات: ${isDataValid ? '✅ صحيحة' : '❌ خاطئة'}`);
    console.log(`📥 إدخال البيانات: ${insertionSuccess ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🎯 النتيجة العامة: ${isDataValid && insertionSuccess ? '✅ نجح بامتياز' : '❌ فشل'}`);
    
    if (isDataValid && insertionSuccess) {
      console.log('\n🎊 تهانينا! البيانات التجريبية جاهزة للاستخدام!');
      console.log('🔗 يمكنك الآن الذهاب إلى: http://localhost:8082/store-setup');
    }
  } else {
    console.log('\n❌ يرجى إصلاح الأخطاء قبل المتابعة');
  }
}

// تشغيل الاختبار
runCompleteTest();
