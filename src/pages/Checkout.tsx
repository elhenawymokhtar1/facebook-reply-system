import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Package,
  Truck,
  CheckCircle,
  ArrowRight,
  Wallet,
  Building
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  description: string;
}

const Checkout = () => {
  const { cartItems, getCartSummary, clearCart } = useCart();
  const { createOrder, isCreating } = useOrders();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: معلومات العميل, 2: الدفع, 3: تأكيد
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  const summary = getCartSummary();

  // دعم الكوبونات (يمكن تمريرها من السلة)
  const appliedCoupon = null; // سيتم تطويرها لاحقاً
  const discount = 0;
  const finalTotal = summary.total - discount;

  // طرق الدفع المتاحة
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cod',
      name: 'الدفع عند الاستلام',
      type: 'cash_on_delivery',
      icon: <Package className="w-5 h-5" />,
      description: 'ادفع نقداً عند وصول الطلب'
    },
    {
      id: 'vodafone',
      name: 'فودافون كاش',
      type: 'vodafone_cash',
      icon: <Wallet className="w-5 h-5" />,
      description: 'الدفع عبر فودافون كاش'
    },
    {
      id: 'bank',
      name: 'تحويل بنكي',
      type: 'bank_transfer',
      icon: <Building className="w-5 h-5" />,
      description: 'تحويل على الحساب البنكي'
    }
  ];

  // التحقق من صحة البيانات
  const validateCustomerInfo = () => {
    if (!customerInfo.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم",
        variant: "destructive",
      });
      return false;
    }
    
    if (!customerInfo.phone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return false;
    }
    
    if (!customerInfo.address.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال العنوان",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // إتمام الطلب
  const handleCompleteOrder = async () => {
    if (!validateCustomerInfo()) return;

    if (cartItems.length === 0) {
      toast({
        title: "خطأ",
        description: "السلة فارغة",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: `${customerInfo.address}, ${customerInfo.city}`,
        payment_method: selectedPayment,
        notes: customerInfo.notes,
        subtotal: summary.subtotal,
        tax_amount: summary.tax,
        shipping_amount: summary.shipping,
        total_amount: summary.total,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.name || 'منتج غير معروف',
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        }))
      };

      // استخدام mutateAsync بدلاً من mutate للحصول على promise
      createOrder(orderData, {
        onSuccess: (order) => {
          // مسح السلة
          clearCart();

          // الانتقال لصفحة تأكيد الطلب
          navigate(`/order-confirmation/${order.id}`);
        },
        onError: (error) => {
          console.error('Error creating order:', error);
          toast({
            title: "خطأ",
            description: "فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // إذا كانت السلة فارغة
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              السلة فارغة
            </h3>
            <p className="text-gray-600 mb-6">
              لا يمكن إتمام الطلب بسلة فارغة
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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/cart">
              <Button variant="outline" size="sm">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للسلة
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إتمام الطلب</h1>
              <p className="text-gray-600">
                {summary.itemsCount} منتج - {summary.total} ج
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* نموذج الطلب */}
          <div className="lg:col-span-2 space-y-6">
            {/* خطوات الطلب */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                    </div>
                    <span className="font-medium">معلومات العميل</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      {step > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                    </div>
                    <span className="font-medium">طريقة الدفع</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      3
                    </div>
                    <span className="font-medium">تأكيد الطلب</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الخطوة الأولى: معلومات العميل */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    معلومات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل *
                      </label>
                      <Input
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف *
                      </label>
                      <Input
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="01xxxxxxxxx"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <Input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="example@email.com"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة *
                      </label>
                      <Input
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        placeholder="القاهرة"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان التفصيلي *
                    </label>
                    <Textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      placeholder="الشارع، المنطقة، رقم المبنى..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات إضافية
                    </label>
                    <Textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      placeholder="أي ملاحظات خاصة بالطلب..."
                      rows={2}
                      className="w-full"
                    />
                  </div>

                  <Button 
                    onClick={() => validateCustomerInfo() && setStep(2)}
                    className="w-full"
                  >
                    التالي: اختيار طريقة الدفع
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* الخطوة الثانية: طريقة الدفع */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPayment === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)}
                          className="text-blue-600"
                        />
                        <div className="text-blue-600">
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      السابق
                    </Button>
                    <Button 
                      onClick={() => setStep(3)}
                      className="flex-1"
                    >
                      التالي: مراجعة الطلب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* الخطوة الثالثة: تأكيد الطلب */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    مراجعة وتأكيد الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* معلومات العميل */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">معلومات العميل:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><strong>الاسم:</strong> {customerInfo.name}</p>
                      <p><strong>الهاتف:</strong> {customerInfo.phone}</p>
                      {customerInfo.email && <p><strong>البريد:</strong> {customerInfo.email}</p>}
                      <p><strong>العنوان:</strong> {customerInfo.address}, {customerInfo.city}</p>
                      {customerInfo.notes && <p><strong>ملاحظات:</strong> {customerInfo.notes}</p>}
                    </div>
                  </div>

                  {/* طريقة الدفع */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">طريقة الدفع:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">
                        {paymentMethods.find(m => m.id === selectedPayment)?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      السابق
                    </Button>
                    <Button 
                      onClick={handleCompleteOrder}
                      disabled={isProcessing || isCreating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing || isCreating ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ملخص الطلب */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* المنتجات */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-gray-600">
                          {item.quantity} × {item.price} ج
                        </p>
                      </div>
                      <p className="font-medium">
                        {(item.price * item.quantity).toFixed(2)} ج
                      </p>
                    </div>
                  ))}
                </div>

                <hr />

                {/* الحسابات */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{summary.subtotal} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>{summary.tax} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحن:</span>
                    <span>{summary.shipping === 0 ? 'مجاني' : `${summary.shipping} ج`}</span>
                  </div>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-green-600">{summary.total} ج</span>
                </div>

                {/* معلومات الشحن */}
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Truck className="w-4 h-4" />
                    <span className="font-medium">معلومات الشحن</span>
                  </div>
                  <ul className="text-blue-600 space-y-1">
                    <li>• التوصيل خلال 2-3 أيام عمل</li>
                    <li>• شحن مجاني للطلبات أكثر من 500 ج</li>
                    <li>• إمكانية الدفع عند الاستلام</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
