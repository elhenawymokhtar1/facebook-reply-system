import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/useOrders";
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById } = useOrders();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const data = await getOrderById(orderId);
        setOrderData(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, getOrderById]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'processing': return 'قيد المعالجة';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'paid': return 'مدفوع';
      case 'failed': return 'فشل';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cod': return 'الدفع عند الاستلام';
      case 'vodafone': return 'فودافون كاش';
      case 'bank': return 'تحويل بنكي';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              الطلب غير موجود
            </h3>
            <p className="text-gray-600 mb-6">
              لم يتم العثور على الطلب المطلوب
            </p>
            <Link to="/shop">
              <Button className="w-full">
                العودة للتسوق
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, items } = orderData;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/shop">
              <Button variant="outline" size="sm">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للتسوق
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تأكيد الطلب</h1>
              <p className="text-gray-600">
                رقم الطلب: {order.order_number}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* رسالة النجاح */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-800">
                  تم إنشاء طلبك بنجاح! 🎉
                </h2>
                <p className="text-green-700">
                  شكراً لك! سنتواصل معك قريباً لتأكيد الطلب وترتيب التوصيل.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* تفاصيل الطلب */}
          <div className="lg:col-span-2 space-y-6">
            {/* معلومات الطلب */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  معلومات الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">رقم الطلب</p>
                    <p className="font-semibold">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الطلب</p>
                    <p className="font-semibold">
                      {new Date(order.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">حالة الطلب</p>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">حالة الدفع</p>
                    <Badge className={getStatusColor(order.payment_status)}>
                      {getPaymentStatusText(order.payment_status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">طريقة الدفع</p>
                  <p className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {getPaymentMethodText(order.payment_method)}
                  </p>
                </div>

                {order.notes && (
                  <div>
                    <p className="text-sm text-gray-600">ملاحظات</p>
                    <p className="font-semibold">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معلومات العميل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  معلومات التوصيل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-gray-600">اسم المستلم</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.customer_phone}</p>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                  </div>
                </div>

                {order.customer_email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{order.customer_email}</p>
                      <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.customer_address}</p>
                    <p className="text-sm text-gray-600">عنوان التوصيل</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* المنتجات المطلوبة */}
            <Card>
              <CardHeader>
                <CardTitle>المنتجات المطلوبة ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          الكمية: {item.quantity} × {item.price} ج
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{item.total} ج</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ملخص الطلب والإجراءات */}
          <div className="space-y-6">
            {/* ملخص الطلب */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{order.subtotal} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>{order.tax_amount} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن:</span>
                    <span>{order.shipping_amount === 0 ? 'مجاني' : `${order.shipping_amount} ج`}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>الخصم:</span>
                      <span>-{order.discount_amount} ج</span>
                    </div>
                  )}
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-green-600">{order.total_amount} ج</span>
                </div>
              </CardContent>
            </Card>

            {/* الخطوات التالية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  الخطوات التالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                      1
                    </div>
                    <span>سنتواصل معك خلال ساعات لتأكيد الطلب</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">
                      2
                    </div>
                    <span>تحضير وتغليف الطلب</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">
                      3
                    </div>
                    <span>الشحن والتوصيل (2-3 أيام عمل)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إجراءات */}
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 ml-2" />
                تحميل فاتورة الطلب
              </Button>
              
              <Button className="w-full" variant="outline">
                <Share2 className="w-4 h-4 ml-2" />
                مشاركة تفاصيل الطلب
              </Button>

              <Link to="/shop" className="block">
                <Button className="w-full">
                  متابعة التسوق
                </Button>
              </Link>
            </div>

            {/* معلومات التواصل */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  هل تحتاج مساعدة؟
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  تواصل معنا لأي استفسار حول طلبك
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Phone className="w-4 h-4" />
                    <span>01032792040</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Mail className="w-4 h-4" />
                    <span>support@swanshop.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
