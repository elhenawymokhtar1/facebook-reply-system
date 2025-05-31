import express from 'express';
import { supabase } from '../integrations/supabase/client';

const router = express.Router();

// جلب جميع المنتجات مع متغيراتها
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products_with_variants')
      .select('*')
      .order('product_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products with variants:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // تجميع المنتجات مع متغيراتها
    const groupedProducts = products?.reduce((acc, item) => {
      const productId = item.product_id;
      
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: item.product_name,
          description: item.description,
          category: item.category,
          base_price: item.base_price,
          brand: item.brand,
          is_active: item.product_active,
          created_at: item.product_created_at,
          variants: []
        };
      }

      if (item.variant_id) {
        acc[productId].variants.push({
          id: item.variant_id,
          color: item.color,
          size: item.size,
          price: item.variant_price,
          stock_quantity: item.stock_quantity,
          sku: item.sku,
          image_url: item.image_url,
          is_available: item.variant_available,
          created_at: item.variant_created_at
        });
      }

      return acc;
    }, {}) || {};

    const result = Object.values(groupedProducts);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// جلب منتج واحد مع متغيراته
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: productData, error } = await supabase
      .from('products_with_variants')
      .select('*')
      .eq('product_id', id);

    if (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }

    if (!productData || productData.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // تجميع البيانات
    const firstItem = productData[0];
    const product = {
      id: firstItem.product_id,
      name: firstItem.product_name,
      description: firstItem.description,
      category: firstItem.category,
      base_price: firstItem.base_price,
      brand: firstItem.brand,
      is_active: firstItem.product_active,
      created_at: firstItem.product_created_at,
      variants: productData
        .filter(item => item.variant_id)
        .map(item => ({
          id: item.variant_id,
          color: item.color,
          size: item.size,
          price: item.variant_price,
          stock_quantity: item.stock_quantity,
          sku: item.sku,
          image_url: item.image_url,
          is_available: item.variant_available,
          created_at: item.variant_created_at
        }))
    };

    res.json(product);
  } catch (error) {
    console.error('Error in GET /products-variants/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// البحث بالألوان
router.get('/search/color/:color', async (req, res) => {
  try {
    const { color } = req.params;
    
    const { data: results, error } = await supabase
      .rpc('search_products_by_color', { search_color: color });

    if (error) {
      console.error('Error searching by color:', error);
      return res.status(500).json({ error: 'Failed to search products' });
    }

    res.json(results || []);
  } catch (error) {
    console.error('Error in GET /products-variants/search/color:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// البحث بالفئات
router.get('/search/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const { data: results, error } = await supabase
      .rpc('search_products_by_category', { search_category: category });

    if (error) {
      console.error('Error searching by category:', error);
      return res.status(500).json({ error: 'Failed to search products' });
    }

    res.json(results || []);
  } catch (error) {
    console.error('Error in GET /products-variants/search/category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إضافة منتج جديد مع متغيراته
router.post('/', async (req, res) => {
  try {
    const { name, description, category, base_price, brand, variants } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !category || !base_price || !variants || variants.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, category, base_price, variants' 
      });
    }

    // إضافة المنتج الأساسي
    const { data: product, error: productError } = await supabase
      .from('products_base')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        category: category.trim(),
        base_price: parseFloat(base_price),
        brand: brand?.trim() || null
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    // إضافة المتغيرات
    const variantsToInsert = variants.map((variant: any) => ({
      product_id: product.id,
      color: variant.color.trim(),
      size: variant.size.trim(),
      price: parseFloat(variant.price),
      stock_quantity: parseInt(variant.stock_quantity) || 0,
      image_url: variant.image_url?.trim() || '',
      is_available: variant.stock_quantity > 0
    }));

    const { data: insertedVariants, error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select();

    if (variantsError) {
      console.error('Error creating variants:', variantsError);
      // حذف المنتج إذا فشل إنشاء المتغيرات
      await supabase.from('products_base').delete().eq('id', product.id);
      return res.status(500).json({ error: 'Failed to create product variants' });
    }

    console.log('✅ Product created with variants:', product.name);
    res.status(201).json({
      ...product,
      variants: insertedVariants
    });
  } catch (error) {
    console.error('Error in POST /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تحديث منتج
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, base_price, brand } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (base_price !== undefined) updateData.base_price = parseFloat(base_price);
    if (brand !== undefined) updateData.brand = brand?.trim() || null;

    const { data: product, error } = await supabase
      .from('products_base')
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
    console.error('Error in PUT /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إضافة متغير جديد لمنتج موجود
router.post('/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const { color, size, price, stock_quantity, image_url } = req.body;

    if (!color || !size || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: color, size, price' 
      });
    }

    const variantData = {
      product_id: id,
      color: color.trim(),
      size: size.trim(),
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity) || 0,
      image_url: image_url?.trim() || '',
      is_available: (parseInt(stock_quantity) || 0) > 0
    };

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert(variantData)
      .select()
      .single();

    if (error) {
      console.error('Error creating variant:', error);
      return res.status(500).json({ error: 'Failed to create variant' });
    }

    console.log('✅ Variant created:', `${color} ${size}`);
    res.status(201).json(variant);
  } catch (error) {
    console.error('Error in POST /products-variants/:id/variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تحديث متغير
router.put('/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;
    const { color, size, price, stock_quantity, image_url, is_available } = req.body;

    const updateData: any = {};
    if (color !== undefined) updateData.color = color.trim();
    if (size !== undefined) updateData.size = size.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock_quantity !== undefined) {
      updateData.stock_quantity = parseInt(stock_quantity);
      updateData.is_available = parseInt(stock_quantity) > 0;
    }
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (is_available !== undefined) updateData.is_available = is_available;

    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant:', error);
      return res.status(500).json({ error: 'Failed to update variant' });
    }

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    console.log('✅ Variant updated:', `${variant.color} ${variant.size}`);
    res.json(variant);
  } catch (error) {
    console.error('Error in PUT /products-variants/variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// حذف متغير
router.delete('/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) {
      console.error('Error deleting variant:', error);
      return res.status(500).json({ error: 'Failed to delete variant' });
    }

    console.log('✅ Variant deleted:', variantId);
    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /products-variants/variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// حذف منتج (مع جميع متغيراته)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products_base')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    console.log('✅ Product deleted:', id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /products-variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
