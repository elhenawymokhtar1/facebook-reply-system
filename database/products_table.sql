-- إنشاء جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  color VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- إنشاء function لإنشاء الجدول من الكود
CREATE OR REPLACE FUNCTION create_products_table()
RETURNS void AS $$
BEGIN
    -- الجدول موجود بالفعل من الكود أعلاه
    RAISE NOTICE 'Products table is ready';
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية للاختبار
INSERT INTO products (name, price, description, color, category, image_url) VALUES
('حذاء رياضي أبيض كلاسيك', 450.00, 'حذاء رياضي مريح للاستخدام اليومي، مصنوع من مواد عالية الجودة', 'أبيض', 'رياضي', 'https://example.com/white-sneaker-1.jpg'),
('حذاء رياضي أبيض عصري', 550.00, 'حذاء رياضي بتصميم عصري ومواد متطورة', 'أبيض', 'رياضي', 'https://example.com/white-sneaker-2.jpg'),
('حذاء كلاسيك أبيض رسمي', 750.00, 'حذاء كلاسيك أنيق مناسب للمناسبات الرسمية', 'أبيض', 'كلاسيك', 'https://example.com/white-classic-1.jpg'),
('حذاء كاجوال أبيض مريح', 320.00, 'حذاء كاجوال مريح للاستخدام اليومي', 'أبيض', 'كاجوال', 'https://example.com/white-casual-1.jpg'),
('حذاء رياضي أسود', 480.00, 'حذاء رياضي أسود أنيق ومريح', 'أسود', 'رياضي', 'https://example.com/black-sneaker-1.jpg'),
('حذاء كلاسيك بني', 680.00, 'حذاء كلاسيك بني من الجلد الطبيعي', 'بني', 'كلاسيك', 'https://example.com/brown-classic-1.jpg')
ON CONFLICT DO NOTHING;

-- عرض البيانات المدرجة
SELECT 
    name,
    price,
    color,
    category,
    is_available,
    created_at
FROM products 
ORDER BY created_at DESC;
