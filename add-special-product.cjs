const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSpecialProduct() {
  console.log('👟 إضافة المنتج المخصوص - حذاء كاجوال جلد طبيعي...');

  try {
    // الحصول على معرف المتجر الافتراضي
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (!stores || stores.length === 0) {
      console.error('❌ لا يوجد متجر متاح');
      return;
    }

    const storeId = stores[0].id;

    // التحقق من وجود المنتج
    const { data: existingProduct } = await supabase
      .from('ecommerce_products')
      .select('id, name')
      .ilike('name', '%حذاء كاجوال جلد طبيعي%')
      .single();

    if (existingProduct) {
      console.log('✅ المنتج موجود بالفعل:', existingProduct.name);
      return;
    }

    // إضافة المنتج الجديد
    const productData = {
      store_id: storeId,
      name: 'حذاء كاجوال جلد طبيعي',
      short_description: 'حذاء كاجوال أنيق من الجلد الطبيعي 100% - مريح للاستخدام اليومي',
      description: `حذاء كاجوال فاخر من الجلد الطبيعي 100%

✨ المميزات:
- جلد طبيعي عالي الجودة
- تصميم عصري وأنيق
- مريح للاستخدام اليومي
- مناسب للعمل والخروجات
- متوفر بألوان متعددة
- ضمان سنة كاملة

🎨 الألوان المتوفرة:
- أسود كلاسيكي
- بني فاتح
- كحلي أنيق

📏 المقاسات المتوفرة:
38، 39، 40، 41، 42، 43، 44

🚚 الشحن:
- شحن مجاني داخل القاهرة
- التوصيل خلال 2-3 أيام عمل
- إمكانية الاستبدال خلال 14 يوم`,
      price: 350.00,
      sale_price: 250.00,
      stock_quantity: 50,
      status: 'active',
      featured: true,
      category: 'أحذية',
      sku: 'SHOE-CASUAL-LEATHER-001',
      weight: 0.8,
      manage_stock: true,
      track_quantity: true,
      allow_backorders: false,
      meta_title: 'حذاء كاجوال جلد طبيعي - سوان شوب',
      meta_description: 'حذاء كاجوال أنيق من الجلد الطبيعي 100% بخصم 30%. مريح وعصري، مناسب للعمل والخروجات. شحن مجاني وضمان سنة كاملة.',
      tags: ['أحذية', 'كاجوال', 'جلد طبيعي', 'رجالي', 'مريح', 'عصري']
    };

    const { data: product, error: productError } = await supabase
      .from('ecommerce_products')
      .insert(productData)
      .select()
      .single();

    if (productError) {
      console.error('❌ خطأ في إضافة المنتج:', productError.message);
      return;
    }

    console.log('✅ تم إضافة المنتج بنجاح!');
    console.log('📋 تفاصيل المنتج:');
    console.log('- الاسم:', product.name);
    console.log('- السعر الأساسي:', product.price, 'جنيه');
    console.log('- سعر البيع:', product.sale_price, 'جنيه');
    console.log('- الخصم:', Math.round(((product.price - product.sale_price) / product.price) * 100), '%');
    console.log('- المخزون:', product.stock_quantity, 'قطعة');
    console.log('- مميز:', product.featured ? 'نعم' : 'لا');

    // إضافة صور المنتج (اختيارية)
    const imageData = {
      product_id: product.id,
      url: 'https://via.placeholder.com/500x500/8B4513/FFFFFF?text=حذاء+كاجوال+جلد+طبيعي',
      alt_text: 'حذاء كاجوال جلد طبيعي',
      is_primary: true,
      sort_order: 1
    };

    const { error: imageError } = await supabase
      .from('ecommerce_product_images')
      .insert(imageData);

    if (imageError) {
      console.log('⚠️ تحذير: لم يتم إضافة الصورة:', imageError.message);
    } else {
      console.log('🖼️ تم إضافة صورة المنتج');
    }

    console.log('🎉 المنتج جاهز للعرض والبيع!');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

addSpecialProduct().catch(console.error);
