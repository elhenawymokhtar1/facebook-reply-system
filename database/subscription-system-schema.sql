-- 🏢 نظام الاشتراكات للشركات - قاعدة البيانات
-- تاريخ الإنشاء: 22 يونيو 2025

-- ===================================
-- 📋 جدول خطط الاشتراك
-- ===================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- اسم الخطة
    name_ar VARCHAR(100) NOT NULL, -- الاسم بالعربية
    description TEXT, -- وصف الخطة
    description_ar TEXT, -- الوصف بالعربية
    
    -- 💰 التسعير
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- السعر الشهري
    yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- السعر السنوي
    
    -- 📊 حدود الاستخدام
    max_products INTEGER NOT NULL DEFAULT 0, -- عدد المنتجات المسموح
    max_messages_per_month INTEGER NOT NULL DEFAULT 0, -- عدد الرسائل شهرياً
    max_images INTEGER NOT NULL DEFAULT 0, -- عدد الصور المسموح
    max_active_conversations INTEGER NOT NULL DEFAULT 0, -- المحادثات النشطة
    max_users INTEGER NOT NULL DEFAULT 1, -- عدد المستخدمين
    
    -- 🎯 الميزات
    features JSONB DEFAULT '{}', -- الميزات المتاحة
    
    -- 📅 بيانات النظام
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- ترتيب العرض
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 🏢 جدول الشركات
-- ===================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 📋 بيانات الشركة
    name VARCHAR(255) NOT NULL, -- اسم الشركة
    email VARCHAR(255) UNIQUE NOT NULL, -- إيميل الشركة
    phone VARCHAR(50), -- رقم الهاتف
    website VARCHAR(255), -- الموقع الإلكتروني
    
    -- 📍 العنوان
    address TEXT, -- العنوان
    city VARCHAR(100), -- المدينة
    country VARCHAR(100) DEFAULT 'Egypt', -- الدولة
    
    -- 🔐 بيانات الحساب
    password_hash VARCHAR(255) NOT NULL, -- كلمة المرور مشفرة
    is_verified BOOLEAN DEFAULT false, -- تم التحقق من الإيميل
    verification_token VARCHAR(255), -- رمز التحقق
    
    -- 📊 حالة الحساب
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    
    -- 📅 بيانات النظام
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- ===================================
-- 👥 جدول مستخدمي الشركة
-- ===================================
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- 👤 بيانات المستخدم
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 🔑 الصلاحيات
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user
    permissions JSONB DEFAULT '{}', -- صلاحيات مخصصة
    
    -- 📊 حالة المستخدم
    is_active BOOLEAN DEFAULT true,
    
    -- 📅 بيانات النظام
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(company_id, email)
);

-- ===================================
-- 📋 جدول اشتراكات الشركات
-- ===================================
CREATE TABLE company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- 📅 فترة الاشتراك
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 💰 التسعير
    amount DECIMAL(10,2) NOT NULL, -- المبلغ المدفوع
    currency VARCHAR(3) DEFAULT 'USD', -- العملة
    
    -- 📊 حالة الاشتراك
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, suspended
    auto_renew BOOLEAN DEFAULT true, -- التجديد التلقائي
    
    -- 📅 بيانات النظام
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- ===================================
-- 📊 جدول تتبع الاستخدام
-- ===================================
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
    
    -- 📅 فترة التتبع
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 📊 إحصائيات الاستخدام
    messages_sent INTEGER DEFAULT 0, -- الرسائل المرسلة
    images_sent INTEGER DEFAULT 0, -- الصور المرسلة
    products_count INTEGER DEFAULT 0, -- عدد المنتجات
    active_conversations INTEGER DEFAULT 0, -- المحادثات النشطة
    api_calls INTEGER DEFAULT 0, -- استدعاءات API
    storage_used BIGINT DEFAULT 0, -- المساحة المستخدمة (بايت)
    
    -- 📅 بيانات النظام
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 💳 جدول المدفوعات
-- ===================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
    
    -- 💰 بيانات الدفع
    amount DECIMAL(10,2) NOT NULL, -- المبلغ
    currency VARCHAR(3) DEFAULT 'USD', -- العملة
    payment_method VARCHAR(50), -- طريقة الدفع
    
    -- 🔗 بيانات البوابة
    gateway VARCHAR(50), -- stripe, paypal, etc
    gateway_transaction_id VARCHAR(255), -- معرف المعاملة
    gateway_response JSONB, -- استجابة البوابة
    
    -- 📊 حالة الدفع
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    
    -- 📅 بيانات النظام
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ===================================
-- 🧾 جدول الفواتير
-- ===================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    
    -- 📋 بيانات الفاتورة
    invoice_number VARCHAR(100) UNIQUE NOT NULL, -- رقم الفاتورة
    amount DECIMAL(10,2) NOT NULL, -- المبلغ
    tax_amount DECIMAL(10,2) DEFAULT 0, -- الضريبة
    total_amount DECIMAL(10,2) NOT NULL, -- المبلغ الإجمالي
    currency VARCHAR(3) DEFAULT 'USD', -- العملة
    
    -- 📅 التواريخ
    issue_date DATE NOT NULL, -- تاريخ الإصدار
    due_date DATE NOT NULL, -- تاريخ الاستحقاق
    
    -- 📊 حالة الفاتورة
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    
    -- 📄 تفاصيل إضافية
    description TEXT, -- وصف الفاتورة
    notes TEXT, -- ملاحظات
    
    -- 📅 بيانات النظام
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 📊 إنشاء الفهارس للأداء
-- ===================================

-- فهارس الشركات
CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- فهارس المستخدمين
CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_company_users_email ON company_users(email);

-- فهارس الاشتراكات
CREATE INDEX idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX idx_company_subscriptions_end_date ON company_subscriptions(end_date);

-- فهارس تتبع الاستخدام
CREATE INDEX idx_usage_tracking_company_id ON usage_tracking(company_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- فهارس المدفوعات
CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- فهارس الفواتير
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
