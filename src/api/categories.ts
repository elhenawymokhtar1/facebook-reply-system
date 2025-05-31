import express from 'express';
import { supabase } from '../integrations/supabase/client';

const router = express.Router();

// جلب جميع الفئات مع الإحصائيات
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories_with_stats')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// جلب الفئات النشطة فقط
router.get('/active', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .rpc('get_active_categories');

    if (error) {
      console.error('Error fetching active categories:', error);
      return res.status(500).json({ error: 'Failed to fetch active categories' });
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Error in GET /categories/active:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// جلب فئة واحدة
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('categories_with_stats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({ error: 'Failed to fetch category' });
    }

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error in GET /categories/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// إضافة فئة جديدة
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, color, sort_order } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name) {
      return res.status(400).json({ 
        error: 'Missing required field: name' 
      });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon?.trim() || 'package',
      color: color?.trim() || 'blue',
      sort_order: parseInt(sort_order) || 0,
      is_active: true
    };

    const { data: category, error } = await supabase
      .from('product_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      if (error.code === '23505') { // unique constraint violation
        return res.status(400).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create category' });
    }

    console.log('✅ Category created:', category.name);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error in POST /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تحديث فئة
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, sort_order, is_active } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon.trim();
    if (color !== undefined) updateData.color = color.trim();
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: category, error } = await supabase
      .from('product_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'Failed to update category' });
    }

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    console.log('✅ Category updated:', category.name);
    res.json(category);
  } catch (error) {
    console.error('Error in PUT /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// حذف فئة
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // جلب اسم الفئة أولاً
    const { data: category, error: fetchError } = await supabase
      .from('product_categories')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // التحقق من إمكانية الحذف
    const { data: canDelete, error: checkError } = await supabase
      .rpc('can_delete_category', { category_name: category.name });

    if (checkError) {
      console.error('Error checking category deletion:', checkError);
      return res.status(500).json({ error: 'Failed to check category deletion' });
    }

    if (!canDelete) {
      return res.status(400).json({ 
        error: 'Cannot delete category. It has active products associated with it.' 
      });
    }

    // حذف الفئة
    const { error: deleteError } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return res.status(500).json({ error: 'Failed to delete category' });
    }

    console.log('✅ Category deleted:', category.name);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تفعيل/إلغاء تفعيل فئة
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    // جلب الحالة الحالية
    const { data: currentCategory, error: fetchError } = await supabase
      .from('product_categories')
      .select('is_active, name')
      .eq('id', id)
      .single();

    if (fetchError || !currentCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // تغيير الحالة
    const { data: category, error } = await supabase
      .from('product_categories')
      .update({ is_active: !currentCategory.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling category status:', error);
      return res.status(500).json({ error: 'Failed to toggle category status' });
    }

    console.log('✅ Category status toggled:', category.name, category.is_active);
    res.json(category);
  } catch (error) {
    console.error('Error in PATCH /categories/toggle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// تحديث ترتيب الفئات
router.put('/reorder', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Invalid categories data' });
    }

    // تحديث ترتيب كل فئة
    const updates = categories.map((cat, index) => 
      supabase
        .from('product_categories')
        .update({ sort_order: index + 1 })
        .eq('id', cat.id)
    );

    await Promise.all(updates);

    console.log('✅ Categories reordered successfully');
    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Error in PUT /categories/reorder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// البحث في الفئات
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const { data: categories, error } = await supabase
      .from('categories_with_stats')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error searching categories:', error);
      return res.status(500).json({ error: 'Failed to search categories' });
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Error in GET /categories/search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
