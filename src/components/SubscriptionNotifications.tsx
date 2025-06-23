/**
 * 🔔 مكون إشعارات الاشتراك
 * يعرض تحذيرات وإشعارات حول حالة الاشتراك والحدود
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Crown, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Image, 
  Package,
  Bell,
  X,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanLimitsService } from '@/services/planLimitsService';

interface NotificationProps {
  companyId: string;
  showInSidebar?: boolean;
  maxNotifications?: number;
}

interface Notification {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  icon: React.ReactNode;
  timestamp: Date;
}

const SubscriptionNotifications: React.FC<NotificationProps> = ({
  companyId,
  showInSidebar = false,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
    
    // تحديث الإشعارات كل 5 دقائق
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [companyId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات الاشتراك
      const subscriptionRes = await fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/subscription`);
      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        if (subscriptionData.success) {
          setSubscription(subscriptionData.data);
        }
      }

      // جلب تحذيرات الاستخدام
      const warningsResult = await PlanLimitsService.getUsageWarnings(companyId);
      
      const newNotifications: Notification[] = [];

      // إشعارات الاشتراك
      if (subscriptionData?.data) {
        const sub = subscriptionData.data;
        
        // تحذير انتهاء الاشتراك
        const daysUntilRenewal = getDaysUntilRenewal(sub.next_billing_date);
        if (daysUntilRenewal <= 7 && daysUntilRenewal > 0 && sub.status === 'active') {
          newNotifications.push({
            id: 'renewal-warning',
            type: 'warning',
            title: 'تجديد الاشتراك قريباً',
            message: `سيتم تجديد اشتراكك خلال ${daysUntilRenewal} أيام`,
            action: {
              label: 'تحديث طريقة الدفع',
              onClick: () => window.location.href = '/subscription-management'
            },
            icon: <Calendar className="h-4 w-4" />,
            timestamp: new Date(),
            dismissible: true
          });
        }

        // تحذير الاشتراك المتوقف
        if (sub.status === 'paused') {
          newNotifications.push({
            id: 'subscription-paused',
            type: 'warning',
            title: 'الاشتراك متوقف مؤقتاً',
            message: 'بعض الميزات قد تكون غير متاحة',
            action: {
              label: 'استئناف الاشتراك',
              onClick: () => window.location.href = '/subscription-management'
            },
            icon: <AlertTriangle className="h-4 w-4" />,
            timestamp: new Date(),
            dismissible: false
          });
        }

        // تحذير الاشتراك الملغي
        if (sub.status === 'cancelled') {
          newNotifications.push({
            id: 'subscription-cancelled',
            type: 'critical',
            title: 'تم إلغاء الاشتراك',
            message: 'ستفقد الوصول للميزات المدفوعة قريباً',
            action: {
              label: 'تجديد الاشتراك',
              onClick: () => window.location.href = '/subscription-plans'
            },
            icon: <X className="h-4 w-4" />,
            timestamp: new Date(),
            dismissible: false
          });
        }
      }

      // إشعارات حدود الاستخدام
      if (warningsResult.success && warningsResult.warnings.length > 0) {
        warningsResult.warnings.forEach((warning, index) => {
          const icon = getResourceIcon(warning.resource);
          
          newNotifications.push({
            id: `usage-${warning.resource}-${index}`,
            type: warning.level === 'critical' ? 'critical' : 'warning',
            title: `تحذير استخدام ${getResourceName(warning.resource)}`,
            message: warning.message,
            action: {
              label: 'ترقية الخطة',
              onClick: () => window.location.href = '/upgrade-plan'
            },
            icon,
            timestamp: new Date(),
            dismissible: true
          });
        });
      }

      // ترتيب الإشعارات حسب الأولوية والوقت
      newNotifications.sort((a, b) => {
        const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        const aPriority = priorityOrder[a.type];
        const bPriority = priorityOrder[b.type];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setNotifications(newNotifications.slice(0, maxNotifications));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // حفظ الإشعارات المرفوضة في localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    dismissed.push(id);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'users': return <Users className="h-4 w-4" />;
      case 'messages': return <MessageSquare className="h-4 w-4" />;
      case 'images': return <Image className="h-4 w-4" />;
      case 'products': return <Package className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getResourceName = (resource: string) => {
    switch (resource) {
      case 'users': return 'المستخدمين';
      case 'messages': return 'الرسائل';
      case 'images': return 'الصور';
      case 'products': return 'المنتجات';
      default: return 'المورد';
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'success': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getNotificationClass = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return '';
    }
  };

  if (loading) {
    return showInSidebar ? (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    ) : null;
  }

  if (notifications.length === 0) {
    return showInSidebar ? (
      <div className="p-4 text-center text-sm text-gray-500">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
        لا توجد إشعارات
      </div>
    ) : null;
  }

  if (showInSidebar) {
    return (
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">الإشعارات</h3>
          <Badge variant="secondary">{notifications.length}</Badge>
        </div>
        
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border text-sm ${getNotificationClass(notification.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">{notification.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-xs">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  {notification.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-6 text-xs"
                      onClick={notification.action.onClick}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
              {notification.dismissible && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={getNotificationVariant(notification.type)}
          className={getNotificationClass(notification.type)}
        >
          {notification.icon}
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <AlertDescription>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm mt-1">{notification.message}</div>
              </AlertDescription>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {notification.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={notification.action.onClick}
                >
                  {notification.action.label}
                </Button>
              )}
              {notification.dismissible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

// مكون عداد الإشعارات للشريط العلوي
export const NotificationBadge: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const warningsResult = await PlanLimitsService.getUsageWarnings(companyId);
        if (warningsResult.success) {
          setCount(warningsResult.warnings.length);
        }
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    loadCount();
    const interval = setInterval(loadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [companyId]);

  if (count === 0) return null;

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      <Badge 
        variant="destructive" 
        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
      >
        {count > 9 ? '9+' : count}
      </Badge>
    </div>
  );
};

export default SubscriptionNotifications;
