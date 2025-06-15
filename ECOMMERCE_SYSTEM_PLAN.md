# 🛍️ نظام المتجر الإلكتروني العام - خطة التطوير

## 🎯 **الهدف:**
تطوير منصة تجارة إلكترونية متكاملة مع الذكاء الاصطناعي مثل WooCommerce لكن بمميزات أكثر ذكاءً.

---

## 🏗️ **الهيكل الأساسي:**

### **📊 قاعدة البيانات:**

```sql
-- 🏪 جدول المتاجر (Multi-Store Support)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    owner_id UUID NOT NULL,
    domain VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📦 جدول المنتجات الرئيسي
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    weight DECIMAL(8,2),
    dimensions JSONB, -- {length, width, height}
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, draft
    type VARCHAR(20) DEFAULT 'simple', -- simple, variable, grouped
    featured BOOLEAN DEFAULT false,
    virtual BOOLEAN DEFAULT false,
    downloadable BOOLEAN DEFAULT false,
    manage_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    backorders VARCHAR(20) DEFAULT 'no', -- no, notify, yes
    sold_individually BOOLEAN DEFAULT false,
    purchase_note TEXT,
    menu_order INTEGER DEFAULT 0,
    reviews_allowed BOOLEAN DEFAULT true,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🎨 جدول متغيرات المنتجات (ألوان، مقاسات، إلخ)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions JSONB,
    image_url TEXT,
    attributes JSONB, -- {color: "أحمر", size: "L", material: "قطن"}
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🏷️ جدول الفئات
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔗 جدول ربط المنتجات بالفئات
CREATE TABLE product_categories (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- 🖼️ جدول صور المنتجات
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🏷️ جدول العلامات التجارية
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🛒 جدول سلة التسوق
CREATE TABLE cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- NULL للضيوف
    session_id VARCHAR(255), -- للضيوف
    store_id UUID REFERENCES stores(id),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📋 جدول الطلبات
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID, -- NULL للضيوف
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled, refunded
    currency VARCHAR(3) DEFAULT 'EGP',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
    notes TEXT,
    
    -- بيانات العميل
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- عنوان الشحن
    shipping_address JSONB, -- {street, city, state, postal_code, country}
    
    -- عنوان الفاتورة
    billing_address JSONB,
    
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📦 جدول عناصر الطلبات
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    variant_attributes JSONB, -- نسخة من attributes وقت الطلب
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🎫 جدول كوبونات الخصم
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- percentage, fixed_cart, fixed_product
    amount DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2),
    maximum_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_limit_per_customer INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ⭐ جدول التقييمات والمراجعات
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    user_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified BOOLEAN DEFAULT false, -- تم شراء المنتج فعلاً
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🚚 جدول طرق الشحن
CREATE TABLE shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL,
    free_shipping_threshold DECIMAL(10,2),
    estimated_days VARCHAR(50), -- "2-3 أيام"
    is_active BOOLEAN DEFAULT true,
    zones JSONB, -- المناطق المتاحة
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 💳 جدول طرق الدفع
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- cod, bank_transfer, vodafone_cash, instapay
    description TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 **المميزات الأساسية:**

### **🛍️ إدارة المنتجات:**
- ✅ منتجات بسيطة ومتغيرة
- ✅ إدارة المخزون التلقائية
- ✅ صور متعددة لكل منتج
- ✅ SEO محسن لكل منتج
- ✅ تقييمات ومراجعات

### **🛒 تجربة التسوق:**
- ✅ سلة تسوق ذكية
- ✅ نظام كوبونات متقدم
- ✅ حساب الشحن التلقائي
- ✅ طرق دفع متعددة
- ✅ تتبع الطلبات

### **🤖 الذكاء الاصطناعي:**
- ✅ مساعد تسوق ذكي
- ✅ توصيات منتجات
- ✅ بحث ذكي بالصوت والنص
- ✅ تحليل سلوك العملاء

---

## 🚀 **المرحلة الأولى - MVP:**

### **الأولويات:**
1. **📦 نظام المنتجات الأساسي**
2. **🛒 سلة التسوق**
3. **📋 إدارة الطلبات**
4. **🤖 تحسين Gemini AI للتسوق**
5. **💳 طرق الدفع الأساسية**

---

*هذا مخطط أولي شامل - سنطوره خطوة بخطوة! 🚀*
