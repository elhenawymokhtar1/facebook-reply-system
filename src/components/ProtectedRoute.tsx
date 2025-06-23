/**
 * 🔐 مكون حماية المسارات
 * يتحقق من تسجيل دخول المستخدم قبل السماح بالوصول للصفحات المحمية
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/company-login'
}) => {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // التحقق من وجود بيانات الشركة في localStorage
      const companyData = localStorage.getItem('company');
      const userToken = localStorage.getItem('userToken');
      
      if (companyData) {
        try {
          const company = JSON.parse(companyData);
          
          // التحقق من صحة البيانات
          if (company.id && company.email) {
            // يمكن إضافة تحقق إضافي من السيرفر هنا
            setAuthState({
              isAuthenticated: true,
              user: company,
              loading: false
            });
            return;
          }
        } catch (error) {
          console.error('خطأ في تحليل بيانات الشركة:', error);
          // إزالة البيانات التالفة
          localStorage.removeItem('company');
          localStorage.removeItem('userToken');
        }
      }
      
      // إذا لم توجد بيانات صحيحة
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    } catch (error) {
      console.error('خطأ في التحقق من حالة المصادقة:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  // عرض شاشة التحميل أثناء التحقق
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600 mr-2" />
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              جاري التحقق من الصلاحيات
            </h3>
            <p className="text-gray-600">
              يرجى الانتظار...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إذا كانت الصفحة تتطلب مصادقة والمستخدم غير مسجل
  if (requireAuth && !authState.isAuthenticated) {
    // حفظ المسار الحالي للعودة إليه بعد تسجيل الدخول
    const returnUrl = location.pathname + location.search;
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: returnUrl,
          message: 'يجب تسجيل الدخول للوصول لهذه الصفحة'
        }} 
        replace 
      />
    );
  }

  // إذا كان المستخدم مسجل ويحاول الوصول لصفحة تسجيل الدخول
  if (authState.isAuthenticated && (location.pathname === '/company-login' || location.pathname === '/company-register')) {
    return <Navigate to="/company-dashboard" replace />;
  }

  // السماح بالوصول
  return <>{children}</>;
};

// مكون للصفحات العامة (لا تتطلب مصادقة)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute requireAuth={false}>{children}</ProtectedRoute>;
};

// مكون للصفحات المحمية (تتطلب مصادقة)
export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute requireAuth={true}>{children}</ProtectedRoute>;
};

// Hook للحصول على حالة المصادقة
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const companyData = localStorage.getItem('company');
        
        if (companyData) {
          const company = JSON.parse(companyData);
          if (company.id && company.email) {
            setAuthState({
              isAuthenticated: true,
              user: company,
              loading: false
            });
            return;
          }
        }
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    checkAuth();

    // الاستماع لتغييرات localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (userData: any) => {
    localStorage.setItem('company', JSON.stringify(userData));
    setAuthState({
      isAuthenticated: true,
      user: userData,
      loading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('company');
    localStorage.removeItem('userToken');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  return {
    ...authState,
    login,
    logout
  };
};

export default ProtectedRoute;
