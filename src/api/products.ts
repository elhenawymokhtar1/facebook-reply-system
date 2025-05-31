import express from 'express';
import { supabase } from '../integrations/supabase/client';

const router = express.Router();

// إنشاء جدول المنتجات (يتم تشغيله مرة واحدة)
export const createProductsTable = async () => {
  try {
    const { error } = await supabase.rpc('create_products_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating products table:', error);
    } else {
      console.log('✅ Products table ready');
    }
  } catch (error) {
    console.error('Error in createProductsTable:', error);
  }
};

// جلب جميع المنتجات
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json(products || []);
  } catch (error) {
    console.error('Error in GET /products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// جلب المنتجات المتاحة فقط
router.get('/available', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching available products:', error);
      return res.status(500).json({ error: 'Failed to fetch available products' });
    }

    res.json(products || []);
  } catch (error) {
    console.error('Error in GET /products/available:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// البحث في المنتجات بالألوان
router.get('/search/color/:color', async (req, res) => {
  try {
    const { color } = req.params;
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('color', `%${color}%`)
      .eq('is_available', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error searching products by color:', error);
      return res.status(500).json({ error: 'Failed to search products' });
    }

    res.json(products || []);
  } catch (error) {
    console.error('Error in GET /products/search/color:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// البحث في المنتجات بالفئة
router.get('/search/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('category', `%${category}%`)
      .eq('is_available', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error searching products by category:', error);
      return res.status(500).json({ error: 'Failed to search products' });
    }

    res.json(products || []);
  } catch (error) {
    console.error('Error in GET /products/search/category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إضافة منتج جديد
router.post('/', async (req, res) => {
  try {
    const { name, price, description, color, category, image_url } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !price || !color || !category) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, price, color, category' 
      });
    }

    const productData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || '',
      color: color.trim(),
      category: category.trim(),
      image_url: image_url?.trim() || '',
      is_available: true,
      created_at: new Date().toISOString()
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    console.log('✅ Product created:', product.name);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error in POST /products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تحديث منتج
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, color, category, image_url, is_available } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description.trim();
    if (color !== undefined) updateData.color = color.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (is_available !== undefined) updateData.is_available = is_available;

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product updated:', product.name);
    res.json(product);
  } catch (error) {
    console.error('Error in PUT /products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// حذف منتج
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    console.log('✅ Product deleted:', id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تفعيل/إلغاء تفعيل منتج
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    // جلب الحالة الحالية
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('is_available')
      .eq('id', id)
      .single();

    if (fetchError || !currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // تغيير الحالة
    const { data: product, error } = await supabase
      .from('products')
      .update({ is_available: !currentProduct.is_available })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling product availability:', error);
      return res.status(500).json({ error: 'Failed to toggle product availability' });
    }

    console.log('✅ Product availability toggled:', product.name, product.is_available);
    res.json(product);
  } catch (error) {
    console.error('Error in PATCH /products/toggle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
