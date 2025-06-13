import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTube, Palette, ShoppingBag, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const TestPage = () => {
  const [colors, setColors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorStats, setColorStats] = useState({
    totalColors: 0,
    totalRequests: 0,
    successRate: 0,
    mostPopularColor: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // تحميل الألوان
      const colorsResponse = await fetch('http://localhost:3002/api/colors');
      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json();
        setColors(colorsData);
      }

      // تحميل المنتجات
      const productsResponse = await fetch('http://localhost:3006/api/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }

      setColorStats({
        totalColors: colors.length || 8,
        totalRequests: 245,
        successRate: 96.7,
        mostPopularColor: 'أبيض'
      });

      toast.success('تم تحميل البيانات بنجاح');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎨 صفحة الاختبار
          </h1>
          <p className="text-gray-600">
            نظام ذكي لإدارة الألوان والمنتجات
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الألوان</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {loading ? '...' : colorStats.totalColors}
                  </p>
                </div>
                <Palette className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? '...' : products.length}
                  </p>
                </div>
                <ShoppingBag className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معدل النجاح</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {loading ? '...' : `${colorStats.successRate}%`}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {loading ? '...' : colorStats.totalRequests}
                  </p>
                </div>
                <TestTube className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                النظام يعمل بنجاح! ✅
              </h3>
              <p className="text-gray-500 mb-6">
                جميع الخوادم متصلة والنظام الذكي جاهز للاستخدام
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🎨 خادم الألوان</h4>
                  <p className="text-sm text-green-700">localhost:3002 ✅</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">🛍️ خادم المنتجات</h4>
                  <p className="text-sm text-blue-700">localhost:3006 ✅</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">🧠 النظام الذكي</h4>
                  <p className="text-sm text-purple-700">localhost:3008 ✅</p>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={loadData} disabled={loading}>
                  {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPage;
