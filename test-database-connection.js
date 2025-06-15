// اختبار الاتصال بقاعدة البيانات
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة اختبار الاتصال
async function testDatabaseConnection() {
  console.log('🔌 اختبار الاتصال بقاعدة البيانات...\n');

  try {
    // اختبار الاتصال الأساسي
    console.log('1️⃣ اختبار الاتصال الأساسي...');
    const { data, error } = await supabase.from('stores').select('count').limit(1);
    
    if (error) {
      console.log('❌ فشل الاتصال:', error.message);
      return false;
    } else {
      console.log('✅ الاتصال بقاعدة البيانات نجح!');
    }

    // اختبار الجداول المطلوبة
    console.log('\n2️⃣ اختبار وجود الجداول المطلوبة...');
    
    const tables = [
      'stores',
      'ecommerce_products', 
      'ecommerce_orders',
      'shipping_methods',
      'shipping_zones',
      'coupons'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ جدول ${table}: ${error.message}`);
        } else {
          console.log(`✅ جدول ${table}: موجود`);
        }
      } catch (err) {
        console.log(`❌ جدول ${table}: خطأ في الاتصال`);
      }
    }

    // اختبار إدراج بيانات تجريبية
    console.log('\n3️⃣ اختبار إدراج بيانات تجريبية...');
    
    // التحقق من وجود متجر
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (storesError) {
      console.log('❌ خطأ في جلب المتاجر:', storesError.message);
      return false;
    }

    if (!stores || stores.length === 0) {
      console.log('⚠️ لا يوجد متجر، سيتم إنشاء متجر تجريبي...');
      
      const { data: newStore, error: createError } = await supabase
        .from('stores')
        .insert({
          name: 'متجر سوان شوب - اختبار',
          description: 'متجر تجريبي للاختبار',
          phone: '01234567890',
          email: 'test@swanshop.com',
          address: 'القاهرة، مصر'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ فشل إنشاء المتجر:', createError.message);
        return false;
      } else {
        console.log('✅ تم إنشاء متجر تجريبي بنجاح');
        console.log(`   معرف المتجر: ${newStore.id}`);
      }
    } else {
      console.log('✅ يوجد متجر بالفعل');
      console.log(`   معرف المتجر: ${stores[0].id}`);
    }

    console.log('\n🎉 جميع اختبارات قاعدة البيانات نجحت!');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في اختبار قاعدة البيانات:', error.message);
    return false;
  }
}

// دالة اختبار إدراج منتج تجريبي
async function testProductInsertion() {
  console.log('\n📦 اختبار إدراج منتج تجريبي...');

  try {
    // الحصول على معرف المتجر
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (!stores || stores.length === 0) {
      console.log('❌ لا يوجد متجر لإضافة المنتج إليه');
      return false;
    }

    const storeId = stores[0].id;

    // التحقق من وجود منتج تجريبي
    const { data: existingProducts } = await supabase
      .from('ecommerce_products')
      .select('id')
      .eq('sku', 'TEST-PRODUCT-001')
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ يوجد منتج تجريبي بالفعل');
      return true;
    }

    // إدراج منتج تجريبي
    const testProduct = {
      store_id: storeId,
      name: 'منتج تجريبي للاختبار',
      description: 'هذا منتج تجريبي لاختبار النظام',
      short_description: 'منتج تجريبي',
      price: 100,
      sale_price: 80,
      sku: 'TEST-PRODUCT-001',
      category: 'اختبار',
      brand: 'سوان',
      stock_quantity: 10,
      weight: 0.5,
      status: 'active',
      featured: false,
      image_url: 'https://via.placeholder.com/400x400?text=Test+Product'
    };

    const { data: newProduct, error: productError } = await supabase
      .from('ecommerce_products')
      .insert(testProduct)
      .select()
      .single();

    if (productError) {
      console.log('❌ فشل إدراج المنتج:', productError.message);
      return false;
    } else {
      console.log('✅ تم إدراج منتج تجريبي بنجاح');
      console.log(`   اسم المنتج: ${newProduct.name}`);
      console.log(`   السعر: ${newProduct.price} ج`);
      return true;
    }

  } catch (error) {
    console.error('❌ خطأ في إدراج المنتج:', error.message);
    return false;
  }
}

// دالة اختبار شاملة
async function runDatabaseTests() {
  console.log('🧪 بدء اختبار قاعدة البيانات الشامل');
  console.log('='.repeat(50));

  const connectionTest = await testDatabaseConnection();
  
  if (connectionTest) {
    const productTest = await testProductInsertion();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 تقرير اختبار قاعدة البيانات:');
    console.log(`🔌 الاتصال: ${connectionTest ? '✅ نجح' : '❌ فشل'}`);
    console.log(`📦 إدراج المنتجات: ${productTest ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🎯 النتيجة العامة: ${connectionTest && productTest ? '✅ نجح بامتياز' : '❌ فشل'}`);
    
    if (connectionTest && productTest) {
      console.log('\n🎊 تهانينا! قاعدة البيانات جاهزة للاستخدام!');
      console.log('🔗 يمكنك الآن استخدام صفحة إعداد المتجر: http://localhost:8082/store-setup');
    }
  } else {
    console.log('\n❌ يرجى التحقق من إعدادات قاعدة البيانات');
  }
}

// تشغيل الاختبار
runDatabaseTests().catch(console.error);
