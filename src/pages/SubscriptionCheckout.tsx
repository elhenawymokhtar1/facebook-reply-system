/**
 * 💳 صفحة الدفع والاشتراك
 * تاريخ الإنشاء: 23 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  ArrowLeft, 
  Check, 
  Shield,
  Star,
  Zap,
  Crown,
  Building
} from 'lucide-react';
import { SubscriptionService, SubscriptionPlan } from '@/services/subscriptionService';
import { toast } from 'sonner';

const SubscriptionCheckout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const planId = searchParams.get('plan');
  const billing = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly';
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processing, setProcessing] = useState(false);
  
  // بيانات الدفع
  const [paymentData, setPaymentData] = useState({
    // بطاقة ائتمانية
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
    
    // InstaPay
    instaPayPhone: '',
    instaPayEmail: '',
    instaPayType: 'phone',
    
    // محفظة رقمية
    walletEmail: '',
    walletPhone: ''
  });

  useEffect(() => {
    if (planId) {
      loadPlan();
    } else {
      toast.error('لم يتم تحديد خطة الاشتراك');
      navigate('/subscription-plans');
    }
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading plan:', planId);
      
      // محاولة جلب الخطة من API
      const response = await fetch(`http://localhost:3002/api/subscriptions/plans`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const foundPlan = result.data.find((p: SubscriptionPlan) => p.id === planId);
        if (foundPlan) {
          setPlan(foundPlan);
          console.log('✅ Plan loaded:', foundPlan);
        } else {
          toast.error('لم يتم العثور على الخطة المحددة');
          navigate('/subscription-plans');
        }
      } else {
        toast.error('فشل في تحميل بيانات الخطة');
        navigate('/subscription-plans');
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      toast.error('فشل في تحميل بيانات الخطة');
      navigate('/subscription-plans');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return <Star className="h-5 w-5" />;
      case 'basic': return <Zap className="h-5 w-5" />;
      case 'professional': return <Crown className="h-5 w-5" />;
      case 'business': return <Building className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const calculatePrice = () => {
    if (!plan) return { price: 0, total: 0, tax: 0 };
    
    const price = billing === 'monthly' ? plan.monthly_price : plan.yearly_price;
    const tax = price * 0.15; // ضريبة 15%
    const total = price + tax;
    
    return { price, tax, total };
  };

  const handlePayment = async () => {
    if (!plan) return;
    
    setProcessing(true);
    
    try {
      console.log('💳 Processing payment for plan:', plan.name_ar);
      console.log('💰 Payment method:', paymentMethod);
      console.log('📊 Payment data:', paymentData);
      
      // محاكاة عملية الدفع
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { total } = calculatePrice();
      
      toast.success(`🎉 تم الدفع بنجاح! مرحباً بك في خطة ${plan.name_ar}`);
      
      // إعادة توجيه لصفحة التأكيد
      setTimeout(() => {
        navigate(`/subscription-success?plan=${plan.id}&amount=${total}&billing=${billing}`);
      }, 1500);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('فشل في عملية الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">رقم البطاقة</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardExpiry">تاريخ الانتهاء</Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  value={paymentData.cardExpiry}
                  onChange={(e) => setPaymentData({...paymentData, cardExpiry: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cardCvc">CVC</Label>
                <Input
                  id="cardCvc"
                  placeholder="123"
                  value={paymentData.cardCvc}
                  onChange={(e) => setPaymentData({...paymentData, cardCvc: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">اسم حامل البطاقة</Label>
              <Input
                id="cardName"
                placeholder="الاسم كما يظهر على البطاقة"
                value={paymentData.cardName}
                onChange={(e) => setPaymentData({...paymentData, cardName: e.target.value})}
              />
            </div>
          </div>
        );
        
      case 'instapay':
        return (
          <div className="space-y-4">
            <RadioGroup 
              value={paymentData.instaPayType} 
              onValueChange={(value) => setPaymentData({...paymentData, instaPayType: value})}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone">رقم الهاتف</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email">البريد الإلكتروني</Label>
              </div>
            </RadioGroup>
            
            {paymentData.instaPayType === 'phone' ? (
              <div>
                <Label htmlFor="instaPayPhone">رقم الهاتف</Label>
                <Input
                  id="instaPayPhone"
                  placeholder="+20123456789"
                  value={paymentData.instaPayPhone}
                  onChange={(e) => setPaymentData({...paymentData, instaPayPhone: e.target.value})}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="instaPayEmail">البريد الإلكتروني</Label>
                <Input
                  id="instaPayEmail"
                  placeholder="example@instapay.com"
                  value={paymentData.instaPayEmail}
                  onChange={(e) => setPaymentData({...paymentData, instaPayEmail: e.target.value})}
                />
              </div>
            )}
          </div>
        );
        
      case 'digital_wallet':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletEmail">البريد الإلكتروني للمحفظة</Label>
              <Input
                id="walletEmail"
                placeholder="example@paypal.com"
                value={paymentData.walletEmail}
                onChange={(e) => setPaymentData({...paymentData, walletEmail: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="walletPhone">رقم الهاتف (اختياري)</Label>
              <Input
                id="walletPhone"
                placeholder="+20123456789"
                value={paymentData.walletPhone}
                onChange={(e) => setPaymentData({...paymentData, walletPhone: e.target.value})}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الخطة...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">خطأ في تحميل بيانات الخطة</p>
          <Button onClick={() => navigate('/subscription-plans')} className="mt-4">
            العودة للخطط
          </Button>
        </div>
      </div>
    );
  }

  const { price, tax, total } = calculatePrice();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* العنوان والعودة */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/subscription-plans')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة للخطط
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">إتمام الاشتراك</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ملخص الطلب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getPlanIcon(plan.name)}
              <span className="mr-2">ملخص الطلب</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">{plan.name_ar}</span>
              <Badge variant="secondary">{billing === 'monthly' ? 'شهري' : 'سنوي'}</Badge>
            </div>
            
            <p className="text-gray-600 text-sm">{plan.description_ar}</p>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>السعر الأساسي</span>
                <span>${price}</span>
              </div>
              <div className="flex justify-between">
                <span>الضريبة (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>المجموع</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center text-green-700 mb-2">
                <Shield className="h-4 w-4 ml-2" />
                <span className="font-semibold">مضمون 100%</span>
              </div>
              <p className="text-green-600 text-sm">
                ضمان استرداد المال لمدة 30 يوم
              </p>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الدفع */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الدفع</CardTitle>
            <CardDescription>اختر وسيلة الدفع المناسبة لك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* اختيار وسيلة الدفع */}
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <CreditCard className="h-5 w-5 text-blue-600" />
                <Label htmlFor="credit_card" className="flex-1">بطاقة ائتمانية</Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="instapay" id="instapay" />
                <Smartphone className="h-5 w-5 text-orange-600" />
                <Label htmlFor="instapay" className="flex-1">InstaPay</Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="digital_wallet" id="digital_wallet" />
                <Wallet className="h-5 w-5 text-purple-600" />
                <Label htmlFor="digital_wallet" className="flex-1">محفظة رقمية</Label>
              </div>
            </RadioGroup>

            {/* نموذج الدفع */}
            {renderPaymentForm()}

            {/* زر الدفع */}
            <Button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              size="lg"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  ادفع ${total.toFixed(2)} الآن
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              بالضغط على "ادفع الآن" فإنك توافق على 
              <a href="#" className="text-blue-600 hover:underline"> شروط الخدمة </a>
              و
              <a href="#" className="text-blue-600 hover:underline"> سياسة الخصوصية</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
