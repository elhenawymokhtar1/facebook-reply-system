-- إنشاء نظام المنتجات متعددة الخواص

-- 🎨 جدول خواص المنتجات (الألوان، المقاسات، إلخ)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- اسم الخاصية (اللون، المقاس، المادة)
    type VARCHAR(50) NOT NULL CHECK (type IN ('color', 'size', 'material', 'style', 'custom')),
    values TEXT[] NOT NULL, -- القيم المتاحة ['أحمر', 'أزرق', 'أخضر']
    is_required BOOLEAN DEFAULT false, -- هل الخاصية مطلوبة
    display_order INTEGER DEFAULT 0, -- ترتيب العرض
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📦 جدول متغيرات المنتجات (Product Variants)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES ecommerce_products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL, -- SKU فريد للمتغير
    name VARCHAR(255), -- اسم المتغير (اختياري)
    price DECIMAL(10,2), -- سعر مختلف (اختياري)
    sale_price DECIMAL(10,2), -- سعر الخصم (اختياري)
    stock_quantity INTEGER DEFAULT 0, -- مخزون المتغير
    weight DECIMAL(8,3), -- وزن مختلف (اختياري)
    image_url TEXT, -- صورة مختلفة (اختياري)
    is_active BOOLEAN DEFAULT true,
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

-- 📊 جدول تتبع المخزون للمتغيرات
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
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_variant_id ON variant_attribute_values(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_attribute_values_attribute_id ON variant_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_variant_stock_movements_variant_id ON variant_stock_movements(variant_id);

-- إدراج خواص افتراضية
INSERT INTO product_attributes (name, type, values, is_required, display_order) VALUES
('اللون', 'color', ARRAY['أحمر', 'أزرق', 'أخضر', 'أسود', 'أبيض', 'وردي', 'بنفسجي', 'برتقالي', 'أصفر', 'بني'], true, 1),
('المقاس', 'size', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], true, 2),
('المادة', 'material', ARRAY['قطن', 'بوليستر', 'جلد', 'حرير', 'صوف', 'دنيم', 'كتان', 'مخلوط'], false, 3),
('النمط', 'style', ARRAY['كلاسيكي', 'عصري', 'رياضي', 'كاجوال', 'رسمي', 'عتيق'], false, 4);

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
