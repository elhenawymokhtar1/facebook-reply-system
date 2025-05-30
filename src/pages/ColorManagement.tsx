import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

const ColorManagement: React.FC = () => {
  // إعادة توجيه تلقائية بعد 3 ثوان
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/product-images';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🎨 إدارة الألوان</h1>
          <p className="text-muted-foreground">تم دمج إدارة الألوان مع إدارة الصور في صفحة موحدة</p>
        </div>

        {/* Redirect Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              تم التحسين بنجاح!
            </CardTitle>
            <CardDescription>
              تم دمج الصفحتين في واجهة موحدة بسيطة وفعالة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">✅ ما تم تحسينه:</h3>
              <ul className="text-green-800 space-y-1 text-sm">
                <li>• <strong>صفحة واحدة</strong> بدلاً من صفحتين منفصلتين</li>
                <li>• <strong>خطوة واحدة</strong> لإضافة لون وصورة</li>
                <li>• <strong>اختبار مباشر</strong> للنظام الذكي</li>
                <li>• <strong>إدارة متقدمة</strong> للكلمات المفتاحية</li>
                <li>• <strong>واجهة مبسطة</strong> وسهلة الاستخدام</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">🚀 المزايا الجديدة:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• <strong>تبويبات ذكية:</strong> ألوان وصور، صور فقط، اختبار النظام</li>
                <li>• <strong>معاينة فورية</strong> للصور مع fallback ذكي</li>
                <li>• <strong>إحصائيات متقدمة</strong> للألوان والكلمات المفتاحية</li>
                <li>• <strong>حذف متزامن</strong> للألوان والصور المرتبطة</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">سيتم التوجيه تلقائياً خلال 3 ثوان...</p>
              <Button
                onClick={() => window.location.href = '/product-images'}
                className="w-full"
                size="lg"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                انتقل إلى الصفحة الموحدة الآن
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ColorManagement;
