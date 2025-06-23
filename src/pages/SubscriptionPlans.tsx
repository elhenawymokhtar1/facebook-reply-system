/**
 * 💰 صفحة عرض خطط الاشتراك
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Building } from 'lucide-react';
import { SubscriptionService, SubscriptionPlan } from '@/services/subscriptionService';
import { toast } from 'sonner';

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    console.log('🚀 SubscriptionPlans component mounted');
    loadPlans();
  }, []);

  useEffect(() => {
    console.log('💰 Billing cycle changed to:', selectedBilling);
  }, [selectedBilling]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading subscription plans...');
      const plansData = await SubscriptionService.getAllPlans();
      console.log('✅ Plans loaded:', plansData);
      setPlans(plansData);
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      toast.error('فشل في تحميل خطط الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return <Star className="h-6 w-6" />;
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'professional': return <Crown className="h-6 w-6" />;
      case 'business': return <Building className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return 'bg-gray-50 border-gray-200';
      case 'basic': return 'bg-blue-50 border-blue-200';
      case 'professional': return 'bg-purple-50 border-purple-200';
      case 'business': return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = selectedBilling === 'monthly' ? plan.monthly_price : plan.yearly_price;
    if (price === 0) return 'مجاني';
    
    const monthlyEquivalent = selectedBilling === 'yearly' ? price / 12 : price;
    return `$${price}${selectedBilling === 'yearly' ? '/سنة' : '/شهر'}`;
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    if (plan.monthly_price === 0) return 0;
    const yearlyTotal = plan.monthly_price * 12;
    const savings = yearlyTotal - plan.yearly_price;
    return Math.round((savings / yearlyTotal) * 100);
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'غير محدود';
    if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
    return limit.toString();
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    console.log('🎯 Selected plan:', plan);
    console.log('💰 Billing cycle:', selectedBilling);

    // عرض معلومات مفصلة عن الخطة المختارة
    const price = selectedBilling === 'monthly' ? plan.monthly_price : plan.yearly_price;
    const priceText = price === 0 ? 'مجاني' : `$${price}`;
    const billingText = selectedBilling === 'monthly' ? 'شهر' : 'سنة';

    // رسالة مخصصة حسب نوع الخطة
    if (plan.monthly_price === 0) {
      toast.success(`🎉 تم اختيار الخطة المجانية "${plan.name_ar}"!`);
      console.log('🆓 Free plan selected - activating directly');

      // تفعيل الخطة المجانية مباشرة
      setTimeout(() => {
        window.location.href = `/subscription-success?plan=${plan.id}&amount=0&billing=${selectedBilling}`;
      }, 1500);

    } else {
      toast.success(`💳 تم اختيار خطة "${plan.name_ar}" بسعر ${priceText}/${billingText}`);
      console.log('💳 Paid plan selected - redirect to checkout');

      // عرض معلومات إضافية عن الخطة
      setTimeout(() => {
        const features = [];
        if (plan.features.ai_responses) features.push('ردود ذكية');
        if (plan.features.image_sending) features.push('إرسال صور');
        if (plan.features.api_access) features.push('وصول API');

        toast.info(`✨ الميزات المتاحة: ${features.join(', ')}`);
      }, 1000);

      // الانتقال لصفحة الدفع
      setTimeout(() => {
        window.location.href = `/subscription-checkout?plan=${plan.id}&billing=${selectedBilling}`;
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل خطط الاشتراك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* العنوان الرئيسي */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          اختر الخطة المناسبة لشركتك
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          خطط مرنة تناسب جميع أحجام الشركات مع ميزات متقدمة للرد التلقائي وإرسال الصور
        </p>
      </div>

      {/* مفتاح التبديل بين الشهري والسنوي */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔄 Switching to monthly billing');
              setSelectedBilling('monthly');
              toast.info('📅 تم التبديل للفوترة الشهرية');
            }}
            className={`px-6 py-2 rounded-md transition-all cursor-pointer ${
              selectedBilling === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            شهري
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔄 Switching to yearly billing');
              setSelectedBilling('yearly');
              toast.info('💰 تم التبديل للفوترة السنوية - وفر حتى 20%!');
            }}
            className={`px-6 py-2 rounded-md transition-all cursor-pointer ${
              selectedBilling === 'yearly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            سنوي
            <Badge variant="secondary" className="ml-2">
              وفر حتى 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* عرض الخطط */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.name === 'Professional';
          const yearlySavings = getYearlySavings(plan);
          
          return (
            <Card
              key={plan.id}
              className={`relative ${getPlanColor(plan.name)} ${
                isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
              } transition-all hover:shadow-lg`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-4 py-1">
                    الأكثر شعبية
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <div className={`p-3 rounded-full ${
                    plan.name === 'Business' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                    plan.name === 'Professional' ? 'bg-purple-500 text-white' :
                    plan.name === 'Basic' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {getPlanIcon(plan.name)}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold">
                  {plan.name_ar}
                </CardTitle>
                
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {formatPrice(plan)}
                  {selectedBilling === 'yearly' && yearlySavings > 0 && (
                    <div className="text-sm text-green-600 font-normal">
                      وفر {yearlySavings}%
                    </div>
                  )}
                </div>
                
                <CardDescription className="text-sm mt-2">
                  {plan.description_ar}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* الميزات الرئيسية */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المنتجات</span>
                    <span className="font-semibold">{formatLimit(plan.max_products)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الرسائل/شهر</span>
                    <span className="font-semibold">{formatLimit(plan.max_messages_per_month)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">الصور</span>
                    <span className="font-semibold">{formatLimit(plan.max_images)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المحادثات النشطة</span>
                    <span className="font-semibold">{formatLimit(plan.max_active_conversations)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المستخدمين</span>
                    <span className="font-semibold">{formatLimit(plan.max_users)}</span>
                  </div>
                </div>

                {/* الميزات المتقدمة */}
                <div className="border-t pt-4 space-y-2">
                  {plan.features.ai_responses && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      ردود ذكية بـ AI
                    </div>
                  )}
                  
                  {plan.features.image_sending && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      إرسال صور تلقائي
                    </div>
                  )}
                  
                  {plan.features.basic_analytics && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      تقارير أساسية
                    </div>
                  )}
                  
                  {plan.features.api_access && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      وصول API
                    </div>
                  )}
                  
                  {plan.features.priority_support && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      دعم أولوية
                    </div>
                  )}
                  
                  {plan.features.unlimited && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      كل شيء غير محدود
                    </div>
                  )}
                </div>

                {/* زر الاختيار */}
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Button clicked for plan:', plan.name);
                    handleSelectPlan(plan);
                  }}
                  className={`w-full mt-6 cursor-pointer ${
                    plan.name === 'Business' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' :
                    plan.name === 'Professional' ? 'bg-purple-500 hover:bg-purple-600' :
                    plan.name === 'Basic' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-gray-500 hover:bg-gray-600'
                  } text-white transition-all duration-200 hover:scale-105 active:scale-95`}
                  type="button"
                >
                  {plan.monthly_price === 0 ? 'ابدأ مجاناً' : 'اختر هذه الخطة'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* معلومات إضافية */}
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">
          جميع الخطط تشمل دعم عملاء مجاني وضمان استرداد المال لمدة 30 يوم
        </p>
        <div className="flex justify-center space-x-4 text-sm text-gray-500 mb-8">
          <span>✅ بدون رسوم إعداد</span>
          <span>✅ إلغاء في أي وقت</span>
          <span>✅ ترقية فورية</span>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">+1000</div>
            <div className="text-gray-600">شركة تثق بنا</div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
            <div className="text-gray-600">وقت التشغيل</div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">24/7</div>
            <div className="text-gray-600">دعم فني</div>
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-800 mb-2">هل تحتاج مساعدة في الاختيار؟</h3>
          <p className="text-gray-600 text-sm mb-3">
            فريقنا جاهز لمساعدتك في اختيار الخطة المناسبة لاحتياجاتك
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <button
              onClick={() => toast.info('📞 سيتم التواصل معك قريباً')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              تواصل معنا
            </button>
            <button
              onClick={() => toast.info('📧 تم إرسال طلب الاستشارة')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              استشارة مجانية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
