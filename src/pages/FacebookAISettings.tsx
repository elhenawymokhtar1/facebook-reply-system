import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bot,
  Settings,
  MessageSquare,
  Facebook,
  Brain
} from 'lucide-react';
import { GeminiSettings } from "@/components/GeminiSettings";

export const FacebookAISettings: React.FC = () => {

  return (
    <div className="h-full bg-gray-50 overflow-y-auto" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full">
              <Facebook className="w-8 h-8 text-blue-600" />
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            إعدادات Gemini AI للفيسبوك
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            تكوين نظام الذكاء الاصطناعي للرد التلقائي على رسائل وتعليقات Facebook باستخدام Google Gemini
          </p>
        </div>



        {/* Gemini AI Settings - نفس المكون الأصلي */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Facebook className="w-5 h-5 text-blue-600" />
              <span>Gemini AI للفيسبوك - الذكاء الاصطناعي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GeminiSettings />
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Alert>
          <Facebook className="w-4 h-4" />
          <AlertDescription>
            <strong>للبدء:</strong> قم بتفعيل النظام وإدخال Gemini API Key، ثم اكتب البرومت المناسب للفيسبوك.
            سيبدأ النظام في الرد تلقائياً على رسائل وتعليقات Facebook.
          </AlertDescription>
        </Alert>

        {/* Quick Access to WhatsApp Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات منصات أخرى
            </CardTitle>
            <CardDescription>
              روابط سريعة لإعدادات الذكاء الاصطناعي للمنصات الأخرى
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  يمكنك أيضاً تكوين إعدادات الذكاء الاصطناعي للواتساب من الصفحة المخصصة.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• إعدادات منفصلة لكل منصة</li>
                  <li>• برومتات مخصصة</li>
                  <li>• اختبار مستقل</li>
                  <li>• صلاحيات منفصلة</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.location.href = '/whatsapp-gemini-settings'}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4" />
                  إعدادات الواتساب
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
      </div>
    </div>
  );
};
