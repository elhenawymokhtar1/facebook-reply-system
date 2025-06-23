/**
 * 🔐 صفحة تسجيل دخول الشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Mail, Eye, EyeOff, LogIn, Info } from 'lucide-react';
import { SubscriptionService } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const CompanyLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirectMessage, setRedirectMessage] = useState<string>('');

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // التحقق من وجود رسالة redirect
    if (location.state?.message) {
      setRedirectMessage(location.state.message);
    }
  }, [location]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // إزالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await SubscriptionService.loginCompany(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      if (result.success && result.company) {
        // حفظ بيانات الشركة في localStorage
        localStorage.setItem('company', JSON.stringify(result.company));
        
        toast({
          title: "مرحباً بك! 👋",
          description: `أهلاً بك ${result.company.name}`,
        });

        // الانتقال للصفحة المطلوبة أو لوحة التحكم
        const redirectTo = location.state?.from || '/company-dashboard';
        navigate(redirectTo, { replace: true });
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            تسجيل دخول الشركة
          </CardTitle>
          <CardDescription className="text-lg">
            ادخل إلى لوحة تحكم شركتك
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* رسالة التوجيه */}
          {redirectMessage && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>{redirectMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@company.com"
                className={errors.email ? 'border-red-500' : ''}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="كلمة المرور"
                  className={errors.password ? 'border-red-500' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            {/* خيارات إضافية */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="mr-2 text-sm text-gray-600">تذكرني</span>
              </label>
              
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={() => {
                  toast({
                    title: "قريباً",
                    description: "ميزة استعادة كلمة المرور ستكون متاحة قريباً",
                  });
                }}
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  تسجيل الدخول
                </div>
              )}
            </Button>

            {/* روابط إضافية */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600">
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/company-register')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    تسجيل شركة جديدة
                  </button>
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/subscription-plans')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  عرض خطط الاشتراك
                </button>
              </div>
            </div>
          </form>

          {/* معلومات الدعم */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">تحتاج مساعدة؟</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📧 البريد الإلكتروني: support@company.com</p>
              <p>📞 الهاتف: +20 123 456 7890</p>
              <p>💬 الدردشة المباشرة متاحة 24/7</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyLogin;
