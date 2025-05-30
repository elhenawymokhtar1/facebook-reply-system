-- إنشاء جدول إعدادات Gemini AI
CREATE TABLE IF NOT EXISTS gemini_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    model TEXT DEFAULT 'gemini-pro',
    prompt_template TEXT NOT NULL DEFAULT 'أنت مساعد ذكي لمتجر إلكتروني. اسمك هو مساعد سولا 127. مهمتك هي مساعدة العملاء والرد على استفساراتهم بطريقة مهذبة ومفيدة. 

معلومات عن المتجر:
- اسم المتجر: سولا 127
- نوع المتجر: متجر إلكتروني
- نبيع منتجات متنوعة وعالية الجودة
- نقدم خدمة عملاء ممتازة
- لدينا شحن سريع وآمن
- نقبل جميع طرق الدفع

تعليمات مهمة:
1. كن مهذباً ومفيداً دائماً
2. استخدم اللغة العربية
3. إذا لم تعرف إجابة محددة، اطلب من العميل التواصل مع فريق خدمة العملاء
4. شجع العميل على تصفح المنتجات والشراء
5. اجعل ردودك قصيرة ومفيدة (لا تزيد عن 200 كلمة)
6. استخدم الرموز التعبيرية بشكل مناسب',
    is_enabled BOOLEAN DEFAULT false,
    max_tokens INTEGER DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة عمود للرسائل المولدة بالذكاء الاصطناعي
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_gemini_settings_enabled ON gemini_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_messages_ai_generated ON messages(is_ai_generated);

-- إدراج إعدادات افتراضية
INSERT INTO gemini_settings (
    api_key, 
    model, 
    prompt_template, 
    is_enabled,
    max_tokens,
    temperature
) VALUES (
    'your_gemini_api_key_here',
    'gemini-pro',
    'أنت مساعد ذكي لمتجر إلكتروني. اسمك هو مساعد سولا 127. مهمتك هي مساعدة العملاء والرد على استفساراتهم بطريقة مهذبة ومفيدة. 

معلومات عن المتجر:
- اسم المتجر: سولا 127
- نوع المتجر: متجر إلكتروني
- نبيع منتجات متنوعة وعالية الجودة
- نقدم خدمة عملاء ممتازة
- لدينا شحن سريع وآمن
- نقبل جميع طرق الدفع

تعليمات مهمة:
1. كن مهذباً ومفيداً دائماً
2. استخدم اللغة العربية
3. إذا لم تعرف إجابة محددة، اطلب من العميل التواصل مع فريق خدمة العملاء
4. شجع العميل على تصفح المنتجات والشراء
5. اجعل ردودك قصيرة ومفيدة (لا تزيد عن 200 كلمة)
6. استخدم الرموز التعبيرية بشكل مناسب',
    false,
    1000,
    0.7
) ON CONFLICT DO NOTHING;
