-- إنشاء نظام المنتجات مع المتغيرات (الألوان والمقاسات)

-- جدول المنتجات الأساسي (محدث)
CREATE TABLE IF NOT EXISTS products_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  brand VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول متغيرات المنتجات (الألوان والمقاسات)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products_base(id) ON DELETE CASCADE,
  color VARCHAR(100) NOT NULL,
  size VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- فهرس مركب لضمان عدم تكرار نفس اللون والمقاس لنفس المنتج
  UNIQUE(product_id, color, size)
);

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_products_base_category ON products_base(category);
CREATE INDEX IF NOT EXISTS idx_products_base_active ON products_base(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_available ON product_variants(is_available);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock_quantity);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق trigger على الجدولين
CREATE TRIGGER update_products_base_updated_at 
    BEFORE UPDATE ON products_base 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- دالة لإنشاء SKU تلقائياً
CREATE OR REPLACE FUNCTION generate_sku(product_name TEXT, color TEXT, size TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(
        SUBSTRING(REPLACE(product_name, ' ', ''), 1, 3) || '-' ||
        SUBSTRING(color, 1, 2) || '-' ||
        size
    );
END;
$$ LANGUAGE plpgsql;

-- view لعرض المنتجات مع متغيراتها
CREATE OR REPLACE VIEW products_with_variants AS
SELECT 
    pb.id as product_id,
    pb.name as product_name,
    pb.description,
    pb.category,
    pb.base_price,
    pb.brand,
    pb.is_active as product_active,
    pv.id as variant_id,
    pv.color,
    pv.size,
    pv.price as variant_price,
    pv.stock_quantity,
    pv.sku,
    pv.image_url,
    pv.is_available as variant_available,
    pb.created_at as product_created_at,
    pv.created_at as variant_created_at
FROM products_base pb
LEFT JOIN product_variants pv ON pb.id = pv.product_id
WHERE pb.is_active = true
ORDER BY pb.created_at DESC, pv.color, pv.size;

-- دالة للبحث في المنتجات بالألوان
CREATE OR REPLACE FUNCTION search_products_by_color(search_color TEXT)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    color VARCHAR(100),
    size VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INTEGER,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pwv.product_id,
        pwv.product_name,
        pwv.description,
        pwv.category,
        pwv.color,
        pwv.size,
        pwv.variant_price as price,
        pwv.stock_quantity,
        pwv.image_url
    FROM products_with_variants pwv
    WHERE pwv.color ILIKE '%' || search_color || '%'
    AND pwv.variant_available = true
    AND pwv.stock_quantity > 0
    ORDER BY pwv.variant_price;
END;
$$ LANGUAGE plpgsql;

-- دالة للبحث في المنتجات بالفئات
CREATE OR REPLACE FUNCTION search_products_by_category(search_category TEXT)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    color VARCHAR(100),
    size VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INTEGER,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pwv.product_id,
        pwv.product_name,
        pwv.description,
        pwv.category,
        pwv.color,
        pwv.size,
        pwv.variant_price as price,
        pwv.stock_quantity,
        pwv.image_url
    FROM products_with_variants pwv
    WHERE pwv.category ILIKE '%' || search_category || '%'
    AND pwv.variant_available = true
    AND pwv.stock_quantity > 0
    ORDER BY pwv.variant_price;
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية
INSERT INTO products_base (name, description, category, base_price, brand) VALUES
('حذاء رياضي عصري', 'حذاء رياضي مريح بتصميم عصري مناسب للاستخدام اليومي والرياضة', 'رياضي', 450.00, 'سبورت لايف'),
('حذاء كلاسيك أنيق', 'حذاء كلاسيك من الجلد الطبيعي مناسب للمناسبات الرسمية', 'كلاسيك', 750.00, 'إليجانت'),
('حذاء كاجوال مريح', 'حذاء كاجوال مريح للاستخدام اليومي بتصميم بسيط وأنيق', 'كاجوال', 320.00, 'كومفورت'),
('حذاء رسمي فاخر', 'حذاء رسمي فاخر من الجلد الإيطالي للمناسبات المهمة', 'رسمي', 950.00, 'لوكس')
ON CONFLICT DO NOTHING;

-- إدراج متغيرات المنتجات
DO $$
DECLARE
    product_record RECORD;
    colors TEXT[] := ARRAY['أبيض', 'أسود', 'أحمر', 'أزرق', 'بني'];
    sizes TEXT[] := ARRAY['39', '40', '41', '42', '43', '44', '45'];
    color TEXT;
    size TEXT;
    variant_price DECIMAL(10,2);
    stock_qty INTEGER;
    image_urls TEXT[] := ARRAY[
        'https://files.easy-orders.net/1744641208557436357.jpg',
        'https://files.easy-orders.net/1723117580290608498.jpg',
        'https://files.easy-orders.net/1744720320703143217.jpg',
        'https://files.easy-orders.net/1723117554054321721.jpg',
        'https://files.easy-orders.net/1739181695020677812.jpg'
    ];
BEGIN
    -- لكل منتج أساسي
    FOR product_record IN SELECT * FROM products_base LOOP
        -- لكل لون
        FOREACH color IN ARRAY colors LOOP
            -- لكل مقاس
            FOREACH size IN ARRAY sizes LOOP
                -- حساب السعر (السعر الأساسي + تعديل حسب اللون)
                variant_price := product_record.base_price;
                CASE color
                    WHEN 'أحمر' THEN variant_price := variant_price + 20;
                    WHEN 'أزرق' THEN variant_price := variant_price + 10;
                    WHEN 'بني' THEN variant_price := variant_price + 30;
                    ELSE variant_price := variant_price;
                END CASE;
                
                -- كمية عشوائية (0-10)
                stock_qty := floor(random() * 11)::INTEGER;
                
                -- إدراج المتغير
                INSERT INTO product_variants (
                    product_id, 
                    color, 
                    size, 
                    price, 
                    stock_quantity, 
                    sku,
                    image_url,
                    is_available
                ) VALUES (
                    product_record.id,
                    color,
                    size,
                    variant_price,
                    stock_qty,
                    generate_sku(product_record.name, color, size),
                    image_urls[1 + (array_position(colors, color) - 1) % array_length(image_urls, 1)],
                    stock_qty > 0
                ) ON CONFLICT (product_id, color, size) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- عرض النتائج
SELECT 
    product_name,
    color,
    size,
    price,
    stock_quantity,
    sku,
    CASE WHEN is_available THEN 'متاح' ELSE 'غير متاح' END as availability
FROM products_with_variants 
WHERE stock_quantity > 0
ORDER BY product_name, color, size::INTEGER
LIMIT 20;
