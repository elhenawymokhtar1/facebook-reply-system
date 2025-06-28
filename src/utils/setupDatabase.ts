import { supabase } from '@/integrations/supabase/client';

// إنشاء جدول المنتجات وإدراج بيانات تجريبية
export const setupProductsTable = async () => {
  try {
    console.log('🔄 Setting up products table...');

    // إنشاء جدول المنتجات
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (createError) {
      console.error('Error creating products table:', createError);
      return false;
    }

    console.log('✅ Products table created successfully');

    // إدراج بيانات تجريبية
    const sampleProducts = [
      {
        name: 'حذاء رياضي أبيض كلاسيك',
        price: 450.00,
        description: 'حذاء رياضي مريح للاستخدام اليومي، مصنوع من مواد عالية الجودة',
        color: 'أبيض',
        category: 'رياضي',
        image_url: 'https://files.easy-orders.net/1744641208557436357.jpg'
      },
      {
        name: 'حذاء رياضي أبيض عصري',
        price: 550.00,
        description: 'حذاء رياضي بتصميم عصري ومواد متطورة',
        color: 'أبيض',
        category: 'رياضي',
        image_url: 'https://files.easy-orders.net/1744641208557436357.jpg'
      },
      {
        name: 'حذاء كلاسيك أبيض رسمي',
        price: 750.00,
        description: 'حذاء كلاسيك أنيق مناسب للمناسبات الرسمية',
        color: 'أبيض',
        category: 'كلاسيك',
        image_url: 'https://files.easy-orders.net/1744641208557436357.jpg'
      },
      {
        name: 'حذاء كاجوال أبيض مريح',
        price: 320.00,
        description: 'حذاء كاجوال مريح للاستخدام اليومي',
        color: 'أبيض',
        category: 'كاجوال',
        image_url: 'https://files.easy-orders.net/1744641208557436357.jpg'
      },
      {
        name: 'حذاء رياضي أسود أنيق',
        price: 480.00,
        description: 'حذاء رياضي أسود أنيق ومريح',
        color: 'أسود',
        category: 'رياضي',
        image_url: 'https://files.easy-orders.net/1723117580290608498.jpg'
      },
      {
        name: 'حذاء كلاسيك بني جلد',
        price: 680.00,
        description: 'حذاء كلاسيك بني من الجلد الطبيعي',
        color: 'بني',
        category: 'كلاسيك',
        image_url: 'https://files.easy-orders.net/1739181695020677812.jpg'
      },
      {
        name: 'حذاء رياضي أحمر جذاب',
        price: 520.00,
        description: 'حذاء رياضي أحمر بتصميم جذاب وعصري',
        color: 'أحمر',
        category: 'رياضي',
        image_url: 'https://files.easy-orders.net/1744720320703143217.jpg'
      },
      {
        name: 'حذاء رياضي أزرق مميز',
        price: 490.00,
        description: 'حذاء رياضي أزرق بتصميم مميز ومريح',
        color: 'أزرق',
        category: 'رياضي',
        image_url: 'https://files.easy-orders.net/1723117554054321721.jpg'
      }
    ];

    // التحقق من وجود منتجات مسبقاً
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing products:', checkError);
      return false;
    }

    if (existingProducts && existingProducts.length > 0) {
      console.log('✅ Products already exist, skipping sample data insertion');
      return true;
    }

    // إدراج البيانات التجريبية
    const { error: insertError } = await supabase
      .from('products')
      .insert(sampleProducts);

    if (insertError) {
      console.error('Error inserting sample products:', insertError);
      return false;
    }

    console.log('✅ Sample products inserted successfully');
    return true;

  } catch (error) {
    console.error('Error setting up products table:', error);
    return false;
  }
};



// إعداد نظام الفئات
export const setupCategoriesSystem = async () => {
  try {
    console.log('🔄 Setting up categories system...');

    // إنشاء جدول الفئات
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- جدول الفئات
        CREATE TABLE IF NOT EXISTS product_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(50),
          color VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
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

        -- view لعرض الفئات مع إحصائيات (مبسط)
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
      `
    });

    if (createError) {
      console.error('Error creating categories tables:', createError);
      return false;
    }

    console.log('✅ Categories tables created successfully');

    // التحقق من وجود فئات
    const { data: existingCategories, error: checkError } = await supabase
      .from('product_categories')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing categories:', checkError);
      return false;
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log('✅ Categories already exist');
      return true;
    }

    // إدراج الفئات الافتراضية
    const defaultCategories = [
      {
        name: 'رياضي',
        description: 'أحذية رياضية ومناسبة للتمارين والأنشطة الرياضية',
        icon: 'activity',
        color: 'blue',
        sort_order: 1
      },
      {
        name: 'كلاسيك',
        description: 'أحذية كلاسيكية أنيقة مناسبة للمناسبات الرسمية',
        icon: 'crown',
        color: 'purple',
        sort_order: 2
      },
      {
        name: 'كاجوال',
        description: 'أحذية كاجوال مريحة للاستخدام اليومي',
        icon: 'coffee',
        color: 'green',
        sort_order: 3
      },
      {
        name: 'رسمي',
        description: 'أحذية رسمية فاخرة للمناسبات المهمة',
        icon: 'briefcase',
        color: 'gray',
        sort_order: 4
      }
    ];

    const { error: insertError } = await supabase
      .from('product_categories')
      .insert(defaultCategories);

    if (insertError) {
      console.error('Error inserting default categories:', insertError);
      return false;
    }

    console.log('✅ Default categories inserted successfully');
    return true;

  } catch (error) {
    console.error('Error setting up categories system:', error);
    return false;
  }
};

// إعداد نظام المتجر الإلكتروني الجديد
export const setupEcommerceSystem = async () => {
  try {
    console.log('🛍️ Setting up E-commerce system...');

    // إنشاء جداول المتجر الإلكتروني
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- 🏪 جدول المتاجر
        CREATE TABLE IF NOT EXISTS stores (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            logo_url TEXT,
            banner_url TEXT,
            owner_email VARCHAR(255) NOT NULL,
            currency VARCHAR(3) DEFAULT 'EGP',
            is_active BOOLEAN DEFAULT true,
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 📦 جدول المنتجات الجديدة
        CREATE TABLE IF NOT EXISTS ecommerce_products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT,
            short_description TEXT,
            sku VARCHAR(100),
            price DECIMAL(10,2) NOT NULL,
            sale_price DECIMAL(10,2),
            stock_quantity INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            featured BOOLEAN DEFAULT false,
            image_url TEXT,
            category VARCHAR(100),
            brand VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(store_id, slug)
        );

        -- 🛒 جدول سلة التسوق
        CREATE TABLE IF NOT EXISTS ecommerce_cart (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            session_id VARCHAR(255),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            product_id UUID REFERENCES ecommerce_products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL DEFAULT 1,
            price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 📋 جدول الطلبات الجديدة
        CREATE TABLE IF NOT EXISTS ecommerce_orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            total_amount DECIMAL(10,2) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255),
            customer_phone VARCHAR(20),
            customer_address TEXT,
            payment_method VARCHAR(50),
            payment_status VARCHAR(20) DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 📦 جدول عناصر الطلبات
        CREATE TABLE IF NOT EXISTS ecommerce_order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
            product_id UUID REFERENCES ecommerce_products(id),
            product_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- إنشاء الفهارس
        CREATE INDEX IF NOT EXISTS idx_ecommerce_products_store ON ecommerce_products(store_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_products_status ON ecommerce_products(status);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_store ON ecommerce_orders(store_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_cart_session ON ecommerce_cart(session_id);

        -- 🎫 جدول الكوبونات
        CREATE TABLE IF NOT EXISTS coupons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            code VARCHAR(50) NOT NULL,
            description TEXT,
            type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_cart', 'fixed_product', 'free_shipping')),
            amount DECIMAL(10,2) NOT NULL,
            minimum_amount DECIMAL(10,2),
            usage_limit INTEGER,
            used_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(store_id, code)
        );

        -- 🚚 جدول طرق الشحن
        CREATE TABLE IF NOT EXISTS shipping_methods (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type VARCHAR(20) NOT NULL CHECK (type IN ('flat_rate', 'weight_based', 'distance_based', 'express', 'same_day')),
            base_cost DECIMAL(10,2) NOT NULL,
            cost_per_kg DECIMAL(10,2) DEFAULT 0,
            free_shipping_threshold DECIMAL(10,2),
            estimated_days_min INTEGER DEFAULT 1,
            estimated_days_max INTEGER DEFAULT 3,
            zones TEXT[], -- مصفوفة معرفات المناطق
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 🗺️ جدول مناطق الشحن
        CREATE TABLE IF NOT EXISTS shipping_zones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            cities TEXT[] NOT NULL, -- مصفوفة أسماء المدن
            additional_cost DECIMAL(10,2) DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- دالة تحديث المخزون
        CREATE OR REPLACE FUNCTION update_product_stock(product_id UUID, quantity_sold INTEGER)
        RETURNS VOID AS $$
        BEGIN
          UPDATE ecommerce_products
          SET stock_quantity = GREATEST(0, stock_quantity - quantity_sold)
          WHERE id = product_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (createError) {
      console.error('Error creating e-commerce tables:', createError);
      return false;
    }

    console.log('✅ E-commerce tables created successfully');

    // إنشاء متجر افتراضي
    await createDefaultStore();

    return true;

  } catch (error) {
    console.error('Error setting up e-commerce system:', error);
    return false;
  }
};

// إنشاء متجر افتراضي
const createDefaultStore = async () => {
  try {
    // التحقق من وجود متجر مسبقاً
    const { data: existingStores, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing stores:', checkError);
      return false;
    }

    if (existingStores && existingStores.length > 0) {
      console.log('✅ Default store already exists');
      return true;
    }

    // إنشاء متجر افتراضي
    const defaultStore = {
      name: 'سوان شوب',
      slug: 'swan-shop',
      description: 'متجر إلكتروني للأحذية النسائية العصرية',
      owner_email: 'admin@swanshop.com',
      currency: 'EGP',
      is_active: true,
      settings: {
        theme: 'default',
        language: 'ar',
        free_shipping_threshold: 500
      }
    };

    const { error: insertError } = await supabase
      .from('stores')
      .insert(defaultStore);

    if (insertError) {
      console.error('Error creating default store:', insertError);
      return false;
    }

    console.log('✅ Default store created successfully');
    return true;

  } catch (error) {
    console.error('Error creating default store:', error);
    return false;
  }
};



// دالة لتشغيل الإعداد
export const initializeDatabase = async () => {
  console.log('🚀 Initializing database...');

  // إعداد نظام المتجر الإلكتروني الجديد
  const ecommerceSuccess = await setupEcommerceSystem();

  // إعداد النظام القديم (للتوافق)
  const oldSystemSuccess = await setupProductsTable();

  // إعداد نظام الفئات
  const categoriesSuccess = await setupCategoriesSystem();

  if (ecommerceSuccess && oldSystemSuccess && categoriesSuccess) {
    console.log('🎉 Database initialization completed successfully!');
  } else {
    console.error('❌ Database initialization failed!');
  }

  return ecommerceSuccess && oldSystemSuccess && categoriesSuccess;
};
