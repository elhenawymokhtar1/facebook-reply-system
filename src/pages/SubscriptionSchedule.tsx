/**
 * 📅 صفحة إدارة مواعيد الاشتراك
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Bell,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Mail,
  Smartphone,
  Settings,
  TrendingUp,
  RefreshCw,
  Pause,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionEvent {
  id: string;
  type: 'renewal' | 'payment' | 'trial_end' | 'grace_period_end';
  title: string;
  description: string;
  date: string;
  amount?: number;
  currency?: string;
  status: 'upcoming' | 'overdue' | 'completed';
  days_until: number;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  renewal_reminder_days: number[];
  payment_failure_notifications: boolean;
  trial_end_notifications: boolean;
}

const SubscriptionSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_enabled: true,
    sms_enabled: false,
    renewal_reminder_days: [7, 3, 1],
    payment_failure_notifications: true,
    trial_end_notifications: true
  });

  // إحصائيات سريعة
  const [stats, setStats] = useState({
    next_payment_date: '',
    next_payment_amount: 0,
    days_until_renewal: 0,
    auto_renew_enabled: true
  });

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
      loadScheduleData(parsedCompany.id);
    } catch (error) {
      console.error('Error parsing company data:', error);
      navigate('/company-login');
    }
  }, [navigate]);

  const loadScheduleData = async (companyId: string) => {
    try {
      setLoading(true);
      
      // تحميل بيانات الاشتراك
      const subscriptionRes = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/subscription`);
      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        if (subscriptionData.success) {
          setSubscription(subscriptionData.data);
          calculateStats(subscriptionData.data);
        }
      }

      // تحميل الأحداث المجدولة
      const eventsRes = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/schedule`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.success) {
          setEvents(eventsData.data || []);
        }
      }

      // تحميل إعدادات الإشعارات
      const notificationsRes = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/notification-settings`);
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        if (notificationsData.success) {
          setNotifications(notificationsData.data || notifications);
        }
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error('فشل في تحميل بيانات المواعيد');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subscriptionData: any) => {
    if (!subscriptionData) return;

    // استخدام end_date إذا لم يكن next_billing_date متوفراً
    const billingDate = subscriptionData.next_billing_date || subscriptionData.end_date;
    const nextBillingDate = new Date(billingDate);
    const today = new Date();
    const daysUntil = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // حساب المبلغ بناءً على الخطة
    let amount = 0;
    if (subscriptionData.plan) {
      amount = subscriptionData.billing_cycle === 'monthly'
        ? (subscriptionData.plan.monthly_price || 0)
        : (subscriptionData.plan.yearly_price || 0);
    }

    setStats({
      next_payment_date: billingDate,
      next_payment_amount: amount,
      days_until_renewal: daysUntil > 0 ? daysUntil : 0,
      auto_renew_enabled: subscriptionData.auto_renew || false
    });
  };

  const handleToggleAutoRenew = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/auto-renew`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_renew: !stats.auto_renew_enabled })
      });

      const result = await response.json();

      if (result.success) {
        setStats(prev => ({ ...prev, auto_renew_enabled: !prev.auto_renew_enabled }));
        toast.success(stats.auto_renew_enabled ? 'تم إيقاف التجديد التلقائي' : 'تم تفعيل التجديد التلقائي');
      } else {
        toast.error(result.error || 'فشل في تحديث إعدادات التجديد');
      }
    } catch (error) {
      console.error('Error toggling auto renew:', error);
      toast.error('حدث خطأ في تحديث إعدادات التجديد');
    }
  };

  const handleUpdateNotifications = async (newSettings: NotificationSettings) => {
    try {
      const response = await fetch(`http://localhost:3002/api/subscriptions/companies/${company.id}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      const result = await response.json();

      if (result.success) {
        setNotifications(newSettings);
        toast.success('تم تحديث إعدادات الإشعارات');
      } else {
        toast.error(result.error || 'فشل في تحديث إعدادات الإشعارات');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('حدث خطأ في تحديث إعدادات الإشعارات');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'renewal':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'trial_end':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'grace_period_end':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventBadge = (status: string, daysUntil: number) => {
    if (status === 'completed') {
      return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />مكتمل</Badge>;
    }
    
    if (status === 'overdue') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />متأخر</Badge>;
    }

    if (daysUntil <= 0) {
      return <Badge variant="destructive">اليوم</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge className="bg-orange-500 text-white">خلال {daysUntil} أيام</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="bg-yellow-500 text-white">خلال {daysUntil} أيام</Badge>;
    } else {
      return <Badge variant="secondary">خلال {daysUntil} أيام</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'مجاني';
    }

    if (amount === 0) {
      return 'مجاني';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return `${amount} ${currency}`;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاريخ غير صحيح';

      return date.toLocaleDateString('ar', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      return 'تاريخ غير صحيح';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل مواعيد الاشتراك...</p>
        </div>
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
              onClick={() => navigate('/subscription-management')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة لإدارة الاشتراك
            </Button>
            
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              مواعيد الاشتراك والتجديد
            </h1>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate('/billing-management')}
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                الفواتير
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* تحقق من وجود اشتراك */}
        {!subscription ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد اشتراك نشط</h3>
              <p className="text-gray-600 mb-4">يجب أن يكون لديك اشتراك نشط لعرض مواعيد التجديد</p>
              <Button onClick={() => navigate('/subscription-plans')}>
                اختر خطة اشتراك
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* معلومات التجديد القادم */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                التجديد القادم
              </CardTitle>
              <CardDescription>
                معلومات عن موعد التجديد والدفع القادم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تاريخ التجديد</Label>
                    <p className="text-lg font-semibold text-blue-600">
                      {stats.next_payment_date ? formatDate(stats.next_payment_date) : 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">المبلغ المستحق</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(stats.next_payment_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">الأيام المتبقية</Label>
                    <p className="text-lg font-semibold">
                      {stats.days_until_renewal > 0 ? `${stats.days_until_renewal} يوم` : 'اليوم'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">التجديد التلقائي</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Switch
                        checked={stats.auto_renew_enabled}
                        onCheckedChange={handleToggleAutoRenew}
                      />
                      <span className="text-sm">
                        {stats.auto_renew_enabled ? 'مفعل' : 'معطل'}
                      </span>
                    </div>
                  </div>
                </div>

                {stats.days_until_renewal <= 7 && (
                  <Alert className={stats.days_until_renewal <= 3 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {stats.days_until_renewal <= 0 
                        ? 'موعد التجديد اليوم! تأكد من توفر الرصيد في طريقة الدفع.'
                        : `سيتم تجديد اشتراكك خلال ${stats.days_until_renewal} أيام. تأكد من تحديث طريقة الدفع.`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الإشعارات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label className="text-sm">إشعارات البريد الإلكتروني</Label>
                </div>
                <Switch
                  checked={notifications.email_enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateNotifications({...notifications, email_enabled: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <Label className="text-sm">إشعارات SMS</Label>
                </div>
                <Switch
                  checked={notifications.sms_enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateNotifications({...notifications, sms_enabled: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <Label className="text-sm">تنبيهات فشل الدفع</Label>
                </div>
                <Switch
                  checked={notifications.payment_failure_notifications}
                  onCheckedChange={(checked) => 
                    handleUpdateNotifications({...notifications, payment_failure_notifications: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Label className="text-sm">تنبيهات انتهاء التجربة</Label>
                </div>
                <Switch
                  checked={notifications.trial_end_notifications}
                  onCheckedChange={(checked) => 
                    handleUpdateNotifications({...notifications, trial_end_notifications: checked})
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-600">تذكيرات التجديد</Label>
                <p className="text-xs text-gray-500 mt-1">
                  سيتم إرسال تذكيرات قبل {notifications.renewal_reminder_days.join('، ')} أيام من التجديد
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الأحداث المجدولة */}
        <Card>
          <CardHeader>
            <CardTitle>الأحداث المجدولة</CardTitle>
            <CardDescription>
              جميع المواعيد والأحداث المتعلقة بالاشتراك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أحداث مجدولة</h3>
                  <p className="text-gray-600">ستظهر هنا جميع المواعيد المهمة المتعلقة بالاشتراك</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        {getEventIcon(event.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          {getEventBadge(event.status, event.days_until)}
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          {event.amount && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>{formatCurrency(event.amount, event.currency)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* نصائح وإرشادات */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                نصائح للتوفير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  احصل على خصم 20% عند الاشتراك السنوي
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  فعل التجديد التلقائي لتجنب انقطاع الخدمة
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  راجع استخدامك شهرياً لاختيار الخطة المناسبة
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/payment-methods')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                إدارة طرق الدفع
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/billing-management')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                عرض الفواتير
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/upgrade-plan')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                ترقية الخطة
              </Button>
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSchedule;
