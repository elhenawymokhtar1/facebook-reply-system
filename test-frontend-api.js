// اختبار الاتصال بين الواجهة والـ API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 اختبار الاتصال بين الواجهة والـ API...\n');

// 1. اختبار الاتصال بـ Supabase
async function testSupabaseConnection() {
  console.log('1️⃣ اختبار الاتصال بـ Supabase...');
  try {
    const { data, error } = await supabase
      .from('facebook_settings')
      .select('page_id, page_name, is_active')
      .limit(1);

    if (error) {
      console.error('❌ خطأ في الاتصال بـ Supabase:', error.message);
      return false;
    }

    console.log('✅ الاتصال بـ Supabase يعمل بنجاح');
    console.log('📊 البيانات:', data);
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error);
    return false;
  }
}

// 2. اختبار عمليات قطع الاتصال
async function testDisconnectPage() {
  console.log('\n2️⃣ اختبار عملية قطع الاتصال...');
  try {
    // البحث عن صفحة نشطة
    const { data: pages, error: fetchError } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (fetchError) {
      console.error('❌ خطأ في جلب الصفحات:', fetchError.message);
      return false;
    }

    if (!pages || pages.length === 0) {
      console.log('⚠️ لا توجد صفحات نشطة للاختبار');
      return false;
    }

    const page = pages[0];
    console.log(`📄 اختبار قطع الاتصال للصفحة: ${page.page_name} (${page.page_id})`);

    // محاكاة عملية قطع الاتصال
    const { error: updateError } = await supabase
      .from('facebook_settings')
      .update({
        is_active: false,
        disconnected_at: new Date().toISOString(),
        backup_access_token: page.access_token,
        access_token: null
      })
      .eq('page_id', page.page_id);

    if (updateError) {
      console.error('❌ خطأ في قطع الاتصال:', updateError.message);
      return false;
    }

    console.log('✅ تم قطع الاتصال بنجاح');

    // إعادة تفعيل الصفحة
    const { error: reactivateError } = await supabase
      .from('facebook_settings')
      .update({
        is_active: true,
        disconnected_at: null,
        access_token: page.access_token,
        backup_access_token: null
      })
      .eq('page_id', page.page_id);

    if (reactivateError) {
      console.error('❌ خطأ في إعادة التفعيل:', reactivateError.message);
      return false;
    }

    console.log('✅ تم إعادة التفعيل بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار قطع الاتصال:', error);
    return false;
  }
}

// 3. اختبار عمليات الحذف
async function testDeletePage() {
  console.log('\n3️⃣ اختبار عملية الحذف...');
  try {
    // إنشاء صفحة تجريبية
    const testPageId = 'test_page_' + Date.now();
    const { error: insertError } = await supabase
      .from('facebook_settings')
      .insert({
        page_id: testPageId,
        page_name: 'صفحة اختبار',
        access_token: 'test_token',
        is_active: true
      });

    if (insertError) {
      console.error('❌ خطأ في إنشاء الصفحة التجريبية:', insertError.message);
      return false;
    }

    console.log(`📄 تم إنشاء صفحة تجريبية: ${testPageId}`);

    // حذف الصفحة التجريبية
    const { error: deleteError } = await supabase
      .from('facebook_settings')
      .delete()
      .eq('page_id', testPageId);

    if (deleteError) {
      console.error('❌ خطأ في حذف الصفحة:', deleteError.message);
      return false;
    }

    console.log('✅ تم حذف الصفحة بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار الحذف:', error);
    return false;
  }
}

// 4. اختبار حالة الصفحات
async function testPageStatus() {
  console.log('\n4️⃣ اختبار حالة الصفحات...');
  try {
    const { data: pages, error } = await supabase
      .from('facebook_settings')
      .select('page_id, page_name, is_active, access_token, backup_access_token')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في جلب الصفحات:', error.message);
      return false;
    }

    console.log(`📊 تم العثور على ${pages.length} صفحة:`);
    
    pages.forEach((page, index) => {
      const hasToken = !!page.access_token;
      const hasBackup = !!page.backup_access_token;
      const status = page.is_active ? '🟢 نشط' : '🔴 معطل';
      const tokenStatus = hasToken ? '🔑 متوفر' : hasBackup ? '💾 محفوظ احتياطي' : '❌ غير متوفر';
      
      console.log(`   ${index + 1}. ${page.page_name} (${page.page_id})`);
      console.log(`      الحالة: ${status}`);
      console.log(`      الـ Token: ${tokenStatus}`);
    });

    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار حالة الصفحات:', error);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء تشغيل جميع الاختبارات...\n');
  
  const results = {
    supabase: await testSupabaseConnection(),
    disconnect: await testDisconnectPage(),
    delete: await testDeletePage(),
    status: await testPageStatus()
  };

  console.log('\n📋 ملخص النتائج:');
  console.log('==================');
  console.log(`✅ Supabase: ${results.supabase ? 'نجح' : 'فشل'}`);
  console.log(`✅ قطع الاتصال: ${results.disconnect ? 'نجح' : 'فشل'}`);
  console.log(`✅ الحذف: ${results.delete ? 'نجح' : 'فشل'}`);
  console.log(`✅ حالة الصفحات: ${results.status ? 'نجح' : 'فشل'}`);

  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 النتيجة النهائية: ${successCount}/4 اختبار نجح`);

  if (successCount === 4) {
    console.log('🎉 جميع الاختبارات نجحت! النظام يعمل بشكل صحيح.');
  } else {
    console.log('⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  }
}

// تشغيل الاختبارات
runAllTests().catch(console.error);
