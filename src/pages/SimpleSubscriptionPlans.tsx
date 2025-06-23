/**
 * 💰 صفحة خطط الاشتراك المبسطة للاختبار
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SimplePlan {
  id: string;
  name: string;
  name_ar: string;
  monthly_price: number;
  yearly_price: number;
}

const SimpleSubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SimplePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  // بيانات اختبارية
  const testPlans: SimplePlan[] = [
    {
      id: '1',
      name: 'Starter',
      name_ar: 'المبتدئ',
      monthly_price: 0,
      yearly_price: 0
    },
    {
      id: '2', 
      name: 'Basic',
      name_ar: 'الأساسية',
      monthly_price: 19,
      yearly_price: 190
    },
    {
      id: '3',
      name: 'Professional', 
      name_ar: 'المتقدمة',
      monthly_price: 49,
      yearly_price: 490
    },
    {
      id: '4',
      name: 'Business',
      name_ar: 'المؤسسية', 
      monthly_price: 99,
      yearly_price: 990
    }
  ];

  useEffect(() => {
    console.log('🚀 SimpleSubscriptionPlans mounted');
    // محاكاة تحميل البيانات
    setTimeout(() => {
      setPlans(testPlans);
      setLoading(false);
      console.log('✅ Test plans loaded:', testPlans);
    }, 1000);
  }, []);

  const handleSelectPlan = (plan: SimplePlan) => {
    console.log('🎯 Plan selected:', plan);
    const price = selectedBilling === 'monthly' ? plan.monthly_price : plan.yearly_price;
    const priceText = price === 0 ? 'مجاني' : `$${price}`;
    
    toast.success(`تم اختيار خطة ${plan.name_ar} (${priceText}/${selectedBilling === 'monthly' ? 'شهر' : 'سنة'})`);
  };

  const handleBillingChange = (billing: 'monthly' | 'yearly') => {
    console.log('💰 Billing changed to:', billing);
    setSelectedBilling(billing);
    toast.info(`تم التبديل إلى الفوترة ${billing === 'monthly' ? 'الشهرية' : 'السنوية'}`);
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          خطط الاشتراك المبسطة (اختبار)
        </h1>
        <p className="text-gray-600">
          صفحة اختبار للتأكد من عمل الأزرار
        </p>
      </div>

      {/* أزرار التبديل */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleBillingChange('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              selectedBilling === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            شهري
          </button>
          <button
            onClick={() => handleBillingChange('yearly')}
            className={`px-6 py-2 rounded-md transition-all ${
              selectedBilling === 'yearly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            سنوي (وفر 20%)
          </button>
        </div>
      </div>

      {/* الخطط */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = selectedBilling === 'monthly' ? plan.monthly_price : plan.yearly_price;
          const priceText = price === 0 ? 'مجاني' : `$${price}`;
          
          return (
            <Card key={plan.id} className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name_ar}</CardTitle>
                <div className="text-2xl font-bold text-blue-600">
                  {priceText}
                  {price > 0 && (
                    <span className="text-sm text-gray-500">
                      /{selectedBilling === 'monthly' ? 'شهر' : 'سنة'}
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {price === 0 ? 'ابدأ مجاناً' : 'اختر هذه الخطة'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* معلومات الاختبار */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">معلومات الاختبار:</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• افتح Developer Tools (F12) وتحقق من Console</li>
          <li>• اضغط على أزرار التبديل بين الشهري والسنوي</li>
          <li>• اضغط على أزرار اختيار الخطط</li>
          <li>• يجب أن تظهر إشعارات Toast وتسجيل في Console</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleSubscriptionPlans;
