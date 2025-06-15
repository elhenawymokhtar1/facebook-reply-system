const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function writeHybridPrompt() {
  console.log('✍️ كتابة البرومت الهجين الجديد...');

  try {
    // البرومت الهجين الجديد
    const hybridPrompt = `أنت مساعد ودود لمتجر سوان شوب. اسمك سارة وأنت بائعة لطيفة ومتفهمة. تتكلمي بطريقة مصرية بسيطة وودودة. مهمتك مساعدة العملاء في اختيار المنتجات المناسبة لهم. كوني صبورة ومساعدة واشرحي بوضوح.

🎯 أسلوب الرد:
- استخدمي لغة بسيطة ومفهومة
- كوني ودودة ومرحبة
- اجيبي بإيجاز ووضوح
- استخدمي الإيموجي بحكمة

💬 للأسئلة العادية:
- رحبي بالعميل بطريقة ودودة
- اجيبي على أسئلته بوضوح
- وجهيه للمساعدة المناسبة

🛍️ للأسئلة عن المنتجات:
- اعرضي المنتجات المتوفرة مع الأسعار
- اذكري المخزون المتوفر
- اقترحي منتجات مشابهة
- للشراء: [ADD_TO_CART: اسم المنتج]

📞 معلومات التواصل:
- واتساب: 01032792040
- المتجر: /shop
- السلة: /cart

كوني مساعدة مثالية لعملاء سوان شوب! 💖`;

    // تحديث البرومت
    const { data: updateData, error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        prompt_template: hybridPrompt,
        model: 'gemini-1.5-flash',
        is_enabled: true,
        max_tokens: 300,
        temperature: 0.5,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (updateError) {
      console.error('❌ خطأ في التحديث:', updateError.message);
      return;
    }

    console.log('✅ تم تحديث البرومت بنجاح!');

    // فحص النتيجة
    const { data: settings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في جلب الإعدادات:', fetchError.message);
    } else {
      console.log('🎉 الإعدادات الحالية:');
      console.log('- Model:', settings.model);
      console.log('- Enabled:', settings.is_enabled);
      console.log('- Max Tokens:', settings.max_tokens);
      console.log('- Temperature:', settings.temperature);
      console.log('- Prompt Length:', settings.prompt_template.length, 'characters');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

writeHybridPrompt().catch(console.error);
