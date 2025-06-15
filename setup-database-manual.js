// إعداد قاعدة البيانات يدوياً
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// دالة إنشاء متجر افتراضي
async function createDefaultStore() {
  console.log('🏪 إنشاء متجر افتراضي...');

  try {
    // التحقق من وجود متجر
    const { data: existingStores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (existingStores && existingStores.length > 0) {
      console.log('✅ يوجد متجر بالفعل');
      return existingStores[0].id;
    }

    // إنشاء متجر جديد
    const { data: newStore, error } = await supabase
      .from('stores')
      .insert({
        name: 'متجر سوان شوب',
        description: 'متجر إلكتروني متكامل للأزياء والإكسسوارات',
        phone: '01234567890',
        email: 'info@swanshop.com',
        address: 'القاهرة، مصر',
        website: 'https://swanshop.com',
        logo_url: 'https://via.placeholder.com/200x200?text=Swan+Shop',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في إنشاء المتجر:', error.message);
      return null;
    }

    console.log('✅ تم إنشاء المتجر بنجاح');
    return newStore.id;

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return null;
  }
}

// دالة إضافة المنتجات التجريبية
async function addSampleProducts(storeId) {
  console.log('📦 إضافة المنتجات التجريبية...');

  const products = [
    {
      store_id: storeId,
      name: 'كوتشي رياضي أبيض نسائي',
      description: 'كوتشي رياضي مريح للاستخدام اليومي، مصنوع من مواد عالية الجودة مع تصميم عصري أنيق',
      short_description: 'كوتشي رياضي مريح للاستخدام اليومي',
      price: 299,
      sale_price: 249,
      sku: 'SHOE-001',
      category: 'أحذية رياضية',
      brand: 'سوان',
      stock_quantity: 25,
      weight: 0.5,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
    },
    {
      store_id: storeId,
      name: 'حذاء كلاسيكي أسود نسائي',
      description: 'حذاء كلاسيكي أنيق مناسب للعمل والمناسبات الرسمية، مصنوع من الجلد الطبيعي',
      short_description: 'حذاء كلاسيكي أنيق للعمل والمناسبات',
      price: 399,
      sku: 'SHOE-002',
      category: 'أحذية كلاسيكية',
      brand: 'سوان',
      stock_quantity: 15,
      weight: 0.6,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400'
    },
    {
      store_id: storeId,
      name: 'فستان كاجوال أنيق',
      description: 'فستان كاجوال مريح ومناسب للاستخدام اليومي، مصنوع من القطن الناعم',
      short_description: 'فستان كاجوال مريح للاستخدام اليومي',
      price: 249,
      sale_price: 199,
      sku: 'DRESS-001',
      category: 'فساتين',
      brand: 'سوان',
      stock_quantity: 20,
      weight: 0.4,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400'
    },
    {
      store_id: storeId,
      name: 'أحمر شفاه مات',
      description: 'أحمر شفاه بتركيبة مات طويلة الثبات، متوفر بألوان متعددة',
      short_description: 'أحمر شفاه مات طويل الثبات',
      price: 89,
      sale_price: 69,
      sku: 'LIPSTICK-001',
      category: 'مستحضرات تجميل',
      brand: 'بيوتي',
      stock_quantity: 50,
      weight: 0.05,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'
    },
    {
      store_id: storeId,
      name: 'حقيبة يد أنيقة',
      description: 'حقيبة يد أنيقة مصنوعة من الجلد الطبيعي، مناسبة لجميع المناسبات',
      short_description: 'حقيبة يد أنيقة من الجلد الطبيعي',
      price: 199,
      sku: 'BAG-001',
      category: 'حقائب',
      brand: 'سوان',
      stock_quantity: 22,
      weight: 0.6,
      status: 'active',
      featured: true,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'
    }
  ];

  try {
    const { data, error } = await supabase
      .from('ecommerce_products')
      .insert(products);

    if (error) {
      console.error('❌ خطأ في إضافة المنتجات:', error.message);
      return false;
    }

    console.log('✅ تم إضافة المنتجات بنجاح');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في المنتجات:', error.message);
    return false;
  }
}

// دالة إضافة طرق الشحن
async function addShippingMethods(storeId) {
  console.log('🚚 إضافة طرق الشحن...');

  const shippingMethods = [
    {
      store_id: storeId,
      name: 'الشحن العادي',
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
      store_id: storeId,
      name: 'الشحن السريع',
      description: 'شحن سريع خلال 24 ساعة',
      type: 'express',
      base_cost: 50,
      cost_per_kg: 0,
      free_shipping_threshold: null,
      estimated_days_min: 1,
      estimated_days_max: 1,
      is_active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .insert(shippingMethods);

    if (error) {
      console.error('❌ خطأ في إضافة طرق الشحن:', error.message);
      return false;
    }

    console.log('✅ تم إضافة طرق الشحن بنجاح');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في طرق الشحن:', error.message);
    return false;
  }
}

// دالة إضافة مناطق الشحن
async function addShippingZones(storeId) {
  console.log('🗺️ إضافة مناطق الشحن...');

  const shippingZones = [
    {
      store_id: storeId,
      name: 'القاهرة الكبرى',
      description: 'القاهرة والجيزة والقليوبية',
      cities: ['القاهرة', 'الجيزة', 'القليوبية', 'شبرا الخيمة', 'المعادي', 'مدينة نصر', 'الهرم'],
      additional_cost: 0,
      is_active: true
    },
    {
      store_id: storeId,
      name: 'الإسكندرية',
      description: 'محافظة الإسكندرية',
      cities: ['الإسكندرية', 'برج العرب', 'العامرية'],
      additional_cost: 20,
      is_active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .insert(shippingZones);

    if (error) {
      console.error('❌ خطأ في إضافة مناطق الشحن:', error.message);
      return false;
    }

    console.log('✅ تم إضافة مناطق الشحن بنجاح');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في مناطق الشحن:', error.message);
    return false;
  }
}

// دالة إضافة الكوبونات
async function addCoupons(storeId) {
  console.log('🎫 إضافة الكوبونات...');

  const coupons = [
    {
      store_id: storeId,
      code: 'WELCOME20',
      description: 'خصم ترحيبي للعملاء الجدد',
      type: 'percentage',
      amount: 20,
      minimum_amount: 200,
      usage_limit: 100,
      used_count: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    },
    {
      store_id: storeId,
      code: 'FREESHIP',
      description: 'شحن مجاني لجميع الطلبات',
      type: 'free_shipping',
      amount: 0,
      minimum_amount: 300,
      usage_limit: 50,
      used_count: 0,
      expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupons);

    if (error) {
      console.error('❌ خطأ في إضافة الكوبونات:', error.message);
      return false;
    }

    console.log('✅ تم إضافة الكوبونات بنجاح');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام في الكوبونات:', error.message);
    return false;
  }
}

// دالة الإعداد الكامل
async function setupDatabase() {
  console.log('🚀 بدء إعداد قاعدة البيانات...\n');

  try {
    // إنشاء المتجر
    const storeId = await createDefaultStore();
    if (!storeId) {
      console.log('❌ فشل في إنشاء المتجر');
      return;
    }

    // إضافة البيانات
    const productsSuccess = await addSampleProducts(storeId);
    const shippingMethodsSuccess = await addShippingMethods(storeId);
    const shippingZonesSuccess = await addShippingZones(storeId);
    const couponsSuccess = await addCoupons(storeId);

    console.log('\n' + '='.repeat(50));
    console.log('📋 تقرير الإعداد:');
    console.log(`🏪 المتجر: ✅ تم إنشاؤه`);
    console.log(`📦 المنتجات: ${productsSuccess ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🚚 طرق الشحن: ${shippingMethodsSuccess ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🗺️ مناطق الشحن: ${shippingZonesSuccess ? '✅ نجح' : '❌ فشل'}`);
    console.log(`🎫 الكوبونات: ${couponsSuccess ? '✅ نجح' : '❌ فشل'}`);

    if (productsSuccess && shippingMethodsSuccess && shippingZonesSuccess && couponsSuccess) {
      console.log('\n🎉 تم إعداد قاعدة البيانات بنجاح!');
      console.log('🔗 يمكنك الآن زيارة المتجر: http://localhost:8082/shop');
    } else {
      console.log('\n⚠️ تم الإعداد مع بعض الأخطاء');
    }

  } catch (error) {
    console.error('❌ خطأ عام في الإعداد:', error.message);
  }
}

// تشغيل الإعداد
setupDatabase();
