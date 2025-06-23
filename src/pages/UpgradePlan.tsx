/**
 * 🔄 صفحة ترقية خطة الاشتراك
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowUp, 
  Check, 
  Star, 
  Zap, 
  Crown, 
  Building, 
  CreditCard,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { SubscriptionService, SubscriptionPlan, CompanySubscription } from '@/services/subscriptionService';
import { toast } from 'sonner';

const UpgradePlan: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // الحصول على بيانات الشركة من localStorage
      const companyData = localStorage.getItem('company');
      if (!companyData) {
        navigate('/company-login');
        return;
      }
      
      const company = JSON.parse(companyData);
      
      // تحميل الخطط والاشتراك الحالي
      const [plansData, subscriptionData] = await Promise.all([
        SubscriptionService.getAllPlans(),
        SubscriptionService.getCompanySubscription(company.id)
      ]);
      
      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      
      // تحديد الخطة المحددة افتراضياً (الخطة التالية)
      if (subscriptionData && plansData.length > 0) {
        const currentPlanIndex = plansData.findIndex(p => p.id === subscriptionData.plan_id);
        if (currentPlanIndex < plansData.length - 1) {
          setSelectedPlan(plansData[currentPlanIndex + 1].id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
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

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
    if (price === 0) return 'مجاني';
    return `$${price}${billingCycle === 'yearly' ? '/سنة' : '/شهر'}`;
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'غير محدود';
    if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
    return limit.toString();
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    if (plan.monthly_price === 0) return 0;
    const yearlyTotal = plan.monthly_price * 12;
    const savings = yearlyTotal - plan.yearly_price;
    return Math.round((savings / yearlyTotal) * 100);
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const isDowngrade = (planId: string) => {
    if (!currentSubscription) return false;
    const currentPlanIndex = plans.findIndex(p => p.id === currentSubscription.plan_id);
    const selectedPlanIndex = plans.findIndex(p => p.id === planId);
    return selectedPlanIndex < currentPlanIndex;
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !currentSubscription) return;
    
    const company = JSON.parse(localStorage.getItem('company') || '{}');
    
    setUpgrading(true);
    
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle: billingCycle
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم ترقية الاشتراك بنجاح! 🎉');
        navigate('/company-dashboard');
      } else {
        toast.error(result.error || 'فشل في ترقية الاشتراك');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل خطط الاشتراك...</p>
        </div>
      </div>
    );
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/company-dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للوحة التحكم
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900">
              ترقية خطة الاشتراك
            </h1>
            
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* معلومات الخطة الحالية */}
        {currentSubscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                خطتك الحالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentSubscription.plan?.name_ar}</h3>
                  <p className="text-gray-600">{currentSubscription.plan?.description_ar}</p>
                </div>
                <Badge variant="default" className="text-lg px-3 py-1">
                  ${currentSubscription.amount} {currentSubscription.currency}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* مفتاح التبديل بين الشهري والسنوي */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-lg shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              سنوي
              <Badge variant="secondary" className="ml-2">
                وفر حتى 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* اختيار الخطة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id);
              const isDowngradeOption = isDowngrade(plan.id);
              const yearlySavings = getYearlySavings(plan);
              
              return (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all ${
                    selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
                  } ${isCurrent ? 'bg-green-50 border-green-200' : ''} ${
                    isDowngradeOption ? 'opacity-60' : ''
                  }`}
                  onClick={() => !isCurrent && !isDowngradeOption && setSelectedPlan(plan.id)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center items-center mb-3">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                        {getPlanIcon(plan.name)}
                      </div>
                      {isCurrent && (
                        <Badge className="ml-2 bg-green-500">الحالية</Badge>
                      )}
                      {!isCurrent && !isDowngradeOption && (
                        <RadioGroupItem value={plan.id} className="ml-2" />
                      )}
                    </div>
                    
                    <CardTitle className="text-xl font-bold">
                      {plan.name_ar}
                    </CardTitle>
                    
                    <div className="text-2xl font-bold text-gray-900 mt-2">
                      {formatPrice(plan)}
                      {billingCycle === 'yearly' && yearlySavings > 0 && (
                        <div className="text-sm text-green-600 font-normal">
                          وفر {yearlySavings}%
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>المنتجات:</span>
                        <span className="font-semibold">{formatLimit(plan.max_products)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الرسائل/شهر:</span>
                        <span className="font-semibold">{formatLimit(plan.max_messages_per_month)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الصور:</span>
                        <span className="font-semibold">{formatLimit(plan.max_images)}</span>
                      </div>
                    </div>

                    {isDowngradeOption && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          لا يمكن التراجع لخطة أقل
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </RadioGroup>
        </div>

        {/* ملخص الترقية */}
        {selectedPlanData && !isCurrentPlan(selectedPlan) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUp className="h-5 w-5 mr-2" />
                ملخص الترقية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">الخطة الجديدة:</h4>
                  <p className="text-lg">{selectedPlanData.name_ar}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(selectedPlanData)}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">الميزات الإضافية:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {formatLimit(selectedPlanData.max_products)} منتج
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {formatLimit(selectedPlanData.max_messages_per_month)} رسالة/شهر
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {formatLimit(selectedPlanData.max_images)} صورة
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* أزرار التحكم */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/company-dashboard')}
            disabled={upgrading}
          >
            إلغاء
          </Button>
          
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlan || isCurrentPlan(selectedPlan) || upgrading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {upgrading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري الترقية...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                ترقية الآن
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlan;
