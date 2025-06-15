// إنشاء جدول السلة يدوياً
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCartManually() {
  console.log('🛒 إنشاء جدول السلة يدوياً...\n');

  try {
    // محاولة إنشاء الجدول باستخدام SQL مباشر
    console.log('1️⃣ محاولة إنشاء الجدول...');
    
    // أولاً، دعنا نتحقق من الجداول الموجودة
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%cart%');

    if (!tablesError) {
      console.log('📋 الجداول المتعلقة بالسلة:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    // محاولة إنشاء الجدول باستخدام INSERT مؤقت
    console.log('\n2️⃣ محاولة إنشاء الجدول عبر INSERT...');
    
    // إنشاء جدول مؤقت للاختبار
    const testData = {
      id: '00000000-0000-0000-0000-000000000000',
      session_id: 'test_session',
      store_id: 'fe810106-9a40-4115-95dd-a266acd873ba',
      product_id: 'c6dda350-dc7a-4ce8-98af-aa759593e3b5',
      quantity: 1,
      price: 100
    };

    // محاولة INSERT لإجبار إنشاء الجدول
    const { data, error } = await supabase
      .from('ecommerce_cart')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ خطأ في INSERT:', error.message);
      
      // إذا كان الخطأ أن الجدول غير موجود، فهذا متوقع
      if (error.message.includes('does not exist')) {
        console.log('⚠️ الجدول غير موجود كما متوقع');
        
        // محاولة إنشاء الجدول باستخدام طريقة أخرى
        console.log('\n3️⃣ محاولة إنشاء الجدول باستخدام setupDatabase...');
        
        // استيراد وتشغيل setupDatabase
        const setupDatabase = require('./src/utils/setupDatabase.ts');
        if (setupDatabase && setupDatabase.default) {
          await setupDatabase.default();
          console.log('✅ تم تشغيل setupDatabase');
        } else {
          console.log('⚠️ لم يتم العثور على setupDatabase');
        }
      }
    } else {
      console.log('✅ تم إنشاء الجدول وإدراج البيانات!');
      
      // حذف البيانات التجريبية
      await supabase
        .from('ecommerce_cart')
        .delete()
        .eq('id', testData.id);
      
      console.log('🗑️ تم حذف البيانات التجريبية');
    }

    // اختبار نهائي
    console.log('\n4️⃣ اختبار نهائي...');
    const { data: finalTest, error: finalError } = await supabase
      .from('ecommerce_cart')
      .select('*')
      .limit(1);

    if (finalError) {
      console.error('❌ الجدول لا يزال غير موجود:', finalError.message);
    } else {
      console.log('✅ الجدول موجود ويعمل!');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

createCartManually();
