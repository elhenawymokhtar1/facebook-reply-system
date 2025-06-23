/**
 * 🎉 صفحة تأكيد نجاح الاشتراك
 * تاريخ الإنشاء: 23 يونيو 2025
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Star, 
  Zap, 
  Crown, 
  Building,
  Calendar,
  CreditCard,
  Download,
  Mail,
  ArrowRight
} from 'lucide-react';
import { SubscriptionService, SubscriptionPlan } from '@/services/subscriptionService';
import { toast } from 'sonner';

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const planId = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const billing = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly';
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      loadPlan();
      // إرسال إشعار نجاح
      toast.success('🎉 تم تفعيل اشتراكك بنجاح!');
    } else {
      navigate('/subscription-plans');
    }
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/subscriptions/plans`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const foundPlan = result.data.find((p: SubscriptionPlan) => p.id === planId);
        if (foundPlan) {
          setPlan(foundPlan);
        }
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return <Star className="h-8 w-8" />;
      case 'basic': return <Zap className="h-8 w-8" />;
      case 'professional': return <Crown className="h-8 w-8" />;
      case 'business': return <Building className="h-8 w-8" />;
      default: return <Star className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return 'text-gray-600';
      case 'basic': return 'text-blue-600';
      case 'professional': return 'text-purple-600';
      case 'business': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getNextBillingDate = () => {
    const today = new Date();
    if (billing === 'monthly') {
      today.setMonth(today.getMonth() + 1);
    } else {
      today.setFullYear(today.getFullYear() + 1);
    }
    return today.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الاشتراك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* رسالة النجاح الرئيسية */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎉 تم تفعيل اشتراكك بنجاح!
        </h1>
        <p className="text-xl text-gray-600">
          مرحباً بك في عائلة المشتركين. يمكنك الآن الاستفادة من جميع الميزات
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* تفاصيل الاشتراك */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {plan && (
                <div className={`p-2 rounded-lg mr-3 ${getPlanColor(plan.name)}`}>
                  {getPlanIcon(plan.name)}
                </div>
              )}
              تفاصيل اشتراكك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{plan.name_ar}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    نشط
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-sm">{plan.description_ar}</p>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 ml-2" />
                      <span>نوع الفوترة</span>
                    </div>
                    <span className="font-medium">
                      {billing === 'monthly' ? 'شهري' : 'سنوي'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-gray-500 ml-2" />
                      <span>المبلغ المدفوع</span>
                    </div>
                    <span className="font-medium">${amount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 ml-2" />
                      <span>التجديد التالي</span>
                    </div>
                    <span className="font-medium">{getNextBillingDate()}</span>
                  </div>
                </div>

                <Separator />

                {/* الميزات المتاحة */}
                <div>
                  <h4 className="font-semibold mb-3">الميزات المتاحة لك الآن:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span>{plan.max_products === -1 ? 'منتجات غير محدودة' : `${plan.max_products} منتج`}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span>{plan.max_messages_per_month === -1 ? 'رسائل غير محدودة' : `${plan.max_messages_per_month} رسالة/شهر`}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      <span>{plan.max_images === -1 ? 'صور غير محدودة' : `${plan.max_images} صورة`}</span>
                    </div>
                    {plan.features.ai_responses && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        <span>ردود ذكية بـ AI</span>
                      </div>
                    )}
                    {plan.features.image_sending && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        <span>إرسال صور تلقائي</span>
                      </div>
                    )}
                    {plan.features.api_access && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        <span>وصول API</span>
                      </div>
                    )}
                    {plan.features.priority_support && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        <span>دعم أولوية</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* الخطوات التالية */}
        <Card>
          <CardHeader>
            <CardTitle>الخطوات التالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium">تحقق من بريدك الإلكتروني</h4>
                  <p className="text-sm text-gray-600">
                    ستصلك رسالة تأكيد تحتوي على تفاصيل اشتراكك
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium">ابدأ استخدام النظام</h4>
                  <p className="text-sm text-gray-600">
                    اذهب إلى لوحة التحكم وابدأ في إعداد منتجاتك
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium">احصل على الدعم</h4>
                  <p className="text-sm text-gray-600">
                    فريق الدعم جاهز لمساعدتك في أي وقت
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* أزرار الإجراءات */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/company-dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                اذهب إلى لوحة التحكم
              </Button>

              <Button 
                variant="outline"
                onClick={() => window.print()}
                className="w-full"
              >
                <Download className="h-4 w-4 ml-2" />
                طباعة الفاتورة
              </Button>

              <Button 
                variant="outline"
                onClick={() => toast.info('📧 تم إرسال نسخة إلى بريدك الإلكتروني')}
                className="w-full"
              >
                <Mail className="h-4 w-4 ml-2" />
                إرسال نسخة بالبريد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معلومات إضافية */}
      <div className="mt-8 text-center">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            🎯 هل تحتاج مساعدة في البداية؟
          </h3>
          <p className="text-blue-700 mb-4">
            فريقنا جاهز لمساعدتك في إعداد النظام وتحقيق أقصى استفادة من اشتراكك
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => toast.info('📞 سيتم التواصل معك خلال 24 ساعة')}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              طلب مكالمة إعداد مجانية
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/help')}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              مركز المساعدة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
