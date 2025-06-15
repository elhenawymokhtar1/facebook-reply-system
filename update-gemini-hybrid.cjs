const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGeminiHybrid() {
  console.log('🚀 تحديث نظام Gemini للبرومت الهجين...');

  try {
    // 1. إضافة الأعمدة الجديدة
    console.log('1️⃣ إضافة الأعمدة الجديدة...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE gemini_settings 
        ADD COLUMN IF NOT EXISTS personality_prompt TEXT DEFAULT 'أنت مساعد ودود لمتجر سوان شوب. اسمك سارة وأنت بائعة لطيفة ومتفهمة. تتكلمي بطريقة مصرية بسيطة وودودة. مهمتك مساعدة العملاء في اختيار المنتجات المناسبة لهم. كوني صبورة ومساعدة واشرحي بوضوح.',
        ADD COLUMN IF NOT EXISTS products_prompt TEXT DEFAULT 'قواعد التعامل مع المنتجات:

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
- السلة: /cart';
      `
    });

    if (alterError) {
      console.log('⚠️ تحذير في إضافة الأعمدة:', alterError.message);
    } else {
      console.log('✅ تم إضافة الأعمدة بنجاح');
    }

    // 2. تحديث الإعدادات الموجودة
    console.log('2️⃣ تحديث الإعدادات الموجودة...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        personality_prompt: 'أنت مساعد ودود لمتجر سوان شوب. اسمك سارة وأنت بائعة لطيفة ومتفهمة. تتكلمي بطريقة مصرية بسيطة وودودة. مهمتك مساعدة العملاء في اختيار المنتجات المناسبة لهم. كوني صبورة ومساعدة واشرحي بوضوح.',
        products_prompt: `قواعد التعامل مع المنتجات:

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
- السلة: /cart`,
        model: 'gemini-1.5-flash',
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // تحديث كل الصفوف

    if (updateError) {
      console.error('❌ خطأ في التحديث:', updateError.message);
    } else {
      console.log('✅ تم تحديث الإعدادات بنجاح');
    }

    // 3. فحص النتيجة
    console.log('3️⃣ فحص النتيجة...');
    
    const { data: settings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في جلب الإعدادات:', fetchError.message);
    } else {
      console.log('✅ الإعدادات الحالية:');
      console.log('- Model:', settings.model);
      console.log('- Personality Prompt:', settings.personality_prompt ? 'موجود' : 'غير موجود');
      console.log('- Products Prompt:', settings.products_prompt ? 'موجود' : 'غير موجود');
    }

    console.log('🎉 تم تحديث النظام الهجين بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

updateGeminiHybrid().catch(console.error);
