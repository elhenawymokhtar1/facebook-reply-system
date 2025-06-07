// تنظيف جدول gemini_settings من السجلات المكررة
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupGeminiSettings() {
  console.log('🧹 تنظيف جدول gemini_settings...\n');

  try {
    // جلب جميع السجلات
    const { data: allSettings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('❌ خطأ في جلب السجلات:', fetchError);
      return;
    }

    if (!allSettings || allSettings.length === 0) {
      console.log('❌ لا توجد سجلات');
      return;
    }

    console.log(`📋 وجد ${allSettings.length} سجل`);

    if (allSettings.length === 1) {
      console.log('✅ يوجد سجل واحد فقط، لا حاجة للتنظيف');
      
      // تحديث السجل بالبرومبت الجديد من .env
      const newPrompt = `أنت مساعد ذكي لمتجر أحذية نسائية. اسمك سوان شوب. تخصصك بيع الأحذية النسائية العصرية والأنيقة.

معلومات المتجر:
- اسم المتجر: سوان شوب
- التخصص: أحذية نسائية عصرية
- الأسعار: من 300 إلى 500 جنيه
- الألوان المتاحة: أسود، أبيض، أحمر، أزرق، بيج، جملي
- المقاسات: من 36 إلى 42
- الشحن: 50 جنيه لجميع المحافظات
- طريقة الدفع: كاش عند الاستلام

أسلوبك في الرد:
- ودود ومرحب
- استخدم الإيموجي بشكل مناسب
- اسأل عن المقاس واللون المطلوب
- اعرض المساعدة في اختيار المنتج المناسب
- اطلب معلومات التواصل (الاسم، الهاتف، العنوان) لإتمام الطلب

عند السؤال عن:
- الأسعار: اذكر النطاق السعري (300-500 جنيه)
- الألوان: اذكر الألوان المتاحة
- المقاسات: اذكر المقاسات المتاحة (36-42)
- الشحن: اذكر أن الشحن 50 جنيه لجميع المحافظات
- طريقة الدفع: كاش عند الاستلام

إذا طلب العميل رؤية صور للمنتجات، قل له أنك ستعرض عليه الصور المتاحة.

كن مفيداً ومساعداً في جميع الأوقات!`;

      const { error: updateError } = await supabase
        .from('gemini_settings')
        .update({
          is_enabled: false,
          prompt_template: newPrompt,
          model: 'gemini-1.5-flash',
          api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU',
          updated_at: new Date().toISOString()
        })
        .eq('id', allSettings[0].id);

      if (updateError) {
        console.error('❌ خطأ في تحديث السجل:', updateError);
      } else {
        console.log('✅ تم التأكد من إيقاف السجل');
      }
      return;
    }

    // الاحتفاظ بأحدث سجل وحذف الباقي
    const latestSetting = allSettings[0]; // أحدث سجل
    const settingsToDelete = allSettings.slice(1); // باقي السجلات

    console.log(`🎯 سيتم الاحتفاظ بالسجل: ${latestSetting.id}`);
    console.log(`🗑️ سيتم حذف ${settingsToDelete.length} سجل`);

    // حذف السجلات القديمة
    let deletedCount = 0;
    for (const setting of settingsToDelete) {
      const { error } = await supabase
        .from('gemini_settings')
        .delete()
        .eq('id', setting.id);

      if (error) {
        console.error(`❌ خطأ في حذف السجل ${setting.id}:`, error);
      } else {
        deletedCount++;
        console.log(`🗑️ تم حذف السجل ${setting.id}`);
      }
    }

    // تحديث السجل المتبقي بالبرومبت الجديد
    const newPrompt = `أنت مساعد ذكي لمتجر أحذية نسائية. اسمك سوان شوب. تخصصك بيع الأحذية النسائية العصرية والأنيقة.

معلومات المتجر:
- اسم المتجر: سوان شوب
- التخصص: أحذية نسائية عصرية
- الأسعار: من 300 إلى 500 جنيه
- الألوان المتاحة: أسود، أبيض، أحمر، أزرق، بيج، جملي
- المقاسات: من 36 إلى 42
- الشحن: 50 جنيه لجميع المحافظات
- طريقة الدفع: كاش عند الاستلام

أسلوبك في الرد:
- ودود ومرحب
- استخدم الإيموجي بشكل مناسب
- اسأل عن المقاس واللون المطلوب
- اعرض المساعدة في اختيار المنتج المناسب
- اطلب معلومات التواصل (الاسم، الهاتف، العنوان) لإتمام الطلب

عند السؤال عن:
- الأسعار: اذكر النطاق السعري (300-500 جنيه)
- الألوان: اذكر الألوان المتاحة
- المقاسات: اذكر المقاسات المتاحة (36-42)
- الشحن: اذكر أن الشحن 50 جنيه لجميع المحافظات
- طريقة الدفع: كاش عند الاستلام

إذا طلب العميل رؤية صور للمنتجات، قل له أنك ستعرض عليه الصور المتاحة.

كن مفيداً ومساعداً في جميع الأوقات!`;

    const { error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        is_enabled: false,
        prompt_template: newPrompt,
        model: 'gemini-1.5-flash',
        api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU',
        updated_at: new Date().toISOString()
      })
      .eq('id', latestSetting.id);

    if (updateError) {
      console.error('❌ خطأ في تحديث السجل المتبقي:', updateError);
    } else {
      console.log('✅ تم تحديث السجل المتبقي وإيقافه');
    }

    console.log(`\n🎯 النتيجة:`);
    console.log(`   ✅ تم حذف ${deletedCount} سجل`);
    console.log(`   ✅ تم الاحتفاظ بسجل واحد معطل`);

    // التحقق النهائي
    const { data: finalSettings, error: finalError } = await supabase
      .from('gemini_settings')
      .select('*');

    if (finalError) {
      console.error('❌ خطأ في التحقق النهائي:', finalError);
    } else {
      console.log(`\n📋 التحقق النهائي: ${finalSettings?.length || 0} سجل متبقي`);
      if (finalSettings && finalSettings.length > 0) {
        finalSettings.forEach((setting, index) => {
          console.log(`   ${index + 1}. ID: ${setting.id.substring(0, 8)}... - مفعل: ${setting.is_enabled ? 'نعم' : 'لا'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل التنظيف
cleanupGeminiSettings().then(() => {
  console.log('\n✅ انتهى تنظيف قاعدة البيانات');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
