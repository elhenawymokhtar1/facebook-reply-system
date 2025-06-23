-- 📋 إدراج خطط الاشتراك الافتراضية
-- تاريخ الإنشاء: 22 يونيو 2025

-- ===================================
-- 🆓 الخطة المجانية (Starter)
-- ===================================
INSERT INTO subscription_plans (
    name, name_ar, description, description_ar,
    monthly_price, yearly_price,
    max_products, max_messages_per_month, max_images, max_active_conversations, max_users,
    features, display_order
) VALUES (
    'Starter', 'المبتدئ',
    'Perfect for small businesses just getting started with automated messaging',
    'مثالية للشركات الصغيرة التي تبدأ في استخدام الرسائل التلقائية',
    0.00, 0.00,
    10, 200, 50, 20, 1,
    '{
        "ai_responses": true,
        "image_sending": true,
        "basic_analytics": false,
        "custom_responses": false,
        "api_access": false,
        "priority_support": false,
        "backup": false,
        "advanced_analytics": false
    }',
    1
);

-- ===================================
-- 🥉 الخطة الأساسية (Basic)
-- ===================================
INSERT INTO subscription_plans (
    name, name_ar, description, description_ar,
    monthly_price, yearly_price,
    max_products, max_messages_per_month, max_images, max_active_conversations, max_users,
    features, display_order
) VALUES (
    'Basic', 'الأساسية',
    'Great for growing businesses that need more capacity and basic analytics',
    'رائعة للشركات النامية التي تحتاج سعة أكبر وتحليلات أساسية',
    19.00, 190.00,
    100, 2000, 500, 100, 3,
    '{
        "ai_responses": true,
        "image_sending": true,
        "basic_analytics": true,
        "custom_responses": true,
        "api_access": false,
        "priority_support": false,
        "backup": "daily",
        "advanced_analytics": false,
        "email_support": true
    }',
    2
);

-- ===================================
-- 🥈 الخطة المتقدمة (Professional)
-- ===================================
INSERT INTO subscription_plans (
    name, name_ar, description, description_ar,
    monthly_price, yearly_price,
    max_products, max_messages_per_month, max_images, max_active_conversations, max_users,
    features, display_order
) VALUES (
    'Professional', 'المتقدمة',
    'Perfect for established businesses with advanced needs and API integration',
    'مثالية للشركات الراسخة ذات الاحتياجات المتقدمة وتكامل API',
    49.00, 490.00,
    500, 10000, 2000, 500, 10,
    '{
        "ai_responses": true,
        "image_sending": true,
        "basic_analytics": true,
        "custom_responses": true,
        "api_access": true,
        "priority_support": true,
        "backup": "real_time",
        "advanced_analytics": true,
        "email_support": true,
        "phone_support": true,
        "custom_ai": true
    }',
    3
);

-- ===================================
-- 🥇 الخطة المؤسسية (Business)
-- ===================================
INSERT INTO subscription_plans (
    name, name_ar, description, description_ar,
    monthly_price, yearly_price,
    max_products, max_messages_per_month, max_images, max_active_conversations, max_users,
    features, display_order
) VALUES (
    'Business', 'المؤسسية',
    'Unlimited everything for large enterprises with dedicated support',
    'كل شيء غير محدود للمؤسسات الكبيرة مع دعم مخصص',
    99.00, 990.00,
    -1, -1, -1, -1, -1, -- -1 يعني غير محدود
    '{
        "ai_responses": true,
        "image_sending": true,
        "basic_analytics": true,
        "custom_responses": true,
        "api_access": true,
        "priority_support": true,
        "backup": "real_time_plus",
        "advanced_analytics": true,
        "email_support": true,
        "phone_support": true,
        "custom_ai": true,
        "dedicated_support": true,
        "custom_training": true,
        "unlimited": true
    }',
    4
);

-- ===================================
-- 📊 عرض الخطط المدرجة
-- ===================================
SELECT 
    name,
    name_ar,
    monthly_price,
    yearly_price,
    max_products,
    max_messages_per_month,
    display_order
FROM subscription_plans 
ORDER BY display_order;
