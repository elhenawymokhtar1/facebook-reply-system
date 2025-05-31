// Simple API server for testing
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3003; // منفذ مختلف

// Middleware
app.use(cors());
app.use(express.json());

// Test categories data
const categories = [
  { id: '1', name: 'ملابس حريمي', description: 'ملابس نسائية', icon: 'package', color: 'blue', is_active: true, sort_order: 1 },
  { id: '2', name: 'ملابس رجالي', description: 'ملابس رجالية', icon: 'package', color: 'green', is_active: true, sort_order: 2 },
  { id: '3', name: 'أحذية', description: 'أحذية متنوعة', icon: 'package', color: 'red', is_active: true, sort_order: 3 }
];

const products = [
  {
    id: '1',
    name: 'حذاء رياضي أبيض',
    description: 'حذاء رياضي مريح للاستخدام اليومي',
    category: 'أحذية',
    base_price: 450,
    brand: 'Nike',
    variants: [
      { id: '1', color: 'أبيض', size: '40', price: 450, stock_quantity: 10, image_url: '' },
      { id: '2', color: 'أبيض', size: '41', price: 450, stock_quantity: 8, image_url: '' },
      { id: '3', color: 'أسود', size: '40', price: 470, stock_quantity: 5, image_url: '' }
    ]
  }
];

// Categories API
app.get('/api/categories', (req, res) => {
  console.log('📋 Categories API called!');
  res.json(categories);
});

app.get('/api/categories/active', (req, res) => {
  console.log('📋 Active Categories API called!');
  const activeCategories = categories.filter(cat => cat.is_active);
  res.json(activeCategories);
});

app.post('/api/categories', (req, res) => {
  console.log('📋 Create Category API called!', req.body);
  const { name, description, icon, color, sort_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  const newCategory = {
    id: String(categories.length + 1),
    name: name.trim(),
    description: description?.trim() || '',
    icon: icon?.trim() || 'package',
    color: color?.trim() || 'blue',
    sort_order: parseInt(sort_order) || categories.length + 1,
    is_active: true
  };

  categories.push(newCategory);
  console.log('✅ Category created:', newCategory.name);
  res.status(201).json(newCategory);
});

app.delete('/api/categories/:id', (req, res) => {
  console.log('📋 Delete Category API called!', req.params.id);
  const { id } = req.params;

  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  categories.splice(index, 1);
  console.log('✅ Category deleted');
  res.json({ message: 'Category deleted successfully' });
});

// Products API
app.get('/api/products-variants', (req, res) => {
  console.log('📦 Products API called!');
  res.json(products);
});

app.post('/api/products-variants', (req, res) => {
  console.log('📦 Create Product API called!', req.body);
  const { name, description, category, base_price, brand, variants } = req.body;

  if (!name || !category || !base_price || !variants || variants.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields: name, category, base_price, variants'
    });
  }

  const newProduct = {
    id: String(products.length + 1),
    name: name.trim(),
    description: description?.trim() || '',
    category: category.trim(),
    base_price: parseFloat(base_price),
    brand: brand?.trim() || null,
    variants: variants.map((variant, index) => ({
      id: String(index + 1),
      color: variant.color.trim(),
      size: variant.size.trim(),
      price: parseFloat(variant.price),
      stock_quantity: parseInt(variant.stock_quantity) || 0,
      image_url: variant.image_url?.trim() || null
    }))
  };

  products.push(newProduct);
  console.log('✅ Product created:', newProduct.name);
  res.status(201).json(newProduct);
});

app.delete('/api/products-variants/:id', (req, res) => {
  console.log('📦 Delete Product API called!', req.params.id);
  const { id } = req.params;

  const index = products.findIndex(prod => prod.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(index, 1);
  console.log('✅ Product deleted');
  res.json({ message: 'Product deleted successfully' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Simple Products API',
    endpoints: {
      categories: '/api/categories',
      products: '/api/products-variants'
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`📋 Categories: http://localhost:${PORT}/api/categories`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products-variants`);
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
