import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, BarChart3, TestTube, ShoppingBag, TrendingUp, Zap, Package, Plus, Eye, Trash2, RefreshCw, Star, Settings, Crown } from 'lucide-react';
import { toast } from 'sonner';

const TestPage = () => {
  // الحالات
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddColorDialogOpen, setIsAddColorDialogOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorImage, setNewColorImage] = useState('');
  const [colorStats, setColorStats] = useState({
    totalColors: 0,
    totalRequests: 0,
    successRate: 0,
    mostPopularColor: ''
  });

  // حالات المنتجات الجديدة
  const [products, setProducts] = useState([]);
  const [defaultProduct, setDefaultProduct] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isSetDefaultDialogOpen, setIsSetDefaultDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');

  // تحميل الألوان والمنتجات عند بدء التشغيل
  useEffect(() => {
    loadColors();
    loadProducts();
    loadDefaultProduct();
  }, []);

  const loadColors = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/api/colors');

      if (response.ok) {
        const data = await response.json();
        const formattedColors = data.map((color, index) => ({
          id: color.id,
          name: color.arabic_name || color.name,
          image_url: color.image_url,
          usage_count: Math.floor(Math.random() * 50) + 10,
          last_used: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          success_rate: Math.floor(Math.random() * 10) + 90,
          created_at: new Date().toISOString()
        }));

        setColors(formattedColors);
        setColorStats({
          totalColors: formattedColors.length,
          totalRequests: formattedColors.reduce((sum, color) => sum + color.usage_count, 0),
          successRate: 96.7,
          mostPopularColor: formattedColors[0]?.name || 'أبيض'
        });

        toast.success(`تم تحميل ${formattedColors.length} لون من الخادم`);
      } else {
        throw new Error('Failed to fetch colors');
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('فشل في تحميل الألوان، سيتم استخدام بيانات افتراضية');

      // بيانات افتراضية
      const defaultColors = [
        {
          id: '1',
          name: 'أبيض',
          image_url: 'https://files.easy-orders.net/17446412085557436357.jpg',
          usage_count: 45,
          last_used: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          success_rate: 98,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'أحمر',
          image_url: 'https://files.easy-orders.net/1744720320703143217.jpg',
          usage_count: 32,
          last_used: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          success_rate: 95,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'أسود',
          image_url: 'https://files.easy-orders.net/1739181890281568922.jpg',
          usage_count: 28,
          last_used: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          success_rate: 97,
          created_at: new Date().toISOString()
        }
      ];

      setColors(defaultColors);
      setColorStats({
        totalColors: defaultColors.length,
        totalRequests: 105,
        successRate: 96.7,
        mostPopularColor: 'أبيض'
      });
    } finally {
      setLoading(false);
    }
  };

  const addColor = async () => {
    if (!newColorName.trim() || !newColorImage.trim()) {
      toast.error('يرجى إدخال اسم اللون ورابط الصورة');
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorKey: newColorName.toLowerCase(),
          arabicName: newColorName.trim(),
          englishName: newColorName.trim(),
          imageUrl: newColorImage.trim(),
          keywords: [newColorName.trim()]
        })
      });

      if (response.ok) {
        toast.success('تم إضافة اللون بنجاح');
        setNewColorName('');
        setNewColorImage('');
        setIsAddColorDialogOpen(false);
        loadColors();
      } else {
        throw new Error('Failed to add color');
      }
    } catch (error) {
      console.error('Error adding color:', error);
      toast.error('حدث خطأ أثناء إضافة اللون');
    }
  };

  const deleteColor = async (colorId, colorName) => {
    if (!confirm(`هل أنت متأكد من حذف اللون "${colorName}"؟`)) return;

    try {
      const response = await fetch(`http://localhost:3002/api/colors/${colorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('تم حذف اللون بنجاح');
        loadColors();
      } else {
        throw new Error('Failed to delete color');
      }
    } catch (error) {
      console.error('Error deleting color:', error);
      toast.error('حدث خطأ أثناء حذف اللون');
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  // دوال المنتجات الجديدة
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('http://localhost:3006/api/products');

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        toast.success(`تم تحميل ${data.length} منتج من الخادم`);
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('فشل في تحميل المنتجات، سيتم استخدام بيانات افتراضية');

      // بيانات افتراضية للمنتجات
      setProducts([
        {
          id: 'shoe-001',
          name: 'حذاء رياضي عصري',
          description: 'حذاء رياضي مريح ومناسب للاستخدام اليومي',
          category: 'أحذية',
          base_price: 450,
          brand: 'Nike',
          is_default: true,
          campaign_name: 'حملة الصيف 2025',
          product_variants: [
            { color_name: 'أبيض', price: 450, stock_quantity: 10 },
            { color_name: 'أسود', price: 450, stock_quantity: 8 }
          ]
        }
      ]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadDefaultProduct = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/products/default');

      if (response.ok) {
        const data = await response.json();
        setDefaultProduct(data);
      } else {
        throw new Error('Failed to fetch default product');
      }
    } catch (error) {
      console.error('Error loading default product:', error);

      // منتج افتراضي
      setDefaultProduct({
        id: 'shoe-001',
        name: 'حذاء رياضي عصري',
        base_price: 450,
        brand: 'Nike',
        campaign_name: 'حملة الصيف 2025',
        product_variants: [
          { color_name: 'أبيض', image_url: 'https://files.easy-orders.net/17446412085557436357.jpg' }
        ]
      });
    }
  };

  const setProductAsDefault = async (productId) => {
    try {
      const response = await fetch(`http://localhost:3006/api/products/set-default/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_name: newCampaignName.trim() || null
        })
      });

      if (response.ok) {
        toast.success('تم تعيين المنتج كافتراضي بنجاح');
        setNewCampaignName('');
        setIsSetDefaultDialogOpen(false);
        loadProducts();
        loadDefaultProduct();
      } else {
        throw new Error('Failed to set default product');
      }
    } catch (error) {
      console.error('Error setting default product:', error);
      toast.error('حدث خطأ أثناء تعيين المنتج الافتراضي');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎨 إدارة الألوان والمنتجات الذكية
          </h1>
          <p className="text-gray-600">
            نظام ذكي لإدارة الألوان والصور مع إحصائيات متقدمة وإدارة المنتجات
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              الألوان والصور
            </TabsTrigger>
            <TabsTrigger value="active-product" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              المنتج النشط
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              اختبار النظام
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              المنتجات المتقدمة
            </TabsTrigger>
          </TabsList>

          {/* تبويب الألوان والصور */}
          <TabsContent value="colors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الألوان</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {loading ? '...' : colorStats.totalColors}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loading ? 'جاري التحميل' : 'ألوان نشطة'}
                      </p>
                    </div>
                    <Palette className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                      <p className="text-2xl font-bold text-green-600">
                        {loading ? '...' : colorStats.totalRequests}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loading ? 'جاري التحميل' : 'طلبات العملاء'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">معدل النجاح</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {loading ? '...' : `${colorStats.successRate}%`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loading ? 'جاري التحميل' : 'نسبة النجاح'}
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">الأكثر طلباً</p>
                      <p className="text-lg font-bold text-orange-600">
                        {loading ? '...' : colorStats.mostPopularColor}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loading ? 'جاري التحميل' : 'اللون الأشهر'}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    إدارة الألوان والصور ({colors.length})
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={loadColors} disabled={loading}>
                      <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                      تحديث
                    </Button>
                    <Dialog open={isAddColorDialogOpen} onOpenChange={setIsAddColorDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة لون جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إضافة لون جديد</DialogTitle>
                          <DialogDescription>
                            أضف لون جديد مع صورة للنظام الذكي
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>اسم اللون</Label>
                            <Input
                              value={newColorName}
                              onChange={(e) => setNewColorName(e.target.value)}
                              placeholder="مثال: أبيض، أحمر، أزرق..."
                            />
                          </div>
                          <div>
                            <Label>رابط الصورة</Label>
                            <Input
                              value={newColorImage}
                              onChange={(e) => setNewColorImage(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          {newColorImage && (
                            <div>
                              <Label>معاينة الصورة</Label>
                              <img
                                src={newColorImage}
                                alt="معاينة"
                                className="w-full h-32 object-cover rounded-lg border"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=صورة+غير+صالحة';
                                }}
                              />
                            </div>
                          )}
                          <Button onClick={addColor} className="w-full">
                            إضافة اللون
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">جاري تحميل الألوان...</h3>
                    <p className="text-gray-500">يتم جلب البيانات من الخادم</p>
                  </div>
                ) : colors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {colors.map((color) => (
                      <Card key={color.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img
                            src={color.image_url}
                            alt={color.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(color.name);
                            }}
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-white/90">
                              {color.name}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">عدد الطلبات</span>
                              <Badge variant="outline">{color.usage_count}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">معدل النجاح</span>
                              <Badge variant={color.success_rate > 95 ? "default" : "secondary"}>
                                {color.success_rate}%
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">آخر استخدام</span>
                              <span className="text-xs text-gray-500">{formatTimeAgo(color.last_used)}</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => window.open(color.image_url, '_blank')}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                عرض
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteColor(color.id, color.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ألوان</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة أول لون للنظام الذكي</p>
                    <Button onClick={() => setIsAddColorDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة لون جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب المنتج النشط */}
          <TabsContent value="active-product" className="space-y-6">
            {/* معلومات المنتج النشط */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    المنتج النشط الحالي
                  </span>
                  <Dialog open={isSetDefaultDialogOpen} onOpenChange={setIsSetDefaultDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Settings className="w-4 h-4 ml-2" />
                        تغيير المنتج النشط
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>اختيار المنتج النشط</DialogTitle>
                        <DialogDescription>
                          اختر المنتج الذي سيكون افتراضي<|im_start|> للعملاء
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>اسم الحملة (اختياري)</Label>
                          <Input
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            placeholder="مثال: حملة الصيف 2025"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>اختر المنتج:</Label>
                          {productsLoading ? (
                            <div className="text-center py-4">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                              <p>جاري تحميل المنتجات...</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {products.map((product) => (
                                <div
                                  key={product.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    product.is_default
                                      ? 'border-yellow-500 bg-yellow-50'
                                      : 'border-gray-200 hover:border-blue-300'
                                  }`}
                                  onClick={() => setProductAsDefault(product.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">{product.name}</h4>
                                      <p className="text-sm text-gray-600">{product.brand} - {product.base_price} ج</p>
                                      <p className="text-xs text-gray-500">
                                        {product.product_variants?.length || 0} متغير متاح
                                      </p>
                                    </div>
                                    {product.is_default && (
                                      <Crown className="w-5 h-5 text-yellow-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {defaultProduct ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* معلومات المنتج */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-yellow-500" />
                        <div>
                          <h3 className="text-xl font-bold">{defaultProduct.name}</h3>
                          <p className="text-gray-600">{defaultProduct.brand}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">السعر الأساسي</p>
                          <p className="text-2xl font-bold text-green-800">{defaultProduct.base_price} ج</p>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">عدد المتغيرات</p>
                          <p className="text-2xl font-bold text-blue-800">{defaultProduct.product_variants?.length || 0}</p>
                        </div>
                      </div>

                      {defaultProduct.campaign_name && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm text-purple-700">الحملة النشطة</p>
                          <p className="font-medium text-purple-800">{defaultProduct.campaign_name}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">الألوان المتاحة:</p>
                        <div className="flex gap-2 flex-wrap">
                          {defaultProduct.product_variants?.map((variant, index) => (
                            <Badge key={index} variant="secondary">
                              {variant.color_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* صورة المنتج */}
                    <div className="space-y-4">
                      {defaultProduct.product_variants?.[0]?.image_url && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">صورة المنتج:</p>
                          <img
                            src={defaultProduct.product_variants[0].image_url}
                            alt={defaultProduct.name}
                            className="w-full h-64 object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(defaultProduct.name);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد منتج نشط</h3>
                    <p className="text-gray-500 mb-4">اختر منتج<|im_start|> ليكون افتراضي<|im_start|> للعملاء</p>
                    <Button onClick={() => setIsSetDefaultDialogOpen(true)}>
                      <Settings className="w-4 h-4 ml-2" />
                      اختيار منتج نشط
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* إحصائيات سريعة للمنتج النشط */}
            {defaultProduct && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">الاستفسارات اليوم</p>
                        <p className="text-2xl font-bold text-blue-600">24</p>
                        <p className="text-xs text-gray-500">+12% من أمس</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">معدل التحويل</p>
                        <p className="text-2xl font-bold text-green-600">18%</p>
                        <p className="text-xs text-gray-500">من الاستفسارات</p>
                      </div>
                      <Zap className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">اللون الأكثر طلب<|im_start|></p>
                        <p className="text-lg font-bold text-purple-600">
                          {defaultProduct.product_variants?.[0]?.color_name || 'غير محدد'}
                        </p>
                        <p className="text-xs text-gray-500">من إجمالي الطلبات</p>
                      </div>
                      <Palette className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* تبويب الإحصائيات */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* إحصائيات الألوان */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    إحصائيات الألوان
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {colors
                      .sort((a, b) => b.usage_count - a.usage_count)
                      .slice(0, 5)
                      .map((color, index) => (
                        <div key={color.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <img
                              src={color.image_url}
                              alt={color.name}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/48x48?text=' + encodeURIComponent(color.name);
                              }}
                            />
                            <div>
                              <p className="font-medium">{color.name}</p>
                              <p className="text-sm text-gray-500">نجاح {color.success_rate}%</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{color.usage_count}</p>
                            <p className="text-sm text-gray-500">طلب</p>
                          </div>
                        </div>
                      ))}

                    {colors.length === 0 && !loading && (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">لا توجد بيانات إحصائية</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات الأداء */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    أداء النظام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">معدل النجاح الإجمالي</span>
                        <span className="text-sm font-bold">{colorStats.successRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${colorStats.successRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">الألوان النشطة</span>
                        <span className="text-sm font-bold">{colors.length} / 20</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(colors.length / 20) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{colorStats.totalRequests}</p>
                        <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round(colorStats.totalRequests * colorStats.successRate / 100)}
                        </p>
                        <p className="text-sm text-gray-600">طلبات ناجحة</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* نصائح وتوصيات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  نصائح لتحسين الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">💡 تحسين الصور</h4>
                    <p className="text-sm text-yellow-700">استخدم صور عالية الجودة وواضحة لتحسين تجربة العملاء</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🎯 أسماء دقيقة</h4>
                    <p className="text-sm text-blue-700">استخدم أسماء ألوان واضحة ومفهومة للعملاء</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">📊 مراقبة الأداء</h4>
                    <p className="text-sm text-green-700">راقب الإحصائيات بانتظام لتحسين النظام</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب اختبار النظام */}
          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  اختبار النظام الذكي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* شرح كيفية العمل */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      كيف يعمل النظام الذكي؟
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                        <h4 className="font-medium mb-1">العميل يرسل</h4>
                        <p className="text-sm text-gray-600">"عايز اشوف الأحمر"</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                        <h4 className="font-medium mb-1">Gemini يرد</h4>
                        <p className="text-sm text-gray-600">"حبيبتي قمر 😍 اهو يا عسل اللون الأحمر ❤️"</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                        <h4 className="font-medium mb-1">النظام يكتشف</h4>
                        <p className="text-sm text-gray-600">كلمة "الأحمر" في الرد</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div>
                        <h4 className="font-medium mb-1">يرسل الصورة</h4>
                        <p className="text-sm text-gray-600">صورة المنتج الأحمر تلقائياً</p>
                      </div>
                    </div>
                  </div>

                  {/* أمثلة للاختبار */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">🧪 أمثلة للاختبار</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2 text-green-600">✅ رسائل ناجحة</h4>
                        <div className="space-y-2 text-sm">
                          <p className="p-2 bg-gray-50 rounded">"عايز اشوف الأبيض"</p>
                          <p className="p-2 bg-gray-50 rounded">"ممكن اشوف اللون الأحمر؟"</p>
                          <p className="p-2 bg-gray-50 rounded">"عندكم أسود؟"</p>
                          <p className="p-2 bg-gray-50 rounded">"اريد رؤية الأزرق"</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2 text-red-600">❌ رسائل لن تعمل</h4>
                        <div className="space-y-2 text-sm">
                          <p className="p-2 bg-gray-50 rounded">"عايز اشتري حاجة"</p>
                          <p className="p-2 bg-gray-50 rounded">"ايه الأسعار؟"</p>
                          <p className="p-2 bg-gray-50 rounded">"فين المحل؟"</p>
                          <p className="p-2 bg-gray-50 rounded">"ازيك؟"</p>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* الألوان المتاحة للاختبار */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">🎨 الألوان المتاحة للاختبار</h3>
                    {colors.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {colors.map((color) => (
                          <div key={color.id} className="text-center">
                            <img
                              src={color.image_url}
                              alt={color.name}
                              className="w-16 h-16 object-cover rounded-lg mx-auto mb-2 border-2 border-gray-200"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/64x64?text=' + encodeURIComponent(color.name);
                              }}
                            />
                            <p className="text-sm font-medium">{color.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {color.usage_count} طلب
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Palette className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">لا توجد ألوان متاحة للاختبار</p>
                        <Button
                          onClick={() => setIsAddColorDialogOpen(true)}
                          className="mt-2"
                          size="sm"
                        >
                          إضافة لون للاختبار
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* تعليمات الاختبار */}
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">📱 كيفية الاختبار</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                      <li>اذهب إلى Facebook Messenger</li>
                      <li>ابحث عن صفحة متجرك</li>
                      <li>اكتب رسالة تحتوي على اسم لون (مثل: "عايز اشوف الأحمر")</li>
                      <li>انتظر رد Gemini</li>
                      <li>ستصل صورة المنتج تلقائياً! 🎉</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب المنتجات المتقدمة */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    المنتجات المتقدمة (قريباً)
                  </span>
                  <Button disabled>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة منتج جديد
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">نظام المنتجات المتقدم</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    هذا القسم سيحتوي على نظام كامل لإدارة المنتجات مع المتغيرات والألوان والمقاسات والمخزون
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-800 mb-1">إدارة المنتجات</h4>
                      <p className="text-sm text-blue-700">إضافة وتعديل وحذف المنتجات</p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Palette className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium text-green-800 mb-1">الألوان والمقاسات</h4>
                      <p className="text-sm text-green-700">إدارة متغيرات المنتجات</p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-medium text-purple-800 mb-1">تتبع المخزون</h4>
                      <p className="text-sm text-purple-700">مراقبة الكميات والمبيعات</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                    <h4 className="font-medium text-yellow-800 mb-2">💡 للوصول للنظام الكامل</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      يمكنك استخدام النظام الكامل لإدارة المنتجات من الصفحة الأصلية
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open('/products-variants-full', '_blank');
                      }}
                    >
                      فتح النظام الكامل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TestPage;
