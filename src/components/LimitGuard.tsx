/**
 * 🚫 مكون حماية الحدود
 * يتحقق من حدود الخطة ويمنع الوصول للميزات المدفوعة
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Crown, 
  Lock, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Image, 
  Package,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanLimitsService, LimitCheckResult } from '@/services/planLimitsService';

interface LimitGuardProps {
  children: React.ReactNode;
  companyId: string;
  resourceType: 'users' | 'messages' | 'images' | 'products';
  requiredAmount?: number;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

interface UsageWarning {
  resource: string;
  current: number;
  limit: number;
  percentage: number;
  level: 'warning' | 'critical';
  message: string;
}

const LimitGuard: React.FC<LimitGuardProps> = ({
  children,
  companyId,
  resourceType,
  requiredAmount = 1,
  feature,
  fallback,
  showUpgrade = true,
  onUpgrade
}) => {
  const [limitCheck, setLimitCheck] = useState<LimitCheckResult | null>(null);
  const [featureAccess, setFeatureAccess] = useState<{ allowed: boolean; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  useEffect(() => {
    checkLimits();
  }, [companyId, resourceType, requiredAmount, feature]);

  const checkLimits = async () => {
    try {
      setLoading(true);

      // التحقق من حدود المورد
      const resourceCheck = await PlanLimitsService.checkResourceLimit(
        companyId,
        resourceType,
        requiredAmount
      );
      setLimitCheck(resourceCheck);

      // التحقق من الميزة إذا كانت محددة
      if (feature) {
        const featureCheck = await PlanLimitsService.checkFeatureAccess(companyId, feature);
        setFeatureAccess(featureCheck);
      }
    } catch (error) {
      console.error('Error checking limits:', error);
      toast.error('فشل في التحقق من حدود الخطة');
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'users': return <Users className="h-5 w-5" />;
      case 'messages': return <MessageSquare className="h-5 w-5" />;
      case 'images': return <Image className="h-5 w-5" />;
      case 'products': return <Package className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getResourceName = (type: string) => {
    switch (type) {
      case 'users': return 'المستخدمين';
      case 'messages': return 'الرسائل';
      case 'images': return 'الصور';
      case 'products': return 'المنتجات';
      default: return 'المورد';
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // التوجه لصفحة ترقية الخطة
      window.location.href = '/upgrade-plan';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">جاري التحقق من الحدود...</span>
      </div>
    );
  }

  // التحقق من الميزة أولاً
  if (feature && featureAccess && !featureAccess.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">ميزة مدفوعة</h3>
          <p className="text-orange-700 mb-4">{featureAccess.reason}</p>
          {showUpgrade && (
            <Button onClick={handleUpgrade} className="bg-orange-600 hover:bg-orange-700">
              <Crown className="h-4 w-4 mr-2" />
              ترقية الخطة
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // التحقق من حدود المورد
  if (limitCheck && !limitCheck.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">تجاوز الحد المسموح</h3>
            <p className="text-red-700 mb-4">{limitCheck.reason}</p>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getResourceIcon(resourceType)}
                  <span className="ml-2 font-medium">{getResourceName(resourceType)}</span>
                </div>
                <Badge variant="destructive">
                  {limitCheck.current} / {limitCheck.limit === -1 ? '∞' : limitCheck.limit}
                </Badge>
              </div>
              <Progress value={limitCheck.percentage} className="h-2" />
            </div>

            {showUpgrade && (
              <div className="space-y-2">
                <Button onClick={handleUpgrade} className="bg-red-600 hover:bg-red-700 w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  ترقية الخطة للمزيد
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLimitDialog(true)}
                  className="w-full"
                >
                  عرض التفاصيل
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نافذة تفاصيل الحدود */}
        <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                تفاصيل حدود الاستخدام
              </DialogTitle>
              <DialogDescription>
                معلومات مفصلة عن استخدامك الحالي وحدود الخطة
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getResourceIcon(resourceType)}
                    <span className="ml-2 font-medium">{getResourceName(resourceType)}</span>
                  </div>
                  <Badge variant={limitCheck.percentage >= 90 ? 'destructive' : 'secondary'}>
                    {Math.round(limitCheck.percentage)}%
                  </Badge>
                </div>
                
                <Progress value={limitCheck.percentage} className="h-3 mb-2" />
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>المستخدم: {limitCheck.current}</span>
                  <span>الحد الأقصى: {limitCheck.limit === -1 ? 'غير محدود' : limitCheck.limit}</span>
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  لزيادة حدود الاستخدام، يمكنك ترقية خطتك للحصول على المزيد من الموارد والميزات المتقدمة.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
                  إغلاق
                </Button>
                <Button onClick={handleUpgrade}>
                  <Crown className="h-4 w-4 mr-2" />
                  ترقية الخطة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // إذا كان كل شيء مسموح، عرض المحتوى
  return <>{children}</>;
};

// مكون تحذيرات الاستخدام
export const UsageWarnings: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [warnings, setWarnings] = useState<UsageWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarnings();
  }, [companyId]);

  const loadWarnings = async () => {
    try {
      const result = await PlanLimitsService.getUsageWarnings(companyId);
      if (result.success) {
        setWarnings(result.warnings);
      }
    } catch (error) {
      console.error('Error loading usage warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      {warnings.map((warning, index) => (
        <Alert 
          key={index} 
          variant={warning.level === 'critical' ? 'destructive' : 'default'}
          className={warning.level === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{warning.message}</span>
            <Badge variant={warning.level === 'critical' ? 'destructive' : 'secondary'}>
              {Math.round(warning.percentage)}%
            </Badge>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default LimitGuard;
