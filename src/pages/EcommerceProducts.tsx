import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Eye,
  Search,
  Filter,
  Star
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  status: string;
  featured: boolean;
  image_url?: string;
  category: string;
  brand: string;
  weight?: number;
  store_id?: string;
  created_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  sku: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

const EcommerceProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<{[key: string]: ProductVariant[]}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showVariants, setShowVariants] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  // بيانات المنتج الجديد
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    short_description: '',
    sku: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    category: '',
    brand: '',
    image_url: '',
    featured: false
  });

  // جلب المنتجات
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب المنتجات",
          variant: "destructive",
        });
        return;
      }

      setProducts(data || []);

      // جلب متغيرات المنتجات
      if (data && data.length > 0) {
        await fetchProductVariants(data.map(p => p.id));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب متغيرات المنتجات
  const fetchProductVariants = async (productIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds)
        .order('color, size');

      if (error) {
        console.error('Error fetching variants:', error);
        return;
      }

      // تجميع المتغيرات حسب معرف المنتج
      const variantsByProduct: {[key: string]: ProductVariant[]} = {};
      data?.forEach(variant => {
        if (!variantsByProduct[variant.product_id]) {
          variantsByProduct[variant.product_id] = [];
        }
        variantsByProduct[variant.product_id].push(variant);
      });

      setProductVariants(variantsByProduct);
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  // إضافة أو تحديث منتج
  const saveProduct = async () => {
    try {
      // التحقق من صحة البيانات
      if (!newProduct.name?.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم المنتج",
          variant: "destructive",
        });
        return;
      }

      if (!newProduct.price || isNaN(parseFloat(newProduct.price)) || parseFloat(newProduct.price) <= 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال سعر صحيح للمنتج",
          variant: "destructive",
        });
        return;
      }

      if (newProduct.sale_price && (isNaN(parseFloat(newProduct.sale_price)) || parseFloat(newProduct.sale_price) < 0)) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال سعر تخفيض صحيح",
          variant: "destructive",
        });
        return;
      }

      if (editingProduct) {
        // تحديث منتج موجود
        const updateData = {
          name: newProduct.name,
          description: newProduct.description,
          short_description: newProduct.short_description,
          sku: newProduct.sku,
          price: parseFloat(newProduct.price),
          sale_price: newProduct.sale_price ? parseFloat(newProduct.sale_price) : null,
          stock_quantity: newProduct.stock_quantity ? parseInt(newProduct.stock_quantity) : 0,
          category: newProduct.category,
          brand: newProduct.brand,
          image_url: newProduct.image_url,
          featured: newProduct.featured
        };

        const { error, data } = await supabase
          .from('ecommerce_products')
          .update(updateData)
          .eq('id', editingProduct.id)
          .select();

        if (error) {
          console.error('Error updating product:', error);
          toast({
            title: "خطأ",
            description: `فشل في تحديث المنتج: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "نجح",
          description: "تم تحديث المنتج بنجاح",
        });
      } else {
        // إضافة منتج جديد
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .limit(1);

        if (!stores || stores.length === 0) {
          toast({
            title: "خطأ",
            description: "لا يوجد متجر متاح",
            variant: "destructive",
          });
          return;
        }

        const productData = {
          store_id: stores[0].id,
          name: newProduct.name,
          description: newProduct.description,
          short_description: newProduct.short_description,
          sku: newProduct.sku || `SKU-${Date.now()}`,
          price: parseFloat(newProduct.price),
          sale_price: newProduct.sale_price ? parseFloat(newProduct.sale_price) : null,
          stock_quantity: parseInt(newProduct.stock_quantity) || 0,
          category: newProduct.category,
          brand: newProduct.brand,
          image_url: newProduct.image_url,
          featured: newProduct.featured,
          status: 'active'
        };

        const { error, data } = await supabase
          .from('ecommerce_products')
          .insert(productData)
          .select();

        if (error) {
          console.error('Error adding product:', error);
          toast({
            title: "خطأ",
            description: `فشل في إضافة المنتج: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "نجح",
          description: "تم إضافة المنتج بنجاح",
        });
      }

      resetForm();
      fetchProducts();

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ غير متوقع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        variant: "destructive",
      });
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      short_description: '',
      sku: '',
      price: '',
      sale_price: '',
      stock_quantity: '',
      category: '',
      brand: '',
      image_url: '',
      featured: false
    });
    setShowAddForm(false);
    setEditingProduct(null);
  };

  // دالة التعديل
  const handleEdit = (product: Product) => {
    setNewProduct({
      name: product.name,
      description: product.description || '',
      short_description: product.short_description || '',
      sku: product.sku,
      price: product.price.toString(),
      sale_price: product.sale_price ? product.sale_price.toString() : '',
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || '',
      brand: product.brand || '',
      image_url: product.image_url || '',
      featured: product.featured || false
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  // حذف منتج
  const deleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      const { error } = await supabase
        .from('ecommerce_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف المنتج",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "نجح",
        description: "تم حذف المنتج بنجاح",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // الحصول على الفئات الفريدة
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // تبديل عرض المتغيرات
  const toggleVariants = (productId: string) => {
    setShowVariants(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-gray-600 mt-2">إدارة منتجات المتجر الإلكتروني</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">منتجات مميزة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط السعر</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length > 0
                    ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
                    : 0
                  } ج
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المتغيرات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(productVariants).reduce((total, variants) => total + variants.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة منتج */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</CardTitle>
            <CardDescription>
              {editingProduct ? 'قم بتعديل بيانات المنتج' : 'املأ البيانات التالية لإضافة منتج جديد'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المنتج *
                </label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="اسم المنتج"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رمز المنتج (SKU)
                </label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  placeholder="SKU-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر *
                </label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سعر التخفيض
                </label>
                <Input
                  type="number"
                  value={newProduct.sale_price}
                  onChange={(e) => setNewProduct({...newProduct, sale_price: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكمية المتوفرة
                </label>
                <Input
                  type="number"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفئة
                </label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  placeholder="أحذية نسائية"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العلامة التجارية
                </label>
                <Input
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  placeholder="سوان شوب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط الصورة
                </label>
                <Input
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف المختصر
                </label>
                <Input
                  value={newProduct.short_description}
                  onChange={(e) => setNewProduct({...newProduct, short_description: e.target.value})}
                  placeholder="وصف مختصر للمنتج"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف التفصيلي
                </label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="وصف تفصيلي للمنتج"
                  rows={4}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.featured}
                    onChange={(e) => setNewProduct({...newProduct, featured: e.target.checked})}
                    className="ml-2"
                  />
                  منتج مميز
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={saveProduct} className="bg-green-600 hover:bg-green-700">
                {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة المنتجات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.image_url && (
              <div className="h-48 bg-gray-200">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                  {product.name}
                </h3>
                {product.featured && (
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                )}
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.short_description || product.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">
                    {product.sale_price || product.price} ج
                  </span>
                  {product.sale_price && (
                    <span className="text-sm text-gray-500 line-through">
                      {product.price} ج
                    </span>
                  )}
                </div>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status === 'active' ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>المخزون: {product.stock_quantity}</span>
                <span>SKU: {product.sku}</span>
              </div>

              {/* عرض المتغيرات إن وجدت */}
              {productVariants[product.id] && productVariants[product.id].length > 0 && (
                <div className="mb-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                    onClick={() => toggleVariants(product.id)}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    {showVariants[product.id] ? 'إخفاء' : 'عرض'} المتغيرات ({productVariants[product.id].length})
                  </Button>

                  {showVariants[product.id] && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">الألوان والمقاسات المتوفرة:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {productVariants[product.id].map((variant) => (
                          <div
                            key={variant.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="font-medium">{variant.color}</span>
                              <span className="text-gray-500"> - {variant.size}</span>
                            </div>
                            <span className={`text-xs ${variant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variant.stock_quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => deleteProduct(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'لا توجد منتجات تطابق البحث'
                : 'لم يتم إضافة أي منتجات بعد'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول منتج
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EcommerceProducts;