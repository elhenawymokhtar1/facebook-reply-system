// إيقاف Gemini AI مباشرة من قاعدة البيانات
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableGemini() {
  console.log('🔧 إيقاف Gemini AI...\n');

  try {
    // إيقاف جميع سجلات Gemini AI
    console.log('🔧 إيقاف جميع سجلات Gemini AI...');

    // أولاً: جلب جميع السجلات
    const { data: allSettings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('id');

    if (fetchError) {
      console.error('❌ خطأ في جلب السجلات:', fetchError);
      return;
    }

    if (!allSettings || allSettings.length === 0) {
      console.log('❌ لا توجد سجلات Gemini');
      return;
    }

    console.log(`📋 وجد ${allSettings.length} سجل، سيتم إيقاف الجميع...`);

    // إيقاف كل سجل على حدة
    let successCount = 0;
    for (const setting of allSettings) {
      const { error } = await supabase
        .from('gemini_settings')
        .update({
          is_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id);

      if (error) {
        console.error(`❌ خطأ في إيقاف السجل ${setting.id}:`, error);
      } else {
        successCount++;
        console.log(`✅ تم إيقاف السجل ${setting.id}`);
      }
    }

    console.log(`🎯 تم إيقاف ${successCount} من ${allSettings.length} سجل`);

    if (successCount === allSettings.length) {
      console.log('✅ تم إيقاف جميع سجلات Gemini AI بنجاح');
    } else {
      console.log('⚠️ تم إيقاف بعض السجلات فقط');
    }

    // التحقق من الحالة الحالية
    console.log('\n🔍 التحقق من حالة Gemini...');
    const { data: settings, error: checkError } = await supabase
      .from('gemini_settings')
      .select('*');

    if (checkError) {
      console.error('❌ خطأ في جلب الإعدادات:', checkError);
    } else if (settings && settings.length > 0) {
      settings.forEach((setting, index) => {
        console.log(`📋 إعداد ${index + 1}:`);
        console.log(`   🤖 مفعل: ${setting.is_enabled ? 'نعم' : 'لا'}`);
        console.log(`   🔑 API Key: ${setting.api_key ? setting.api_key.substring(0, 10) + '...' : 'غير موجود'}`);
        console.log(`   🧠 النموذج: ${setting.model || 'غير محدد'}`);
        console.log(`   📅 آخر تحديث: ${new Date(setting.updated_at).toLocaleString('ar-EG')}`);
      });
    } else {
      console.log('❌ لا توجد إعدادات Gemini');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الإيقاف
disableGemini().then(() => {
  console.log('\n🎯 انتهى إيقاف Gemini AI');
  console.log('🔄 أعد تشغيل السيرفر لتطبيق التغييرات');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
