-- إنشاء جدول إعدادات Facebook (دعم عدة صفحات)
CREATE TABLE IF NOT EXISTS facebook_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    page_name TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    page_category TEXT,
    page_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الردود الآلية
CREATE TABLE IF NOT EXISTS auto_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keywords TEXT[] NOT NULL,
    response_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للبحث في الكلمات المفتاحية
CREATE INDEX IF NOT EXISTS idx_auto_replies_keywords ON auto_replies USING GIN (keywords);

-- إنشاء فهرس للردود النشطة
CREATE INDEX IF NOT EXISTS idx_auto_replies_active ON auto_replies (is_active);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق trigger على جدول facebook_settings
CREATE TRIGGER update_facebook_settings_updated_at
    BEFORE UPDATE ON facebook_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- تطبيق trigger على جدول auto_replies
CREATE TRIGGER update_auto_replies_updated_at
    BEFORE UPDATE ON auto_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إنشاء جدول المحادثات (مع دعم عدة صفحات)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_facebook_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    page_id TEXT NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT false,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_facebook_id, page_id),
    FOREIGN KEY (page_id) REFERENCES facebook_settings(page_id) ON DELETE CASCADE
);

-- إنشاء جدول الرسائل (مع دعم عدة صفحات)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    page_id TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'bot')),
    content TEXT,
    image_url TEXT,
    is_auto_reply BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES facebook_settings(page_id) ON DELETE CASCADE
);

-- إنشاء جدول الطلبات (مع دعم عدة صفحات)
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    page_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    products JSONB NOT NULL,
    total_amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES facebook_settings(page_id) ON DELETE CASCADE
);

-- إضافة بعض البيانات التجريبية للردود الآلية
INSERT INTO auto_replies (keywords, response_text, is_active) VALUES
    (ARRAY['مرحبا', 'السلام عليكم', 'أهلا', 'هلا'], 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟ 😊', true),
    (ARRAY['الأسعار', 'كم السعر', 'التكلفة', 'كم يكلف'], 'يمكنك الاطلاع على أسعارنا من خلال الكتالوج المرفق، أو يمكنني مساعدتك في اختيار المنتج المناسب. 💰', true),
    (ARRAY['التوصيل', 'الشحن', 'كم يوم', 'متى يصل'], 'نقوم بالتوصيل خلال 2-3 أيام عمل داخل المدينة، و 5-7 أيام للمحافظات الأخرى. 🚚', true),
    (ARRAY['شكرا', 'شكراً', 'مشكور', 'يعطيك العافية'], 'العفو، نحن سعداء بخدمتك! إذا كان لديك أي استفسار آخر لا تتردد في التواصل معنا. 🙏', true),
    (ARRAY['أوقات العمل', 'متى تفتحون', 'ساعات العمل'], 'أوقات العمل من الأحد إلى الخميس من 9 صباحاً حتى 6 مساءً. الجمعة والسبت إجازة. 🕘', true);

-- إضافة triggers للجداول الجديدة
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_conversations_page_id ON conversations (page_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_facebook_id ON conversations (customer_facebook_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_page_id ON messages (page_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages (sender_type);

CREATE INDEX IF NOT EXISTS idx_orders_page_id ON orders (page_id);
CREATE INDEX IF NOT EXISTS idx_orders_conversation_id ON orders (conversation_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- إنشاء RLS (Row Level Security) policies
ALTER TABLE facebook_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة والكتابة للجميع (يمكن تخصيصها حسب الحاجة)
CREATE POLICY "Allow all operations on facebook_settings" ON facebook_settings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on auto_replies" ON auto_replies
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on conversations" ON conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on orders" ON orders
    FOR ALL USING (true) WITH CHECK (true);
