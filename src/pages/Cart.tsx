import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useCoupons } from "@/hooks/useCoupons";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Package,
  CreditCard,
  Truck,
  Tag,
  Check,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Cart = () => {
  const {
    cartItems,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSummary,
    isUpdating,
    isRemoving
  } = useCart();

  const { validateCoupon } = useCoupons();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const summary = getCartSummary();

  // حساب الخصم
  const discount = appliedCoupon?.discount?.amount || 0;
  const freeShipping = appliedCoupon?.discount?.freeShipping || false;
  const finalShipping = freeShipping ? 0 : summary.shipping;
  const finalTotal = summary.total - discount - (freeShipping ? summary.shipping : 0);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity({ itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج من السلة؟')) {
      removeFromCart(itemId);
    }
  };

  const handleClearCart = () => {
    if (confirm('هل أنت متأكد من مسح جميع المنتجات من السلة؟')) {
      clearCart();
      setAppliedCoupon(null);
      setCouponCode('');
    }
  };

  // تطبيق كوبون الخصم
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كود الكوبون",
        variant: "destructive",
      });
      return;
    }

    setCouponLoading(true);
    try {
      const validation = await validateCoupon(couponCode, summary.subtotal);

      if (validation.isValid) {
        setAppliedCoupon(validation);
        toast({
          title: "تم تطبيق الكوبون!",
          description: `تم تطبيق كوبون ${couponCode} بنجاح`,
        });
      } else {
        toast({
          title: "كوبون غير صالح",
          description: validation.error || "كود الكوبون غير صحيح",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في التحقق من الكوبون",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  // إزالة الكوبون
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: "تم إزالة الكوبون",
      description: "تم إزالة كوبون الخصم",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">جاري تحميل السلة...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">سلة التسوق</h1>
              <p className="text-gray-600">
                {summary.itemsCount} منتج في السلة
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  المنتجات ({cartItems.length})
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  مسح السلة
                </Button>
              </div>

              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.product?.name || 'منتج غير معروف'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          السعر: {item.price} ج
                        </p>
                        
                        {/* Stock Status */}
                        {item.product?.stock_quantity === 0 ? (
                          <Badge variant="destructive" className="mt-1">
                            نفد المخزون
                          </Badge>
                        ) : item.product && item.product.stock_quantity < item.quantity ? (
                          <Badge variant="secondary" className="mt-1">
                            متوفر: {item.product.stock_quantity} فقط
                          </Badge>
                        ) : (
                          <Badge variant="default" className="mt-1">
                            متوفر
                          </Badge>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            handleQuantityChange(item.id, newQuantity);
                          }}
                          className="w-16 text-center"
                          min="1"
                          max={item.product?.stock_quantity || 999}
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={
                            isUpdating || 
                            (item.product && item.quantity >= item.product.stock_quantity)
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Total Price */}
                      <div className="text-left">
                        <p className="font-semibold text-lg text-gray-900">
                          {(item.price * item.quantity).toFixed(2)} ج
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Coupon Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    كود الخصم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="أدخل كود الخصم"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? 'جاري التحقق...' : 'تطبيق'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            كوبون {appliedCoupon.coupon.code}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={removeCoupon}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        {appliedCoupon.coupon.description}
                      </p>
                      <p className="text-sm font-medium text-green-800 mt-1">
                        خصم: {appliedCoupon.discount.amount} ج
                        {appliedCoupon.discount.freeShipping && ' + شحن مجاني'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    ملخص الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{summary.subtotal} ج</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">الضريبة (14%):</span>
                    <span className="font-semibold">{summary.tax} ج</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">الشحن:</span>
                    <span className={`font-semibold ${freeShipping ? 'text-green-600' : ''}`}>
                      {finalShipping === 0 ? 'مجاني' : `${finalShipping} ج`}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>خصم الكوبون ({appliedCoupon.coupon.code}):</span>
                      <span className="font-semibold">-{discount} ج</span>
                    </div>
                  )}

                  {freeShipping && summary.shipping > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>خصم الشحن:</span>
                      <span className="font-semibold">-{summary.shipping} ج</span>
                    </div>
                  )}

                  {(summary.shipping === 0 && summary.subtotal > 500) || freeShipping ? (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      🎉 تهانينا! حصلت على شحن مجاني
                    </div>
                  ) : null}

                  <hr />

                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span className="text-green-600">{Math.max(0, finalTotal)} ج</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    معلومات الشحن
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• الشحن مجاني للطلبات أكثر من 500 ج</p>
                    <p>• التوصيل خلال 2-3 أيام عمل</p>
                    <p>• إمكانية الدفع عند الاستلام</p>
                  </div>
                </CardContent>
              </Card>

              {/* Checkout Button */}
              <Link to="/checkout" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                  <CreditCard className="w-5 h-5 ml-2" />
                  إتمام الطلب ({Math.max(0, finalTotal)} ج)
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty Cart */
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                سلة التسوق فارغة
              </h3>
              <p className="text-gray-600 mb-6">
                لم تقم بإضافة أي منتجات لسلة التسوق بعد
              </p>
              <Link to="/shop">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  ابدأ التسوق الآن
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Cart;
