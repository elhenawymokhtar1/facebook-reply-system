import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

const OrdersManagement = () => {
  const {
    orders,
    isLoading,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    getOrdersStats,
    searchOrders
  } = useOrders();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const stats = getOrdersStats();
  const filteredOrders = searchOrders(searchTerm, statusFilter, paymentFilter);

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

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus({ orderId, status: newStatus as any });
  };

  const handlePaymentStatusChange = (orderId: string, newPaymentStatus: string) => {
    updatePaymentStatus({ orderId, paymentStatus: newPaymentStatus as any });
  };

  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    if (confirm(`هل أنت متأكد من حذف الطلب ${orderNumber}؟`)) {
      deleteOrder(orderId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-gray-600 mt-2">إدارة ومتابعة طلبات العملاء</p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">طلبات مكتملة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue} ج</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط قيمة الطلب</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageOrderValue} ج</p>
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
                  placeholder="البحث برقم الطلب أو اسم العميل أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">في الانتظار</option>
                <option value="processing">قيد المعالجة</option>
                <option value="shipped">تم الشحن</option>
                <option value="delivered">تم التوصيل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            <div className="md:w-48">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع حالات الدفع</option>
                <option value="pending">في الانتظار</option>
                <option value="paid">مدفوع</option>
                <option value="failed">فشل</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        طلب #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('ar-EG')} - 
                        {new Date(order.created_at).toLocaleTimeString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge className={getStatusColor(order.payment_status)}>
                      {getPaymentStatusText(order.payment_status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">العميل</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{order.customer_phone}</p>
                      <p className="text-sm text-gray-600">رقم الهاتف</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-green-600">{order.total_amount} ج</p>
                      <p className="text-sm text-gray-600">{getPaymentMethodText(order.payment_method)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">عنوان التوصيل:</p>
                    <p className="text-sm text-gray-600">{order.customer_address}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm"><strong>ملاحظات:</strong> {order.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        حالة الطلب:
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">في الانتظار</option>
                        <option value="processing">قيد المعالجة</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التوصيل</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        حالة الدفع:
                      </label>
                      <select
                        value={order.payment_status}
                        onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">في الانتظار</option>
                        <option value="paid">مدفوع</option>
                        <option value="failed">فشل</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>تفاصيل الطلب {order.order_number}</DialogTitle>
                          <DialogDescription>
                            عرض وتحديث تفاصيل الطلب
                          </DialogDescription>
                        </DialogHeader>
                        {selectedOrder && (
                          <OrderDetailsDialog
                            order={selectedOrder}
                            onStatusUpdate={handleStatusChange}
                            onPaymentStatusUpdate={handlePaymentStatusChange}
                            onClose={() => setSelectedOrder(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteOrder(order.id, order.order_number)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'لا توجد طلبات تطابق معايير البحث'
                  : 'لم يتم إنشاء أي طلبات بعد'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// مكون تفاصيل الطلب
const OrderDetailsDialog: React.FC<{
  order: any;
  onStatusUpdate: (orderId: string, status: string) => void;
  onPaymentStatusUpdate: (orderId: string, paymentStatus: string) => void;
  onClose: () => void;
}> = ({ order, onStatusUpdate, onPaymentStatusUpdate, onClose }) => {
  const [newStatus, setNewStatus] = useState(order.status || 'pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState(order.payment_status || 'pending');

  const handleStatusUpdate = () => {
    if (newStatus !== order.status) {
      onStatusUpdate(order.id, newStatus);
    }
    if (newPaymentStatus !== order.payment_status) {
      onPaymentStatusUpdate(order.id, newPaymentStatus);
    }
    onClose();
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'في الانتظار',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'في الانتظار',
      paid: 'مدفوع',
      failed: 'فشل الدفع',
      refunded: 'مسترد'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* معلومات العميل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>اسم العميل</Label>
          <Input value={order.customer_name || ''} readOnly />
        </div>
        <div>
          <Label>رقم الهاتف</Label>
          <Input value={order.customer_phone || ''} readOnly />
        </div>
      </div>

      <div>
        <Label>العنوان</Label>
        <Textarea value={order.customer_address || ''} readOnly />
      </div>

      {/* معلومات المنتج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>المنتج</Label>
          <Input value={order.product_name || ''} readOnly />
        </div>
        <div>
          <Label>المقاس</Label>
          <Input value={order.product_size || ''} readOnly />
        </div>
        <div>
          <Label>اللون</Label>
          <Input value={order.product_color || ''} readOnly />
        </div>
      </div>

      {/* معلومات الطلب */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>الكمية</Label>
          <Input value={order.quantity || 1} readOnly />
        </div>
        <div>
          <Label>سعر الوحدة</Label>
          <Input value={`${order.unit_price || 0} ج.م`} readOnly />
        </div>
        <div>
          <Label>المبلغ الإجمالي</Label>
          <Input value={`${order.total_amount || order.total_price || 0} ج.م`} readOnly />
        </div>
      </div>

      {/* تحديث الحالة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>حالة الطلب</Label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">في الانتظار</option>
            <option value="processing">قيد المعالجة</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التوصيل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
        <div>
          <Label>حالة الدفع</Label>
          <select
            value={newPaymentStatus}
            onChange={(e) => setNewPaymentStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">في الانتظار</option>
            <option value="paid">مدفوع</option>
            <option value="failed">فشل الدفع</option>
            <option value="refunded">مسترد</option>
          </select>
        </div>
      </div>

      {/* الملاحظات */}
      {order.notes && (
        <div>
          <Label>الملاحظات</Label>
          <Textarea value={order.notes} readOnly />
        </div>
      )}

      {/* معلومات التاريخ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>تاريخ الإنشاء</Label>
          <Input
            value={order.created_at ? new Date(order.created_at).toLocaleString('ar-EG') : ''}
            readOnly
          />
        </div>
        <div>
          <Label>آخر تحديث</Label>
          <Input
            value={order.updated_at ? new Date(order.updated_at).toLocaleString('ar-EG') : ''}
            readOnly
          />
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button onClick={handleStatusUpdate}>
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
};

export default OrdersManagement;
