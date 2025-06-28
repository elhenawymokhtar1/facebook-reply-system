import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderService, OrderData } from '@/services/orderService';
import { useOrders } from '@/hooks/useOrders';
import { Package, Phone, MapPin, Calendar, DollarSign, Eye, Edit, Truck } from 'lucide-react';
import { toast } from 'sonner';

const Orders: React.FC = () => {
  console.log('📦 Orders component rendered!');

  const { orders, isLoading: loading, refetch } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  console.log('📊 Orders data:', {
    ordersCount: orders?.length || 0,
    loading,
    orders: orders?.map(o => ({ order_number: o.order_number, company_id: o.company_id })) || []
  });

  // تحديث حالة الطلب
  const updateOrderStatus = async (orderId: string, newStatus: OrderData['status']) => {
    try {
      const success = await OrderService.updateOrderStatus(orderId, newStatus);
      if (success) {
        toast.success('تم تحديث حالة الطلب بنجاح');
        refetch(); // إعادة تحميل الطلبات
      } else {
        toast.error('فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطأ في تحديث حالة الطلب');
    }
  };

  // فلترة الطلبات حسب الحالة
  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  // ألوان الحالات
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ترجمة الحالات
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع طلبات العملاء</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="فلترة حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطلبات</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="processing">قيد التجهيز</SelectItem>
              <SelectItem value="shipped">تم الشحن</SelectItem>
              <SelectItem value="delivered">تم التسليم</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()}>
            تحديث
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-red-500">DEBUG: {JSON.stringify({ordersLength: orders.length, filteredLength: filteredOrders.length})}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">تم الشحن</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'shipped').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold">{orders.reduce((sum, o) => sum + (o.total_price || 0), 0)} ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
          <CardDescription>
            {filteredOrders.length} طلب من أصل {orders.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customer_phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{order.product_name || 'غير محدد'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.product_size || order.product_color ?
                          `${order.product_size ? `مقاس ${order.product_size}` : ''} ${order.product_size && order.product_color ? ' - ' : ''} ${order.product_color || ''}`
                          : 'غير محدد'
                        }
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{order.total_amount} ج.م</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status || 'pending')}>
                      {getStatusText(order.status || 'pending')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at || '').toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
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
                              onStatusUpdate={updateOrderStatus}
                              onClose={() => setSelectedOrder(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// مكون تفاصيل الطلب
const OrderDetailsDialog: React.FC<{
  order: OrderData;
  onStatusUpdate: (orderId: string, status: OrderData['status']) => void;
  onClose: () => void;
}> = ({ order, onStatusUpdate, onClose }) => {
  const [newStatus, setNewStatus] = useState(order.status || 'pending');

  const handleStatusUpdate = () => {
    if (order.id && newStatus !== order.status) {
      onStatusUpdate(order.id, newStatus);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* معلومات العميل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>اسم العميل</Label>
          <Input value={order.customer_name} readOnly />
        </div>
        <div>
          <Label>رقم الهاتف</Label>
          <Input value={order.customer_phone} readOnly />
        </div>
      </div>
      
      <div>
        <Label>العنوان</Label>
        <Textarea value={order.customer_address} readOnly />
      </div>

      {/* معلومات المنتج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>المنتج</Label>
          <Input value={order.product_name || 'غير محدد'} readOnly />
        </div>
        <div>
          <Label>المقاس</Label>
          <Input value={order.product_size || 'غير محدد'} readOnly />
        </div>
        <div>
          <Label>اللون</Label>
          <Input value={order.product_color || 'غير محدد'} readOnly />
        </div>
      </div>

      {/* معلومات السعر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>سعر المنتج</Label>
          <Input value={`${order.unit_price} ج.م`} readOnly />
        </div>
        <div>
          <Label>تكلفة الشحن</Label>
          <Input value={`${order.shipping_cost} ج.م`} readOnly />
        </div>
        <div>
          <Label>الإجمالي</Label>
          <Input value={`${order.total_price} ج.م`} readOnly className="font-bold" />
        </div>
      </div>

      {/* تحديث الحالة */}
      <div className="space-y-4">
        <Label>حالة الطلب</Label>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">في الانتظار</SelectItem>
            <SelectItem value="confirmed">مؤكد</SelectItem>
            <SelectItem value="processing">قيد التجهيز</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="delivered">تم التسليم</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
        
        {newStatus !== order.status && (
          <Button onClick={handleStatusUpdate} className="w-full">
            تحديث حالة الطلب
          </Button>
        )}
      </div>

      {/* ملاحظات */}
      {order.notes && (
        <div>
          <Label>ملاحظات</Label>
          <Textarea value={order.notes} readOnly />
        </div>
      )}
    </div>
  );
};

export default Orders;
