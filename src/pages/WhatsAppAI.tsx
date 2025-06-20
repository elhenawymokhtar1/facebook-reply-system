import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  MessageSquare, 
  ShoppingCart, 
  Package,
  Zap,
  CheckCircle,
  Settings,
  Smartphone
} from 'lucide-react';

export const WhatsAppAI: React.FC = () => {
  return (
    <div className="h-full bg-gray-50 overflow-y-auto" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-green-100 rounded-full">
            <Smartphone className="w-8 h-8 text-green-600" />
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          الذكاء الاصطناعي لـ WhatsApp
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          نظام ذكي للرد التلقائي على رسائل WhatsApp مع إمكانية الوصول للطلبات والمنتجات
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              ردود ذكية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              ردود تلقائية ذكية باستخدام Gemini AI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-green-500" />
              إدارة الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              إنشاء وعرض الطلبات مباشرة من WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-purple-500" />
              معلومات المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              عرض المنتجات والأسعار والمخزون
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-yellow-500" />
              ردود فورية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              ردود سريعة ودقيقة على استفسارات العملاء
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            كيف يعمل النظام
          </CardTitle>
          <CardDescription>
            خطوات عمل نظام الذكاء الاصطناعي لـ WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold">استقبال الرسالة</h3>
              <p className="text-sm text-gray-600">
                يستقبل النظام رسائل WhatsApp تلقائياً
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold">تحليل ذكي</h3>
              <p className="text-sm text-gray-600">
                يحلل المحتوى ويحدد نوع الاستفسار
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold">رد مخصص</h3>
              <p className="text-sm text-gray-600">
                يرسل رد مناسب مع معلومات المنتجات أو الطلبات
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Options */}
      <Card>
        <CardHeader>
          <CardTitle>خيارات البرومت</CardTitle>
          <CardDescription>
            يمكنك اختيار نوع البرومت المناسب لاحتياجاتك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">البرومت الموجود</h3>
                <Badge variant="secondary">موصى به</Badge>
              </div>
              <p className="text-sm text-gray-600">
                استخدام نفس البرومت المستخدم في النظام الحالي مع جميع الميزات:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mr-4">
                <li>• نظام هجين للردود العامة والمنتجات</li>
                <li>• إمكانية إنشاء الطلبات تلقائياً</li>
                <li>• الوصول لقاعدة بيانات المنتجات</li>
                <li>• شخصية "سارة" المساعدة الودودة</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">برومت مخصص</h3>
                <Badge variant="outline">متقدم</Badge>
              </div>
              <p className="text-sm text-gray-600">
                إنشاء برومت مخصص خاص بـ WhatsApp مع:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mr-4">
                <li>• تحكم كامل في أسلوب الرد</li>
                <li>• تخصيص الشخصية والسلوك</li>
                <li>• قواعد مخصصة للتعامل مع الطلبات</li>
                <li>• مرونة في التعديل والتطوير</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>قدرات النظام</CardTitle>
          <CardDescription>
            ما يمكن للذكاء الاصطناعي فعله في WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-green-600">✅ يمكنه فعل:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>الرد على استفسارات العملاء بطريقة ودودة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>عرض معلومات المنتجات والأسعار</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>إنشاء طلبات جديدة عند اكتمال البيانات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>عرض حالة الطلبات السابقة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>تقديم المساعدة في اختيار المنتجات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>التعامل مع الاستفسارات باللغة العربية</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-orange-600">⚠️ قيود النظام:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0">•</span>
                  <span>يحتاج إلى Gemini API Key صالح</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0">•</span>
                  <span>لا يمكنه معالجة الصور أو الملفات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0">•</span>
                  <span>يعتمد على جودة البيانات في قاعدة البيانات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0">•</span>
                  <span>قد يحتاج تدريب على منتجات جديدة</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access to Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات الذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            الوصول السريع لإعدادات Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                لتكوين إعدادات الذكاء الاصطناعي بشكل مفصل، يمكنك الانتقال إلى صفحة الإعدادات المخصصة.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• تكوين Gemini API Key</li>
                <li>• اختيار نوع البرومت</li>
                <li>• تحديد الصلاحيات</li>
                <li>• اختبار النظام</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.href = '/whatsapp-gemini-settings'}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                إعدادات Gemini AI للواتساب
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('http://localhost:8080/whatsapp-gemini-settings', '_blank')}
                className="flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                فتح في تبويب جديد
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Alert>
        <Bot className="w-4 h-4" />
        <AlertDescription>
          <strong>للبدء:</strong> قم بتفعيل النظام وإدخال Gemini API Key، ثم اختر نوع البرومت المناسب. 
          سيبدأ النظام في الرد تلقائياً على رسائل WhatsApp الواردة.
        </AlertDescription>
      </Alert>
      </div>
    </div>
  );
};
