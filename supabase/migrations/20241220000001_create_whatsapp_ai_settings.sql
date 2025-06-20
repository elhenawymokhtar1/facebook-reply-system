-- إنشاء جدول إعدادات الذكاء الاصطناعي لـ WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_ai_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    use_existing_prompt BOOLEAN DEFAULT true,
    custom_prompt TEXT DEFAULT '',
    api_key TEXT DEFAULT '',
    model TEXT DEFAULT 'gemini-1.5-flash',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    can_access_orders BOOLEAN DEFAULT true,
    can_access_products BOOLEAN DEFAULT true,
    auto_reply_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_whatsapp_ai_settings_enabled ON whatsapp_ai_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_whatsapp_ai_settings_auto_reply ON whatsapp_ai_settings(auto_reply_enabled);

-- إضافة عمود للرسائل المولدة بالذكاء الاصطناعي في جدول whatsapp_messages
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- إنشاء فهرس للرسائل المولدة بالذكاء الاصطناعي
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_ai_generated ON whatsapp_messages(is_ai_generated);

-- إدراج إعدادات افتراضية
INSERT INTO whatsapp_ai_settings (
    is_enabled,
    use_existing_prompt,
    custom_prompt,
    api_key,
    model,
    temperature,
    max_tokens,
    can_access_orders,
    can_access_products,
    auto_reply_enabled
) VALUES (
    false,
    true,
    'أنت مساعد ذكي لمتجر WhatsApp. اسمك سارة وأنت بائعة لطيفة ومتفهمة.

🎯 مهامك:
- مساعدة العملاء في اختيار المنتجات
- الرد على الاستفسارات بطريقة ودودة
- إنشاء الطلبات عند اكتمال البيانات
- تقديم معلومات المنتجات والأسعار

💬 أسلوب التحدث:
- استخدمي اللهجة المصرية البسيطة
- كوني ودودة ومساعدة
- اشرحي بوضوح ووضوح

🛒 للطلبات:
- اجمعي: الاسم، الهاتف، العنوان، المنتج، المقاس، اللون
- عند اكتمال البيانات: [CREATE_ORDER: البيانات]

📱 للتواصل:
- واتساب: 01032792040
- المتجر: /shop
- السلة: /cart',
    '',
    'gemini-1.5-flash',
    0.7,
    1000,
    true,
    true,
    true
) ON CONFLICT DO NOTHING;

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_whatsapp_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_ai_settings_updated_at
    BEFORE UPDATE ON whatsapp_ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_ai_settings_updated_at();

-- إضافة تعليقات للجدول والأعمدة
COMMENT ON TABLE whatsapp_ai_settings IS 'إعدادات الذكاء الاصطناعي لـ WhatsApp';
COMMENT ON COLUMN whatsapp_ai_settings.is_enabled IS 'تفعيل/إلغاء تفعيل الذكاء الاصطناعي';
COMMENT ON COLUMN whatsapp_ai_settings.use_existing_prompt IS 'استخدام البرومت الموجود أم المخصص';
COMMENT ON COLUMN whatsapp_ai_settings.custom_prompt IS 'البرومت المخصص لـ WhatsApp';
COMMENT ON COLUMN whatsapp_ai_settings.api_key IS 'مفتاح Gemini API';
COMMENT ON COLUMN whatsapp_ai_settings.model IS 'نموذج Gemini المستخدم';
COMMENT ON COLUMN whatsapp_ai_settings.temperature IS 'درجة الإبداع في الردود';
COMMENT ON COLUMN whatsapp_ai_settings.max_tokens IS 'الحد الأقصى لطول الرد';
COMMENT ON COLUMN whatsapp_ai_settings.can_access_orders IS 'السماح بالوصول للطلبات';
COMMENT ON COLUMN whatsapp_ai_settings.can_access_products IS 'السماح بالوصول للمنتجات';
COMMENT ON COLUMN whatsapp_ai_settings.auto_reply_enabled IS 'تفعيل الرد التلقائي';
