const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGeminiSettings() {
  try {
    console.log('🔧 إصلاح إعدادات Gemini...\n');
    
    // 1. فحص الجدول الحالي
    console.log('1️⃣ فحص الجدول الحالي...');
    const { data: allSettings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('*');

    if (fetchError) {
      console.error('❌ خطأ في جلب الإعدادات:', fetchError.message);
      return false;
    }

    console.log(`📊 عدد السجلات الموجودة: ${allSettings?.length || 0}`);
    
    if (allSettings && allSettings.length > 0) {
      allSettings.forEach((setting, index) => {
        console.log(`   ${index + 1}. ID: ${setting.id}, Enabled: ${setting.is_enabled}`);
      });
    }

    // 2. حذف جميع السجلات الموجودة
    console.log('\n2️⃣ حذف السجلات المكررة...');
    const { error: deleteError } = await supabase
      .from('gemini_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // حذف كل شيء

    if (deleteError) {
      console.error('❌ خطأ في حذف السجلات:', deleteError.message);
    } else {
      console.log('✅ تم حذف السجلات المكررة');
    }

    // 3. إنشاء سجل واحد جديد مع البرومت المحدث
    console.log('\n3️⃣ إنشاء سجل جديد مع دعم الصور...');
    
    const imageEnabledPrompt = `أنت مساعد ذكي لمتجر سوان شوب للأحذية النسائية العصرية. اسمك سارة وأنت بائعة لطيفة ومتفهمة.

🎯 مهامك الأساسية:
- مساعدة العملاء في اختيار المنتجات المناسبة
- الرد على الاستفسارات بطريقة ودودة ومفيدة
- إرسال صور المنتجات عند الطلب
- إنشاء الطلبات عند اكتمال البيانات

💬 أسلوب التحدث:
- استخدمي اللهجة المصرية البسيطة والودودة
- كوني صبورة ومساعدة
- اشرحي بوضوح ووضوح

🖼️ نظام إرسال الصور الذكي:
عندما يطلب العميل رؤية صور المنتجات، استخدمي الأوامر التالية:

📸 أمثلة على طلبات الصور:
- "عايزة اشوف الكوتشي الأحمر" → [SEND_IMAGE: كوتشي أحمر]
- "ممكن اشوف الحذاء الأسود؟" → [SEND_IMAGE: حذاء أسود]
- "اعرضيلي الأحذية الرياضية" → [SEND_IMAGE: أحذية رياضية]
- "عايزة اشوف منتجات باللون البني" → [SEND_IMAGE: بني]
- "ممكن صور للمقاس 38؟" → [SEND_IMAGE: مقاس 38]

🔍 قواعد استخدام أوامر الصور:
1. استخدمي [SEND_IMAGE: وصف المنتج] عندما يطلب العميل رؤية صور
2. ضعي وصف واضح للمنتج المطلوب (اللون، النوع، المقاس)
3. يمكنك إرسال أكثر من صورة: [SEND_IMAGE: أحمر] [SEND_IMAGE: أسود]
4. بعد الأمر، اكملي الرد بوصف المنتج والسعر

💡 أمثلة على الردود الصحيحة:
العميل: "عايزة اشوف كوتشي أحمر"
الرد: "[SEND_IMAGE: كوتشي أحمر] ده الكوتشي الأحمر الجميل يا قمر! 😍 السعر 200 جنيه، متوفر بمقاسات من 36 لـ 40. إيه رأيك فيه؟"

العميل: "ممكن اشوف الألوان المتوفرة؟"
الرد: "[SEND_IMAGE: أحمر] [SEND_IMAGE: أسود] [SEND_IMAGE: بني] دي الألوان المتوفرة يا حبيبتي! أي لون يعجبك أكتر؟ 💖"

🛒 للطلبات:
- اجمعي البيانات: الاسم، الهاتف، العنوان، المنتج، المقاس، اللون
- عند اكتمال البيانات: [CREATE_ORDER: البيانات]

📱 معلومات التواصل:
- واتساب: 01032792040
- المتجر: /shop
- السلة: /cart

كوني مساعدة مثالية وأرسلي الصور عند الطلب! 💖`;

    const newSettings = {
      api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU',
      model: 'gemini-1.5-flash',
      personality_prompt: imageEnabledPrompt,
      temperature: 0.5,
      max_tokens: 300,
      is_enabled: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('gemini_settings')
      .insert(newSettings)
      .select();

    if (insertError) {
      console.error('❌ خطأ في إنشاء السجل الجديد:', insertError.message);
      return false;
    }

    console.log('✅ تم إنشاء سجل جديد بنجاح');
    console.log(`📊 ID الجديد: ${insertData[0]?.id}`);

    // 4. فحص النتيجة
    console.log('\n4️⃣ فحص النتيجة...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('gemini_settings')
      .select('*')
      .single();

    if (finalError) {
      console.error('❌ خطأ في الفحص النهائي:', finalError.message);
      return false;
    }

    console.log('✅ فحص النتيجة النهائية:');
    console.log(`   - الحالة: ${finalCheck.is_enabled ? 'مفعل' : 'معطل'}`);
    console.log(`   - النموذج: ${finalCheck.model}`);
    console.log(`   - طول البرومت: ${finalCheck.personality_prompt?.length || 0} حرف`);
    console.log(`   - يحتوي على أوامر الصور: ${finalCheck.personality_prompt?.includes('[SEND_IMAGE:') ? 'نعم ✅' : 'لا ❌'}`);

    return true;

  } catch (error) {
    console.error('❌ خطأ في إصلاح الإعدادات:', error.message);
    return false;
  }
}

// تشغيل الإصلاح
if (require.main === module) {
  fixGeminiSettings().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('🎉 تم إصلاح إعدادات Gemini بنجاح!');
      console.log('🖼️ الآن Gemini يدعم إرسال الصور التلقائي');
    } else {
      console.log('❌ فشل في إصلاح الإعدادات');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { fixGeminiSettings };
