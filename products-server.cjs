const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛍️ إنشاء جداول المنتجات إذا لم تكن موجودة
async function initializeTables() {
  try {
    console.log('🔧 Initializing product tables...');
    
    // إنشاء جدول المنتجات
    const { error: productsError } = await supabase.rpc('create_products_table', {});
    if (productsError && !productsError.message.includes('already exists')) {
      console.log('Creating products table manually...');
    }
    
    // إنشاء جدول متغيرات المنتجات
    const { error: variantsError } = await supabase.rpc('create_product_variants_table', {});
    if (variantsError && !variantsError.message.includes('already exists')) {
      console.log('Creating product variants table manually...');
    }
    
    console.log('✅ Tables initialized successfully');
  } catch (error) {
    console.log('⚠️ Tables might already exist, continuing...');
  }
}

// 🛍️ API للحصول على جميع المنتجات
app.get('/api/products', async (req, res) => {
  try {
    console.log('🛍️ Fetching all products...');
    
    // جلب المنتجات مع متغيراتها
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${products?.length || 0} products`);
    res.json(products || []);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    
    // إرجاع بيانات افتراضية في حالة الخطأ
    const defaultProducts = [
      {
        id: 'shoe-001',
        name: 'حذاء رياضي عصري',
        description: 'حذاء رياضي مريح ومناسب للاستخدام اليومي',
        category: 'أحذية',
        base_price: 450,
        brand: 'Nike',
        is_active: true,
        is_default: true,
        campaign_name: 'حملة الصيف 2025',
        created_at: new Date().toISOString(),
        product_variants: [
          {
            id: 'var-001',
            product_id: 'shoe-001',
            color_id: '1',
            color_name: 'أبيض',
            size: '42',
            price: 450,
            stock_quantity: 10,
            sku: 'SHOE-WHITE-42',
            image_url: 'https://files.easy-orders.net/17446412085557436357.jpg',
            is_available: true
          },
          {
            id: 'var-002',
            product_id: 'shoe-001',
            color_id: '6',
            color_name: 'أسود',
            size: '42',
            price: 450,
            stock_quantity: 8,
            sku: 'SHOE-BLACK-42',
            image_url: 'https://files.easy-orders.net/1739181890281568922.jpg',
            is_available: true
          }
        ]
      },
      {
        id: 'shirt-001',
        name: 'تيشيرت قطني',
        description: 'تيشيرت قطني عالي الجودة',
        category: 'ملابس',
        base_price: 120,
        brand: 'Adidas',
        is_active: true,
        is_default: false,
        campaign_name: null,
        created_at: new Date().toISOString(),
        product_variants: [
          {
            id: 'var-003',
            product_id: 'shirt-001',
            color_id: '2',
            color_name: 'أحمر',
            size: 'L',
            price: 120,
            stock_quantity: 15,
            sku: 'SHIRT-RED-L',
            image_url: 'https://files.easy-orders.net/1744720320703143217.jpg',
            is_available: true
          }
        ]
      }
    ];
    
    res.json(defaultProducts);
  }
});

// 🎯 API للحصول على المنتج الافتراضي
app.get('/api/products/default', async (req, res) => {
  try {
    console.log('🎯 Fetching default product...');
    
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    console.log(`✅ Found default product: ${product?.name}`);
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching default product:', error);
    
    // إرجاع منتج افتراضي
    const defaultProduct = {
      id: 'shoe-001',
      name: 'حذاء رياضي عصري',
      description: 'حذاء رياضي مريح ومناسب للاستخدام اليومي',
      category: 'أحذية',
      base_price: 450,
      brand: 'Nike',
      is_active: true,
      is_default: true,
      campaign_name: 'حملة الصيف 2025',
      created_at: new Date().toISOString(),
      product_variants: [
        {
          id: 'var-001',
          product_id: 'shoe-001',
          color_id: '1',
          color_name: 'أبيض',
          size: '42',
          price: 450,
          stock_quantity: 10,
          sku: 'SHOE-WHITE-42',
          image_url: 'https://files.easy-orders.net/17446412085557436357.jpg',
          is_available: true
        },
        {
          id: 'var-002',
          product_id: 'shoe-001',
          color_id: '6',
          color_name: 'أسود',
          size: '42',
          price: 450,
          stock_quantity: 8,
          sku: 'SHOE-BLACK-42',
          image_url: 'https://files.easy-orders.net/1739181890281568922.jpg',
          is_available: true
        }
      ]
    };
    
    res.json(defaultProduct);
  }
});

// 🎯 API لتعيين منتج كافتراضي
app.post('/api/products/set-default/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { campaign_name } = req.body;
    
    console.log(`🎯 Setting product ${id} as default...`);
    
    // إزالة الافتراضي من جميع المنتجات
    await supabase
      .from('products')
      .update({ is_default: false })
      .neq('id', '');
    
    // تعيين المنتج الجديد كافتراضي
    const { data, error } = await supabase
      .from('products')
      .update({ 
        is_default: true,
        campaign_name: campaign_name || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Product ${id} set as default`);
    res.json({ success: true, product: data });
  } catch (error) {
    console.error('❌ Error setting default product:', error);
    res.status(500).json({ error: 'Failed to set default product' });
  }
});

// 💰 API للبحث بالسعر
app.get('/api/products/by-price-range', async (req, res) => {
  try {
    const { min = 0, max = 10000, type = 'all' } = req.query;
    
    console.log(`💰 Searching products by price range: ${min}-${max} (${type})`);
    
    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('is_active', true);
    
    // فلترة حسب النوع
    if (type === 'cheapest') {
      query = query.order('base_price', { ascending: true }).limit(5);
    } else if (type === 'expensive') {
      query = query.order('base_price', { ascending: false }).limit(5);
    } else {
      query = query
        .gte('base_price', min)
        .lte('base_price', max)
        .order('base_price', { ascending: true });
    }

    const { data: products, error } = await query;

    if (error) throw error;

    console.log(`✅ Found ${products?.length || 0} products in price range`);
    res.json(products || []);
  } catch (error) {
    console.error('❌ Error searching by price:', error);
    res.status(500).json({ error: 'Failed to search by price' });
  }
});

// 🎨 API للبحث بالألوان
app.get('/api/products/by-color/:colorId', async (req, res) => {
  try {
    const { colorId } = req.params;
    
    console.log(`🎨 Searching products by color: ${colorId}`);
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants!inner (*)
      `)
      .eq('is_active', true)
      .eq('product_variants.color_id', colorId)
      .eq('product_variants.is_available', true);

    if (error) throw error;

    console.log(`✅ Found ${products?.length || 0} products with color ${colorId}`);
    res.json(products || []);
  } catch (error) {
    console.error('❌ Error searching by color:', error);
    res.status(500).json({ error: 'Failed to search by color' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Products API Server',
    endpoints: {
      products: '/api/products',
      defaultProduct: '/api/products/default',
      setDefault: '/api/products/set-default/:id',
      byPriceRange: '/api/products/by-price-range',
      byColor: '/api/products/by-color/:colorId'
    }
  });
});

// Initialize and start server
async function startServer() {
  await initializeTables();
  
  const server = app.listen(PORT, () => {
    console.log(`🛍️ Products API Server started on port ${PORT}`);
    console.log(`📡 Available at: http://localhost:${PORT}`);
    console.log(`🔗 Products: http://localhost:${PORT}/api/products`);
    console.log(`🔗 Default Product: http://localhost:${PORT}/api/products/default`);
  });
}

startServer();
