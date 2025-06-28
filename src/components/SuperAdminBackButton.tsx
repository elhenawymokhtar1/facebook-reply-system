/**
 * 👑 زر العودة للحساب الأساسي
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, ArrowLeft, Shield } from 'lucide-react';

const SuperAdminBackButton: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // التحقق من وجود جلسة المدير الأساسي
  const superAdminSession = localStorage.getItem('superAdminSession');
  
  if (!superAdminSession) {
    return null; // لا تظهر الزر إذا لم يكن هناك جلسة مدير أساسي
  }

  const sessionData = JSON.parse(superAdminSession);

  // العودة للحساب الأساسي
  const handleBackToSuperAdmin = () => {
    try {
      // إزالة بيانات الشركة
      localStorage.removeItem('company');
      
      // الاحتفاظ ببيانات المدير الأساسي
      const superAdminData = sessionData.superAdmin;
      localStorage.setItem('superAdmin', JSON.stringify(superAdminData));
      
      // إزالة جلسة "دخول كـ"
      localStorage.removeItem('superAdminSession');
      
      toast({
        title: "نجح",
        description: "تم العودة للحساب الأساسي 👑",
      });

      // الانتقال للوحة تحكم المدير الأساسي
      navigate('/super-admin-dashboard');
    } catch (error) {
      console.error('خطأ في العودة للحساب الأساسي:', error);
      toast({
        title: "خطأ",
        description: "خطأ في العودة للحساب الأساسي",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-4">
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800">
              أنت تتصفح كمدير أساسي باسم: <strong>{sessionData.superAdmin?.name}</strong>
            </span>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleBackToSuperAdmin}
            className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للحساب الأساسي
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SuperAdminBackButton;
