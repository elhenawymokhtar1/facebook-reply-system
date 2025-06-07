import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, Search, Palette, Ruler, ShoppingBag, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  sku: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  brand?: string;
  is_active: boolean;
  created_at: string;
  variants: ProductVariant[];
}

const ProductsVariantsFull = () => {
  // بيانات تجريبية للمنتجات
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'حذاء رياضي عصري',
      description: 'حذاء رياضي مريح ومناسب للاستخدام اليومي',
      category: 'أحذية',
      base_price: 450,
      brand: 'Nike',
      is_active: true,
      created_at: new Date().toISOString(),
      variants: [
        {
          id: '1-1',
          color: 'أبيض',
          size: '42',
          price: 450,
          stock_quantity: 10,
          sku: 'SHOE-WHITE-42',
          image_url: 'https://files.easy-orders.net/17446412085557436357.jpg',
          is_available: true,
          created_at: new Date().toISOString()
        },
        {
          id: '1-2',
          color: 'أسود',
          size: '42',
          price: 450,
          stock_quantity: 8,
          sku: 'SHOE-BLACK-42',
          image_url: 'https://files.easy-orders.net/1739181890281568922.jpg',
          is_available: true,
          created_at: new Date().toISOString()
        }
      ]
    },
    {
      id: '2',
      name: 'تيشيرت قطني',
      description: 'تيشيرت قطني عالي الجودة',
      category: 'ملابس',
      base_price: 120,
      brand: 'Adidas',
      is_active: true,
      created_at: new Date().toISOString(),
      variants: [
        {
          id: '2-1',
          color: 'أحمر',
          size: 'L',
          price: 120,
          stock_quantity: 15,
          sku: 'SHIRT-RED-L',
          image_url: 'https://files.easy-orders.net/1744720320703143217.jpg',
          is_available: true,
          created_at: new Date().toISOString()
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // دوال مساعدة
  const getAvailableColors = (variants: ProductVariant[]) => {
    return [...new Set(variants.map(v => v.color))];
  };

  const getMinPrice = (variants: ProductVariant[]) => {
    return Math.min(...variants.map(v => v.price));
  };

  const getMaxPrice = (variants: ProductVariant[]) => {
    return Math.max(...variants.map(v => v.price));
  };

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;

    let matchesColor = true;
    if (filterColor !== "all") {
      const availableColors = getAvailableColors(product.variants);
      matchesColor = availableColors.includes(filterColor);
    }

    return matchesSearch && matchesCategory && matchesColor;
  });

  const productCategories = [...new Set(products.map(p => p.category))];
  const allColors = [...new Set(products.flatMap(p => getAvailableColors(p.variants)))];

  const handleAddProduct = () => {
    toast.info('ميزة إضافة المنتجات ستكون متاحة قريباً');
  };

  const handleEdit = (product: Product) => {
    toast.info(`تعديل المنتج: ${product.name} - ستكون متاحة قريباً`);
  };

  const handleDelete = (id: string, name: string) => {
    toast.info(`حذف المنتج: ${name} - ستكون متاحة قريباً`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات والمتغيرات</h1>
          <p className="text-gray-600">إدارة المنتجات مع الألوان والمقاسات والمخزون</p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                المنتجات ({filteredProducts.length})
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 ml-2" />
                  إدارة الفئات
                </Button>
                <Button onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة منتج جديد
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {productCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الألوان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الألوان</SelectItem>
                  {allColors.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const availableColors = getAvailableColors(product.variants);
            const minPrice = getMinPrice(product.variants);
            const maxPrice = getMaxPrice(product.variants);
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);

            return (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                      <div className="flex items-center gap-2">
                        {minPrice === maxPrice ? (
                          <p className="text-xl font-bold text-green-600">{minPrice} ج</p>
                        ) : (
                          <p className="text-xl font-bold text-green-600">{minPrice} - {maxPrice} ج</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* الألوان المتاحة */}
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <div className="flex gap-1 flex-wrap">
                        {availableColors.map(color => (
                          <Badge key={color} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* المخزون */}
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {totalStock} قطعة في المخزون
                      </span>
                    </div>

                    {/* عدد المتغيرات */}
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {product.variants.length} متغير
                      </span>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة أول منتج</p>
            <Button onClick={handleAddProduct}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsVariantsFull;
