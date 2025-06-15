-- إنشاء جداول المنتجات متعددة الخواص
-- يمكن تشغيل هذا الملف في Supabase Dashboard > SQL Editor

-- 🎨 جدول خواص المنتجات (الألوان، المقاسات، المواد، إلخ)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- اسم الخاصية (اللون، المقاس، المادة)
    type VARCHAR(50) NOT NULL CHECK (type IN ('color', 'size', 'material', 'style', 'custom')),
    values TEXT[] NOT NULL, -- القيم المتاحة ['أحمر', 'أزرق', 'أخضر']
    is_required BOOLEAN DEFAULT false, -- هل الخاصية مطلوبة
    display_order INTEGER DEFAULT 0, -- ترتيب العرض
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔗 جدول ربط المتغيرات بالخواص
CREATE TABLE IF NOT EXISTS variant_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL, -- القيمة المحددة (أحمر، كبير، قطن)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, attribute_id)
);

-- 📊 جدول تتبع المخزون للمتغيرات (اختياري)
CREATE TABLE IF NOT EXISTS variant_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id UUID, -- معرف الطلب أو العملية المرجعية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_product_attributes_type ON product_attributes(type);
CREATE INDEX IF NOT EXISTS idx_product_attributes_display_order ON product_attributes(display_order);
CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_variant_id ON variant_attribute_values(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_attribute_id ON variant_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_variant_stock_movements_variant_id ON variant_stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_stock_movements_type ON variant_stock_movements(type);

-- إدراج خواص افتراضية
INSERT INTO product_attributes (name, type, values, is_required, display_order) VALUES
('اللون', 'color', ARRAY['أحمر', 'أزرق', 'أخضر', 'أسود', 'أبيض', 'وردي', 'بنفسجي', 'برتقالي', 'أصفر', 'بني', 'رمادي', 'ذهبي', 'فضي'], true, 1),
('المقاس', 'size', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], true, 2),
('المادة', 'material', ARRAY['قطن', 'بوليستر', 'جلد', 'حرير', 'صوف', 'دنيم', 'كتان', 'مخلوط', 'نايلون', 'فيسكوز'], false, 3),
('النمط', 'style', ARRAY['كلاسيكي', 'عصري', 'رياضي', 'كاجوال', 'رسمي', 'عتيق', 'بوهيمي', 'مينيمال'], false, 4)
ON CONFLICT DO NOTHING;

-- إنشاء دالة للحصول على متغيرات المنتج مع خواصها
CREATE OR REPLACE FUNCTION get_product_variants_with_attributes(product_uuid UUID)
RETURNS TABLE (
    variant_id UUID,
    variant_sku VARCHAR,
    variant_name VARCHAR,
    variant_price DECIMAL,
    variant_sale_price DECIMAL,
    variant_stock INTEGER,
    variant_image TEXT,
    variant_is_active BOOLEAN,
    attributes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.id as variant_id,
        pv.sku as variant_sku,
        pv.name as variant_name,
        pv.price as variant_price,
        pv.sale_price as variant_sale_price,
        pv.stock_quantity as variant_stock,
        pv.image_url as variant_image,
        pv.is_active as variant_is_active,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'attribute_id', pa.id,
                    'attribute_name', pa.name,
                    'attribute_type', pa.type,
                    'value', vav.value
                )
            ) FILTER (WHERE pa.id IS NOT NULL),
            '[]'::jsonb
        ) as attributes
    FROM product_variants pv
    LEFT JOIN variant_attribute_values vav ON pv.id = vav.variant_id
    LEFT JOIN product_attributes pa ON vav.attribute_id = pa.id
    WHERE pv.product_id = product_uuid
    GROUP BY pv.id, pv.sku, pv.name, pv.price, pv.sale_price, pv.stock_quantity, pv.image_url, pv.is_active
    ORDER BY pv.created_at;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لحساب إجمالي مخزون المنتج
CREATE OR REPLACE FUNCTION get_product_total_stock(product_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_stock INTEGER;
BEGIN
    SELECT COALESCE(SUM(stock_quantity), 0) INTO total_stock
    FROM product_variants
    WHERE product_id = product_uuid AND is_active = true;
    
    RETURN total_stock;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة للبحث عن متغير بالخواص
CREATE OR REPLACE FUNCTION find_variant_by_attributes(
    product_uuid UUID,
    attributes_json JSONB
)
RETURNS UUID AS $$
DECLARE
    variant_uuid UUID;
    attr_key TEXT;
    attr_value TEXT;
    matching_variants UUID[];
BEGIN
    -- البحث عن المتغيرات التي تطابق جميع الخواص المطلوبة
    SELECT ARRAY_AGG(DISTINCT pv.id) INTO matching_variants
    FROM product_variants pv
    WHERE pv.product_id = product_uuid AND pv.is_active = true;
    
    -- فلترة المتغيرات حسب كل خاصية
    FOR attr_key, attr_value IN SELECT * FROM jsonb_each_text(attributes_json)
    LOOP
        SELECT ARRAY_AGG(pv.id) INTO matching_variants
        FROM product_variants pv
        JOIN variant_attribute_values vav ON pv.id = vav.variant_id
        JOIN product_attributes pa ON vav.attribute_id = pa.id
        WHERE pv.id = ANY(matching_variants)
        AND pa.name = attr_key
        AND vav.value = attr_value;
    END LOOP;
    
    -- إرجاع أول متغير مطابق
    IF array_length(matching_variants, 1) > 0 THEN
        variant_uuid := matching_variants[1];
    ELSE
        variant_uuid := NULL;
    END IF;
    
    RETURN variant_uuid;
END;
$$ LANGUAGE plpgsql;

-- إنشاء view لعرض المنتجات مع معلومات المتغيرات
CREATE OR REPLACE VIEW products_with_variants_summary AS
SELECT 
    p.*,
    COUNT(pv.id) as variants_count,
    SUM(pv.stock_quantity) as total_variant_stock,
    MIN(pv.price) as min_variant_price,
    MAX(pv.price) as max_variant_price,
    ARRAY_AGG(DISTINCT vav.value) FILTER (WHERE pa.type = 'color') as available_colors,
    ARRAY_AGG(DISTINCT vav.value) FILTER (WHERE pa.type = 'size') as available_sizes
FROM ecommerce_products p
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
LEFT JOIN variant_attribute_values vav ON pv.id = vav.variant_id
LEFT JOIN product_attributes pa ON vav.attribute_id = pa.id
GROUP BY p.id;

-- تعليق على الجداول والدوال
COMMENT ON TABLE product_attributes IS 'جدول خواص المنتجات (الألوان، المقاسات، المواد، إلخ)';
COMMENT ON TABLE variant_attribute_values IS 'جدول ربط المتغيرات بالخواص';
COMMENT ON TABLE variant_stock_movements IS 'جدول تتبع حركة المخزون للمتغيرات';
COMMENT ON FUNCTION get_product_variants_with_attributes(UUID) IS 'دالة للحصول على متغيرات المنتج مع خواصها';
COMMENT ON FUNCTION get_product_total_stock(UUID) IS 'دالة لحساب إجمالي مخزون المنتج من جميع المتغيرات';
COMMENT ON FUNCTION find_variant_by_attributes(UUID, JSONB) IS 'دالة للبحث عن متغير محدد بناءً على خواصه';
COMMENT ON VIEW products_with_variants_summary IS 'عرض شامل للمنتجات مع ملخص معلومات المتغيرات';

-- رسالة نجاح
SELECT 'تم إنشاء جداول المنتجات متعددة الخواص بنجاح! 🎉' as message;
