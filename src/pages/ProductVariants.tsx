import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProductVariantsManager from "@/components/ProductVariantsManager";
import { 
  Package, 
  Search, 
  Filter,
  ShoppingBag,
  Palette,
  Ruler,
  Plus,
  BarChart3,
  Settings
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  brand: string;
  image_url?: string;
  status: string;
}

const ProductVariants: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error('خطأ في جلب المنتجات:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب المنتجات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // الحصول على الفئات الفريدة
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  // التحقق من وجود متغيرات للمنتج
  const hasVariants = (product: Product) => {
    return product.description?.includes('متوفر بالألوان') || 
           product.description?.includes('متوفر بالمقاسات');
  };

  // إحصائيات سريعة
  const stats = {
    totalProducts: products.length,
    variantProducts: products.filter(hasVariants).length,
    totalStock: products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0),
    activeProducts: products.filter(p => p.status === 'active').length
  };

  if (selectedProduct) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedProduct(null)}
            className="mb-4"
          >
            ← العودة للقائمة
          </Button>
        </div>
        
        <ProductVariantsManager 
          productId={selectedProduct.id}
          productName={selectedProduct.name}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          إدارة المنتجات متعددة الخواص
        </h1>
        <p className="text-gray-600">
          إدارة المنتجات بألوان ومقاسات ومواد مختلفة
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-gray-600">إجمالي المنتجات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Palette className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{stats.variantProducts}</p>
                <p className="text-gray-600">منتجات متعددة الخواص</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
                <p className="text-gray-600">إجمالي المخزون</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
                <p className="text-gray-600">منتجات نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والفلترة */}
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
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700">
              <Filter className="w-4 h-4 ml-2" />
              فلترة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المنتجات */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* صورة المنتج */}
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  {/* معلومات المنتج */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* الخواص والحالة */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{product.category}</Badge>
                    <Badge variant="outline">{product.brand}</Badge>
                    {hasVariants(product) && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Palette className="w-3 h-3 ml-1" />
                        متعدد الخواص
                      </Badge>
                    )}
                  </div>

                  {/* السعر والمخزون */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-green-600 text-lg">{product.price} ج</p>
                      <p className="text-sm text-gray-600">مخزون: {product.stock_quantity}</p>
                    </div>
                    <Badge className={product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {product.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      إدارة المتغيرات
                    </Button>
                    
                    {!hasVariants(product) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          toast({
                            title: "قريباً",
                            description: "سيتم إضافة ميزة تحويل المنتج لمتعدد الخواص",
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة متغيرات
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* رسالة عدم وجود منتجات */}
      {!isLoading && filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCategory !== 'all' 
                ? 'لا توجد منتجات تطابق معايير البحث'
                : 'لم يتم إضافة منتجات بعد'
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/ecommerce-products'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariants;
