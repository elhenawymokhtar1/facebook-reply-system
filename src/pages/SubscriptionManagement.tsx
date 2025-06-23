/**
 * 💳 صفحة إدارة الاشتراك للشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Crown,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  Image,
  Package,
  TrendingUp,
  Pause,
  Play,
  StopCircle,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Settings,
  CreditCard,
  Activity,
  BarChart3,
  Zap,
  Shield,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  id: string;
  plan: {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    max_users: number;
    max_messages: number;
    max_images: number;
    max_products: number;
    features: string[];
  };
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  auto_renew: boolean;
}

interface UsageData {
  users: { current: number; limit: number };
  messages: { current: number; limit: number };
  images: { current: number; limit: number };
  products: { current: number; limit: number };
}

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    // التحقق من تسجيل دخول الشركة
    const companyData = localStorage.getItem('company');
    if (!companyData) {
      navigate('/company-login');
      return;
    }

    try {
      const parsedCompany = JSON.parse(companyData);
      setCompany(parsedCompany);
      loadSubscriptionData(parsedCompany.id);
    } catch (error) {
      console.error('Error parsing company data:', error);
      navigate('/company-login');
    }
  }, [navigate]);

  const loadSubscriptionData = async (companyId: string) => {
    try {
      setLoading(true);
      
      // تحميل بيانات الاشتراك والاستخدام
      const [subscriptionRes, usageRes] = await Promise.all([
        fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/subscription`),
        fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/usage`)
      ]);

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        if (subscriptionData.success) {
          setSubscription(subscriptionData.data);
        }
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        if (usageData.success) {
          setUsage({
            users: { current: usageData.data.users_count || 0, limit: usageData.data.plan?.max_users || 0 },
            messages: { current: usageData.data.messages_count || 0, limit: usageData.data.plan?.max_messages || 0 },
            images: { current: usageData.data.images_count || 0, limit: usageData.data.plan?.max_images || 0 },
            products: { current: usageData.data.products_count || 0, limit: usageData.data.plan?.max_products || 0 }
          });
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('فشل في تحميل بيانات الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'مؤقت بناءً على طلب العميل' })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم إيقاف الاشتراك مؤقتاً');
        loadSubscriptionData(company.id);
      } else {
        toast.error(result.error || 'فشل في إيقاف الاشتراك');
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('حدث خطأ في إيقاف الاشتراك');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم استئناف الاشتراك بنجاح');
        loadSubscriptionData(company.id);
      } else {
        toast.error(result.error || 'فشل في استئناف الاشتراك');
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('حدث خطأ في استئناف الاشتراك');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'إلغاء بناءً على طلب العميل' })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم إلغاء الاشتراك');
        loadSubscriptionData(company.id);
      } else {
        toast.error(result.error || 'فشل في إلغاء الاشتراك');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('حدث خطأ في إلغاء الاشتراك');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />نشط</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white"><Pause className="h-3 w-3 mr-1" />متوقف مؤقتاً</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><StopCircle className="h-3 w-3 mr-1" />ملغي</Badge>;
      case 'expired':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />منتهي الصلاحية</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'غير محدود';
    return limit.toLocaleString();
  };

  const getDaysUntilRenewal = () => {
    if (!subscription?.next_billing_date) return 0;
    const today = new Date();
    const renewalDate = new Date(subscription.next_billing_date);
    const diffTime = renewalDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">لا يوجد اشتراك نشط</h2>
            <p className="text-gray-600 mb-6">يرجى الاشتراك في إحدى الخطط للمتابعة</p>
            <Button onClick={() => navigate('/subscription-plans')}>
              عرض الخطط المتاحة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Crown className="h-5 w-5 mr-2" />
              إدارة الاشتراك
            </h1>
            
            <Button
              onClick={() => navigate('/upgrade-plan')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              ترقية الخطة
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* معلومات الاشتراك الحالي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* تفاصيل الخطة */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  خطة {subscription.plan.name}
                </div>
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>
                تفاصيل اشتراكك الحالي والميزات المتاحة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* معلومات الفوترة */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">دورة الفوترة</Label>
                    <p className="text-lg font-semibold">
                      {subscription.billing_cycle === 'monthly' ? 'شهرية' : 'سنوية'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">السعر</Label>
                    <p className="text-lg font-semibold text-green-600">
                      ${subscription.billing_cycle === 'monthly' 
                        ? subscription.plan.price_monthly 
                        : subscription.plan.price_yearly
                      }
                      /{subscription.billing_cycle === 'monthly' ? 'شهر' : 'سنة'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تاريخ التجديد</Label>
                    <p className="text-lg font-semibold">
                      {new Date(subscription.next_billing_date).toLocaleDateString('ar')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">أيام متبقية</Label>
                    <p className="text-lg font-semibold text-blue-600">
                      {getDaysUntilRenewal()} يوم
                    </p>
                  </div>
                </div>

                {/* الميزات */}
                <div>
                  <h3 className="font-semibold mb-3">الميزات المتاحة</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {subscription.plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إجراءات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                إجراءات الاشتراك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.status === 'active' && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={actionLoading}>
                        <Pause className="h-4 w-4 mr-2" />
                        إيقاف مؤقت
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إيقاف الاشتراك مؤقتاً</DialogTitle>
                        <DialogDescription>
                          سيتم إيقاف الاشتراك مؤقتاً ويمكنك استئنافه في أي وقت
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">إلغاء</Button>
                        <Button onClick={handlePauseSubscription} disabled={actionLoading}>
                          تأكيد الإيقاف
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={actionLoading}>
                        <StopCircle className="h-4 w-4 mr-2" />
                        إلغاء الاشتراك
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إلغاء الاشتراك</DialogTitle>
                        <DialogDescription>
                          سيتم إلغاء الاشتراك نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">إلغاء</Button>
                        <Button variant="destructive" onClick={handleCancelSubscription} disabled={actionLoading}>
                          تأكيد الإلغاء
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {subscription.status === 'paused' && (
                <Button onClick={handleResumeSubscription} className="w-full" disabled={actionLoading}>
                  <Play className="h-4 w-4 mr-2" />
                  استئناف الاشتراك
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate('/upgrade-plan')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                ترقية الخطة
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate('/billing-management')}>
                <Receipt className="h-4 w-4 mr-2" />
                إدارة الفواتير
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate('/payment-methods')}>
                <CreditCard className="h-4 w-4 mr-2" />
                طرق الدفع
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate('/subscription-schedule')}>
                <Calendar className="h-4 w-4 mr-2" />
                مواعيد التجديد
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* إحصائيات الاستخدام */}
        {usage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                إحصائيات الاستخدام
              </CardTitle>
              <CardDescription>
                مراقبة استخدامك للميزات المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* المستخدمين */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium">المستخدمين</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage.users.current} / {formatLimit(usage.users.limit)}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.users.current, usage.users.limit)} 
                    className="h-2"
                  />
                  {getUsagePercentage(usage.users.current, usage.users.limit) >= 90 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        اقتربت من الحد الأقصى للمستخدمين
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* الرسائل */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium">الرسائل</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage.messages.current} / {formatLimit(usage.messages.limit)}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.messages.current, usage.messages.limit)} 
                    className="h-2"
                  />
                </div>

                {/* الصور */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Image className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm font-medium">الصور</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage.images.current} / {formatLimit(usage.images.limit)}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.images.current, usage.images.limit)} 
                    className="h-2"
                  />
                </div>

                {/* المنتجات */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium">المنتجات</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {usage.products.current} / {formatLimit(usage.products.limit)}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.products.current, usage.products.limit)} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* تحذيرات وإشعارات */}
        {subscription.status === 'paused' && (
          <Alert className="mb-8">
            <Pause className="h-4 w-4" />
            <AlertDescription>
              اشتراكك متوقف مؤقتاً. بعض الميزات قد تكون غير متاحة. يمكنك استئناف الاشتراك في أي وقت.
            </AlertDescription>
          </Alert>
        )}

        {subscription.status === 'cancelled' && (
          <Alert variant="destructive" className="mb-8">
            <StopCircle className="h-4 w-4" />
            <AlertDescription>
              تم إلغاء اشتراكك. ستفقد الوصول للميزات المدفوعة في تاريخ انتهاء الفترة الحالية.
            </AlertDescription>
          </Alert>
        )}

        {getDaysUntilRenewal() <= 7 && subscription.status === 'active' && (
          <Alert className="mb-8">
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              سيتم تجديد اشتراكك خلال {getDaysUntilRenewal()} أيام. تأكد من تحديث طريقة الدفع.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
