// تحديث البرومبت في Gemini AI لحل مشكلة البرومبت القديم
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

// البرومبت الجديد المحدث من ملف .env
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

async function updateGeminiPrompt() {
  console.log('🔄 تحديث البرومبت في Gemini AI...\n');

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
      console.log('❌ لا توجد سجلات Gemini، سيتم إنشاء سجل جديد...');
      
      // إنشاء سجل جديد
      const { error: insertError } = await supabase
        .from('gemini_settings')
        .insert({
          api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU',
          model: 'gemini-1.5-flash',
          prompt_template: newPrompt,
          is_enabled: true,
          max_tokens: 1000,
          temperature: 0.7,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ خطأ في إنشاء السجل:', insertError);
      } else {
        console.log('✅ تم إنشاء سجل جديد بالبرومبت المحدث');
      }
      return;
    }

    console.log(`📋 وجد ${allSettings.length} سجل`);

    // تحديث جميع السجلات بالبرومبت الجديد
    let updatedCount = 0;
    for (const setting of allSettings) {
      const { error } = await supabase
        .from('gemini_settings')
        .update({
          prompt_template: newPrompt,
          model: 'gemini-1.5-flash',
          api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU',
          is_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id);

      if (error) {
        console.error(`❌ خطأ في تحديث السجل ${setting.id}:`, error);
      } else {
        updatedCount++;
        console.log(`✅ تم تحديث السجل ${setting.id}`);
      }
    }

    console.log(`\n🎯 النتيجة:`);
    console.log(`   ✅ تم تحديث ${updatedCount} من ${allSettings.length} سجل`);
    console.log(`   🤖 البرومبت الجديد: سوان شوب (متجر أحذية نسائية)`);
    console.log(`   🔑 API Key محدث`);
    console.log(`   🧠 النموذج: gemini-1.5-flash`);
    console.log(`   ⚡ الحالة: مفعل`);

    // التحقق النهائي
    const { data: finalSettings, error: finalError } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (finalError) {
      console.error('❌ خطأ في التحقق النهائي:', finalError);
    } else if (finalSettings) {
      console.log(`\n📋 التحقق النهائي:`);
      console.log(`   🤖 مفعل: ${finalSettings.is_enabled ? 'نعم' : 'لا'}`);
      console.log(`   🔑 API Key: ${finalSettings.api_key ? finalSettings.api_key.substring(0, 10) + '...' : 'غير موجود'}`);
      console.log(`   🧠 النموذج: ${finalSettings.model}`);
      console.log(`   📝 البرومبت يبدأ بـ: ${finalSettings.prompt_template.substring(0, 50)}...`);
      console.log(`   📅 آخر تحديث: ${new Date(finalSettings.updated_at).toLocaleString('ar-EG')}`);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل التحديث
updateGeminiPrompt().then(() => {
  console.log('\n✅ انتهى تحديث البرومبت');
  console.log('🔄 أعد تشغيل السيرفر لتطبيق التغييرات');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
