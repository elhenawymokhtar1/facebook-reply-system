const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addHybridColumns() {
  console.log('🔧 إضافة أعمدة البرومت الهجين...');

  try {
    // جلب الإعدادات الحالية
    const { data: currentSettings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في جلب الإعدادات:', fetchError.message);
      return;
    }

    console.log('📋 الإعدادات الحالية:', {
      model: currentSettings.model,
      has_personality: !!currentSettings.personality_prompt,
      has_products: !!currentSettings.products_prompt
    });

    // إذا كانت الأعمدة موجودة، لا نحتاج لإضافتها
    if (currentSettings.personality_prompt !== undefined && currentSettings.products_prompt !== undefined) {
      console.log('✅ الأعمدة موجودة بالفعل!');
      return;
    }

    // محاولة تحديث مع الأعمدة الجديدة
    const personalityPrompt = `أنت مساعد ودود لمتجر سوان شوب. اسمك سارة وأنت بائعة لطيفة ومتفهمة. تتكلمي بطريقة مصرية بسيطة وودودة. مهمتك مساعدة العملاء في اختيار المنتجات المناسبة لهم. كوني صبورة ومساعدة واشرحي بوضوح.`;

    const productsPrompt = `قواعد التعامل مع المنتجات:

🔍 عند السؤال عن المنتجات:
- اعرضي القائمة المتوفرة مع الأسعار
- اذكري المخزون المتوفر
- اقترحي منتجات مشابهة

💰 عند ذكر الأسعار:
- اذكري السعر الأساسي
- اذكري العروض إن وجدت
- قارني بين المنتجات

🛒 عند طلب الشراء:
- اكتبي: [ADD_TO_CART: اسم المنتج]
- اشرحي خطوات الطلب
- اذكري معلومات التوصيل

📞 معلومات التواصل:
- واتساب: 01032792040
- المتجر: /shop
- السلة: /cart`;

    const { data: updateData, error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        personality_prompt: personalityPrompt,
        products_prompt: productsPrompt,
        model: 'gemini-1.5-flash',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSettings.id)
      .select();

    if (updateError) {
      console.log('⚠️ الأعمدة غير موجودة، سأحاول إنشاؤها...');
      
      // إنشاء إعدادات جديدة مع الأعمدة الجديدة
      const { data: insertData, error: insertError } = await supabase
        .from('gemini_settings')
        .insert({
          api_key: currentSettings.api_key,
          model: 'gemini-1.5-flash',
          prompt_template: currentSettings.prompt_template,
          personality_prompt: personalityPrompt,
          products_prompt: productsPrompt,
          is_enabled: currentSettings.is_enabled,
          max_tokens: currentSettings.max_tokens,
          temperature: currentSettings.temperature
        })
        .select();

      if (insertError) {
        console.error('❌ خطأ في الإنشاء:', insertError.message);
        console.log('💡 سأستخدم النظام المؤقت مع البرومت الموجود');
        return;
      } else {
        console.log('✅ تم إنشاء إعدادات جديدة مع البرومت الهجين');
        
        // حذف الإعدادات القديمة
        await supabase
          .from('gemini_settings')
          .delete()
          .eq('id', currentSettings.id);
      }
    } else {
      console.log('✅ تم تحديث الإعدادات بالبرومت الهجين');
    }

    // فحص النتيجة النهائية
    const { data: finalSettings, error: finalError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (finalError) {
      console.error('❌ خطأ في الفحص النهائي:', finalError.message);
    } else {
      console.log('🎉 النتيجة النهائية:');
      console.log('- Model:', finalSettings.model);
      console.log('- Personality Prompt:', finalSettings.personality_prompt ? 'موجود ✅' : 'غير موجود ❌');
      console.log('- Products Prompt:', finalSettings.products_prompt ? 'موجود ✅' : 'غير موجود ❌');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

addHybridColumns().catch(console.error);
