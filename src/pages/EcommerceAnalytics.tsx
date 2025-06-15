import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Eye
} from 'lucide-react';

const EcommerceAnalytics = () => {
  const { 
    salesData,
    productData,
    customerData,
    orderData,
    isLoading,
    getDateRangeData,
    exportReport
  } = useAnalytics();
  
  const [dateRange, setDateRange] = useState('30'); // آخر 30 يوم
  const [reportType, setReportType] = useState('sales');

  // بيانات الإحصائيات الرئيسية
  const mainStats = [
    {
      title: 'إجمالي المبيعات',
      value: `${salesData?.totalRevenue || 0} ج`,
      change: salesData?.revenueChange || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'عدد الطلبات',
      value: orderData?.totalOrders || 0,
      change: orderData?.ordersChange || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'عدد العملاء',
      value: customerData?.totalCustomers || 0,
      change: customerData?.customersChange || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'المنتجات المباعة',
      value: productData?.totalSold || 0,
      change: productData?.soldChange || 0,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  // أفضل المنتجات مبيعاً
  const topProducts = productData?.topProducts || [];

  // أحدث الطلبات
  const recentOrders = orderData?.recentOrders || [];

  // بيانات المبيعات الشهرية
  const monthlySales = salesData?.monthlySales || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليلات المتجر الإلكتروني</h1>
          <p className="text-gray-600 mt-2">مراقبة أداء المتجر والمبيعات</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يوم</option>
            <option value="90">آخر 3 شهور</option>
            <option value="365">آخر سنة</option>
          </select>
          <Button 
            onClick={() => exportReport(reportType, dateRange)}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 ml-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(stat.change)}%
                    </span>
                    <span className="text-sm text-gray-500 mr-1">
                      مقارنة بالفترة السابقة
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* الرسم البياني للمبيعات */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                مبيعات آخر {dateRange} يوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">الرسم البياني للمبيعات</p>
                  <p className="text-sm text-gray-500">سيتم تطويره في المرحلة التالية</p>
                </div>
              </div>
              
              {/* بيانات المبيعات الشهرية */}
              <div className="mt-4 space-y-2">
                {monthlySales.slice(0, 5).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{month.month}</span>
                    <span className="text-sm text-green-600 font-semibold">{month.revenue} ج</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أفضل المنتجات */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                أفضل المنتجات مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.sold} مبيعة</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-600">
                          {product.revenue} ج
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">لا توجد بيانات مبيعات</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* أحدث الطلبات */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            أحدث الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-medium text-gray-600">رقم الطلب</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">العميل</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">المبلغ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">التاريخ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.slice(0, 10).map((order, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-blue-600">#{order.order_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">{order.total_amount} ج</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {order.status === 'pending' ? 'في الانتظار' :
                           order.status === 'processing' ? 'قيد المعالجة' :
                           order.status === 'shipped' ? 'تم الشحن' :
                           order.status === 'delivered' ? 'تم التوصيل' : order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">لا توجد طلبات حديثة</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              توزيع طرق الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">الدفع عند الاستلام</span>
                <span className="text-sm font-semibold">75%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">فودافون كاش</span>
                <span className="text-sm font-semibold">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">تحويل بنكي</span>
                <span className="text-sm font-semibold">5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              أوقات الذروة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">المساء (6-9 م)</span>
                <span className="text-sm font-semibold">40%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">بعد الظهر (12-3 م)</span>
                <span className="text-sm font-semibold">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الليل (9-12 م)</span>
                <span className="text-sm font-semibold">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الصباح (9-12 ص)</span>
                <span className="text-sm font-semibold">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              معدل النمو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">المبيعات الشهرية</span>
                <span className="text-sm font-semibold text-green-600">+15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">عدد العملاء</span>
                <span className="text-sm font-semibold text-green-600">+8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">متوسط قيمة الطلب</span>
                <span className="text-sm font-semibold text-green-600">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">معدل التحويل</span>
                <span className="text-sm font-semibold text-red-600">-2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EcommerceAnalytics;
