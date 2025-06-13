-- إنشاء نظام إدارة الفئات

-- جدول الفئات
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- اسم الأيقونة
  color VARCHAR(20), -- لون الفئة للعرض
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- ترتيب العرض
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);

-- trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_categories_updated_at();

-- إدراج الفئات الافتراضية
INSERT INTO product_categories (name, description, icon, color, sort_order) VALUES
('رياضي', 'أحذية رياضية ومناسبة للتمارين والأنشطة الرياضية', 'activity', 'blue', 1),
('كلاسيك', 'أحذية كلاسيكية أنيقة مناسبة للمناسبات الرسمية', 'crown', 'purple', 2),
('كاجوال', 'أحذية كاجوال مريحة للاستخدام اليومي', 'coffee', 'green', 3),
('رسمي', 'أحذية رسمية فاخرة للمناسبات المهمة', 'briefcase', 'gray', 4),
('أطفال', 'أحذية مخصصة للأطفال بتصاميم مرحة وآمنة', 'baby', 'pink', 5),
('نسائي', 'أحذية نسائية بتصاميم عصرية وأنيقة', 'heart', 'rose', 6)
ON CONFLICT (name) DO NOTHING;

-- دالة للحصول على الفئات النشطة مرتبة
CREATE OR REPLACE FUNCTION get_active_categories()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER,
    products_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.name,
        pc.description,
        pc.icon,
        pc.color,
        pc.sort_order,
        COALESCE(COUNT(pb.id), 0) as products_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category = pc.name AND p.is_available = true
    WHERE pc.is_active = true
    GROUP BY pc.id, pc.name, pc.description, pc.icon, pc.color, pc.sort_order
    ORDER BY pc.sort_order, pc.name;
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من إمكانية حذف فئة
CREATE OR REPLACE FUNCTION can_delete_category(category_name VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
    products_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_count
    FROM products
    WHERE category = category_name AND is_available = true;
    
    RETURN products_count = 0;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث ترتيب الفئات
CREATE OR REPLACE FUNCTION update_categories_order(category_ids UUID[], new_orders INTEGER[])
RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
BEGIN
    -- التحقق من تطابق عدد المعرفات والترتيبات
    IF array_length(category_ids, 1) != array_length(new_orders, 1) THEN
        RETURN FALSE;
    END IF;
    
    -- تحديث الترتيب لكل فئة
    FOR i IN 1..array_length(category_ids, 1) LOOP
        UPDATE product_categories 
        SET sort_order = new_orders[i]
        WHERE id = category_ids[i];
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- view لعرض الفئات مع إحصائيات
CREATE OR REPLACE VIEW categories_with_stats AS
SELECT 
    pc.id,
    pc.name,
    pc.description,
    pc.icon,
    pc.color,
    pc.is_active,
    pc.sort_order,
    pc.created_at,
    pc.updated_at,
    COALESCE(COUNT(p.id), 0) as total_products,
    COALESCE(COUNT(CASE WHEN p.is_available = true THEN 1 END), 0) as active_products,
    0 as total_stock
FROM product_categories pc
LEFT JOIN products p ON p.category = pc.name
GROUP BY pc.id, pc.name, pc.description, pc.icon, pc.color, pc.is_active, pc.sort_order, pc.created_at, pc.updated_at
ORDER BY pc.sort_order, pc.name;

-- عرض النتائج
SELECT 
    name,
    description,
    icon,
    color,
    is_active,
    sort_order
FROM product_categories 
ORDER BY sort_order, name;
