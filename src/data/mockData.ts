// Mock data for testing
export const mockCategories = [
  { 
    id: '1', 
    name: 'ملابس حريمي', 
    description: 'ملابس نسائية عصرية', 
    icon: 'package', 
    color: 'blue', 
    is_active: true, 
    sort_order: 1 
  },
  { 
    id: '2', 
    name: 'ملابس رجالي', 
    description: 'ملابس رجالية أنيقة', 
    icon: 'package', 
    color: 'green', 
    is_active: true, 
    sort_order: 2 
  },
  { 
    id: '3', 
    name: 'أحذية', 
    description: 'أحذية متنوعة للجميع', 
    icon: 'package', 
    color: 'red', 
    is_active: true, 
    sort_order: 3 
  }
];

export const mockProducts = [
  {
    id: '1',
    name: 'حذاء رياضي أبيض',
    description: 'حذاء رياضي مريح للاستخدام اليومي مصنوع من مواد عالية الجودة',
    category: 'أحذية',
    base_price: 450,
    brand: 'Nike',
    created_at: new Date().toISOString(),
    variants: [
      { 
        id: '1', 
        product_id: '1',
        color: 'أبيض', 
        size: '40', 
        price: 450, 
        stock_quantity: 10, 
        image_url: 'https://via.placeholder.com/300x300/ffffff/000000?text=حذاء+أبيض+40' 
      },
      { 
        id: '2', 
        product_id: '1',
        color: 'أبيض', 
        size: '41', 
        price: 450, 
        stock_quantity: 8, 
        image_url: 'https://via.placeholder.com/300x300/ffffff/000000?text=حذاء+أبيض+41' 
      },
      { 
        id: '3', 
        product_id: '1',
        color: 'أسود', 
        size: '40', 
        price: 470, 
        stock_quantity: 5, 
        image_url: 'https://via.placeholder.com/300x300/000000/ffffff?text=حذاء+أسود+40' 
      },
      { 
        id: '4', 
        product_id: '1',
        color: 'أسود', 
        size: '41', 
        price: 470, 
        stock_quantity: 3, 
        image_url: 'https://via.placeholder.com/300x300/000000/ffffff?text=حذاء+أسود+41' 
      }
    ]
  }
];

// Mock API functions
let categoriesData = [...mockCategories];
let productsData = [...mockProducts];

export const mockAPI = {
  // Categories
  getCategories: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return categoriesData;
  },

  getActiveCategories: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return categoriesData.filter(cat => cat.is_active);
  },

  createCategory: async (categoryData: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newCategory = {
      id: String(categoriesData.length + 1),
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || '',
      icon: categoryData.icon?.trim() || 'package',
      color: categoryData.color?.trim() || 'blue',
      sort_order: parseInt(categoryData.sort_order) || categoriesData.length + 1,
      is_active: true
    };
    categoriesData.push(newCategory);
    return newCategory;
  },

  deleteCategory: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const index = categoriesData.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }
    categoriesData.splice(index, 1);
    return { message: 'Category deleted successfully' };
  },

  // Products
  getProducts: async () => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return productsData;
  },

  createProduct: async (productData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newProduct = {
      id: String(productsData.length + 1),
      name: productData.name.trim(),
      description: productData.description?.trim() || '',
      category: productData.category.trim(),
      base_price: parseFloat(productData.base_price),
      brand: productData.brand?.trim() || null,
      created_at: new Date().toISOString(),
      variants: productData.variants.map((variant: any, index: number) => ({
        id: String(Date.now() + index),
        product_id: String(productsData.length + 1),
        color: variant.color.trim(),
        size: variant.size.trim(),
        price: parseFloat(variant.price),
        stock_quantity: parseInt(variant.stock_quantity) || 0,
        image_url: variant.image_url?.trim() || null
      }))
    };
    productsData.push(newProduct);
    return newProduct;
  },

  deleteProduct: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const index = productsData.findIndex(prod => prod.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    productsData.splice(index, 1);
    return { message: 'Product deleted successfully' };
  }
};
