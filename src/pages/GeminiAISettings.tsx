import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  ShoppingCart, 
  Package,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import { toast } from "sonner";

interface GeminiAISettings {
  is_enabled: boolean;
  use_existing_prompt: boolean;
  custom_prompt: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  can_access_orders: boolean;
  can_access_products: boolean;
  auto_reply_enabled: boolean;
}

export const GeminiAISettings: React.FC = () => {
  const [settings, setSettings] = useState<GeminiAISettings>({
    is_enabled: false,
    use_existing_prompt: true,
    custom_prompt: '',
    api_key: '',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    max_tokens: 1000,
    can_access_orders: true,
    can_access_products: true,
    auto_reply_enabled: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // تحميل الإعدادات الحالية
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/ai-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
      toast.error('فشل في تحميل إعدادات الذكاء الاصطناعي');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/ai-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('تم حفظ الإعدادات بنجاح');
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error('فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const testAI = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'مرحباً، هذه رسالة اختبار',
          settings: settings
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTestResult('success');
          toast.success('اختبار الذكاء الاصطناعي نجح');
        } else {
          setTestResult('error');
          toast.error('فشل اختبار الذكاء الاصطناعي');
        }
      } else {
        setTestResult('error');
        toast.error('فشل في الاتصال بالخادم');
      }
    } catch (error) {
      console.error('خطأ في اختبار الذكاء الاصطناعي:', error);
      setTestResult('error');
      toast.error('حدث خطأ أثناء الاختبار');
    } finally {
      setIsTesting(false);
    }
  };

  const defaultCustomPrompt = `أنت مساعد ذكي لمتجر WhatsApp. اسمك سارة وأنت بائعة لطيفة ومتفهمة.

🎯 مهامك:
- مساعدة العملاء في اختيار المنتجات
- الرد على الاستفسارات بطريقة ودودة
- إنشاء الطلبات عند اكتمال البيانات
- تقديم معلومات المنتجات والأسعار

💬 أسلوب التحدث:
- استخدمي اللهجة المصرية البسيطة
- كوني ودودة ومساعدة
- اشرحي بوضوح ووضوح

🛒 للطلبات:
- اجمعي: الاسم، الهاتف، العنوان، المنتج، المقاس، اللون
- عند اكتمال البيانات: [CREATE_ORDER: البيانات]

📱 للتواصل:
- واتساب: 01032792040
- المتجر: /shop
- السلة: /cart`;

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto" dir="rtl">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="mr-2">جاري تحميل الإعدادات...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <div className="p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            إعدادات Gemini AI للواتساب
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            تكوين نظام الذكاء الاصطناعي للرد التلقائي على رسائل WhatsApp باستخدام Google Gemini
          </p>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={settings.is_enabled ? 'ring-2 ring-green-500' : 'ring-2 ring-gray-300'}>
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${settings.is_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Bot className={`w-6 h-6 ${settings.is_enabled ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-sm font-medium">النظام</p>
              <p className={`text-xs ${settings.is_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.is_enabled ? 'مفعل' : 'معطل'}
              </p>
            </CardContent>
          </Card>

          <Card className={settings.api_key ? 'ring-2 ring-blue-500' : 'ring-2 ring-red-500'}>
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${settings.api_key ? 'bg-blue-100' : 'bg-red-100'}`}>
                <Settings className={`w-6 h-6 ${settings.api_key ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
              <p className="text-sm font-medium">API Key</p>
              <p className={`text-xs ${settings.api_key ? 'text-blue-600' : 'text-red-600'}`}>
                {settings.api_key ? 'متوفر' : 'مطلوب'}
              </p>
            </CardContent>
          </Card>

          <Card className={settings.auto_reply_enabled ? 'ring-2 ring-purple-500' : 'ring-2 ring-gray-300'}>
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${settings.auto_reply_enabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <Zap className={`w-6 h-6 ${settings.auto_reply_enabled ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-sm font-medium">الرد التلقائي</p>
              <p className={`text-xs ${settings.auto_reply_enabled ? 'text-purple-600' : 'text-gray-500'}`}>
                {settings.auto_reply_enabled ? 'مفعل' : 'معطل'}
              </p>
            </CardContent>
          </Card>

          <Card className={settings.can_access_orders && settings.can_access_products ? 'ring-2 ring-orange-500' : 'ring-2 ring-gray-300'}>
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${settings.can_access_orders && settings.can_access_products ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Package className={`w-6 h-6 ${settings.can_access_orders && settings.can_access_products ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-sm font-medium">الصلاحيات</p>
              <p className={`text-xs ${settings.can_access_orders && settings.can_access_products ? 'text-orange-600' : 'text-gray-500'}`}>
                {settings.can_access_orders && settings.can_access_products ? 'كاملة' : 'محدودة'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              إعدادات Gemini AI
            </CardTitle>
            <CardDescription>
              تكوين نظام الذكاء الاصطناعي للرد التلقائي على رسائل WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="general" className="w-full">
              <div className="mb-6">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="general"
                    className="text-sm py-3 px-4 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    الإعدادات العامة
                  </TabsTrigger>
                  <TabsTrigger
                    value="prompts"
                    className="text-sm py-3 px-4 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:bg-gray-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    البرومتات
                  </TabsTrigger>
                  <TabsTrigger
                    value="permissions"
                    className="text-sm py-3 px-4 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold hover:bg-gray-50"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    الصلاحيات
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="general" className="space-y-6 mt-6">
                {/* التفعيل والإعدادات الأساسية */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-fit">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bot className="w-5 h-5 text-blue-600" />
                          التفعيل
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="is_enabled" className="text-sm font-medium cursor-pointer">تفعيل الذكاء الاصطناعي</Label>
                              <p className="text-xs text-gray-500 mt-1">
                                {settings.is_enabled ? '✅ النظام مفعل ويرد تلقائياً' : '❌ النظام معطل'}
                              </p>
                            </div>
                            <Switch
                              id="is_enabled"
                              checked={settings.is_enabled}
                              onCheckedChange={(checked) =>
                                setSettings(prev => ({ ...prev, is_enabled: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="auto_reply_enabled" className="text-sm font-medium cursor-pointer">الرد التلقائي</Label>
                              <p className="text-xs text-gray-500 mt-1">
                                {settings.auto_reply_enabled ? '✅ يرد تلقائياً على الرسائل' : '❌ لا يرد تلقائياً'}
                              </p>
                            </div>
                            <Switch
                              id="auto_reply_enabled"
                              checked={settings.auto_reply_enabled}
                              onCheckedChange={(checked) =>
                                setSettings(prev => ({ ...prev, auto_reply_enabled: checked }))
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="h-fit">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Settings className="w-5 h-5 text-green-600" />
                          API Key
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="api_key" className="text-sm font-medium">Gemini API Key</Label>
                            <Input
                              id="api_key"
                              type="password"
                              value={settings.api_key}
                              onChange={(e) =>
                                setSettings(prev => ({ ...prev, api_key: e.target.value }))
                              }
                              placeholder="أدخل Gemini API Key"
                              className="font-mono mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {settings.api_key ? '✅ تم إدخال API Key' : '❌ يجب إدخال API Key'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* إعدادات النموذج */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        إعدادات النموذج
                      </CardTitle>
                      <CardDescription>تخصيص سلوك الذكاء الاصطناعي</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="model" className="text-sm font-medium">النموذج</Label>
                          <select
                            id="model"
                            value={settings.model}
                            onChange={(e) =>
                              setSettings(prev => ({ ...prev, model: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                          >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gemini-pro">Gemini Pro</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="temperature" className="text-sm font-medium">
                            Temperature ({settings.temperature})
                          </Label>
                          <input
                            id="temperature"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) =>
                              setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <p className="text-xs text-gray-500 text-center">
                            {settings.temperature < 0.3 ? '🔒 محافظ' : settings.temperature > 0.7 ? '🎨 إبداعي' : '⚖️ متوازن'}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="max_tokens" className="text-sm font-medium">الحد الأقصى للكلمات</Label>
                          <Input
                            id="max_tokens"
                            type="number"
                            value={settings.max_tokens}
                            onChange={(e) =>
                              setSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))
                            }
                            min="100"
                            max="2000"
                            className="text-sm"
                          />
                          <p className="text-xs text-gray-500 text-center">
                            {settings.max_tokens < 500 ? '📝 قصير' : settings.max_tokens > 1500 ? '📄 طويل' : '📋 متوسط'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="prompts" className="space-y-6 mt-6">
                <Alert>
                  <MessageSquare className="w-4 h-4" />
                  <AlertDescription>
                    يمكنك اختيار استخدام البرومت الموجود في النظام أو إنشاء برومت مخصص لـ WhatsApp
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={settings.use_existing_prompt ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="existing_prompt"
                          name="prompt_type"
                          checked={settings.use_existing_prompt}
                          onChange={() =>
                            setSettings(prev => ({ ...prev, use_existing_prompt: true }))
                          }
                          className="w-4 h-4"
                        />
                        <Label htmlFor="existing_prompt" className="cursor-pointer">البرومت الموجود</Label>
                        <Badge variant="secondary">موصى به</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          استخدام نفس البرومت المستخدم في النظام الحالي مع جميع الميزات
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✅ نظام هجين للردود العامة والمنتجات</li>
                          <li>✅ إمكانية إنشاء الطلبات تلقائياً</li>
                          <li>✅ الوصول لقاعدة بيانات المنتجات</li>
                          <li>✅ شخصية "سارة" المساعدة الودودة</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={!settings.use_existing_prompt ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="custom_prompt"
                          name="prompt_type"
                          checked={!settings.use_existing_prompt}
                          onChange={() =>
                            setSettings(prev => ({ ...prev, use_existing_prompt: false }))
                          }
                          className="w-4 h-4"
                        />
                        <Label htmlFor="custom_prompt" className="cursor-pointer">برومت مخصص</Label>
                        <Badge variant="outline">متقدم</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          إنشاء برومت مخصص خاص بـ WhatsApp
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>⚙️ تحكم كامل في أسلوب الرد</li>
                          <li>🎭 تخصيص الشخصية والسلوك</li>
                          <li>📋 قواعد مخصصة للتعامل مع الطلبات</li>
                          <li>🔧 مرونة في التعديل والتطوير</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {!settings.use_existing_prompt && (
                  <Card>
                    <CardHeader>
                      <CardTitle>البرومت المخصص</CardTitle>
                      <CardDescription>اكتب البرومت الخاص بك أو استخدم النموذج الافتراضي</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        id="custom_prompt_text"
                        value={settings.custom_prompt}
                        onChange={(e) =>
                          setSettings(prev => ({ ...prev, custom_prompt: e.target.value }))
                        }
                        placeholder={defaultCustomPrompt}
                        rows={12}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSettings(prev => ({ ...prev, custom_prompt: defaultCustomPrompt }))
                        }
                      >
                        استخدام البرومت الافتراضي
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {settings.use_existing_prompt && (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      سيتم استخدام نفس البرومت المستخدم في النظام الحالي مع إمكانية الوصول للطلبات والمنتجات
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 mt-6">
                <Alert>
                  <Settings className="w-4 h-4" />
                  <AlertDescription>
                    تحديد ما يمكن للذكاء الاصطناعي الوصول إليه من بيانات النظام
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={settings.can_access_orders ? 'ring-2 ring-green-500' : 'ring-2 ring-gray-200'}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className={`w-5 h-5 ${settings.can_access_orders ? 'text-green-600' : 'text-gray-400'}`} />
                        الوصول للطلبات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">السماح بالوصول للطلبات</span>
                          <Switch
                            checked={settings.can_access_orders}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, can_access_orders: checked }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {settings.can_access_orders ? '✅ مفعل' : '❌ معطل'}
                          </p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li>• عرض الطلبات السابقة</li>
                            <li>• إنشاء طلبات جديدة</li>
                            <li>• تتبع حالة الطلبات</li>
                            <li>• تحديث بيانات الطلبات</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={settings.can_access_products ? 'ring-2 ring-blue-500' : 'ring-2 ring-gray-200'}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className={`w-5 h-5 ${settings.can_access_products ? 'text-blue-600' : 'text-gray-400'}`} />
                        الوصول للمنتجات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">السماح بالوصول للمنتجات</span>
                          <Switch
                            checked={settings.can_access_products}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, can_access_products: checked }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {settings.can_access_products ? '✅ مفعل' : '❌ معطل'}
                          </p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li>• عرض معلومات المنتجات</li>
                            <li>• الأسعار والمقاسات</li>
                            <li>• حالة المخزون</li>
                            <li>• الألوان المتاحة</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ملخص الصلاحيات */}
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص الصلاحيات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">الصلاحيات المفعلة:</h4>
                        <ul className="text-sm space-y-1">
                          {settings.can_access_orders && (
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              إدارة الطلبات
                            </li>
                          )}
                          {settings.can_access_products && (
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              عرض المنتجات
                            </li>
                          )}
                          {!settings.can_access_orders && !settings.can_access_products && (
                            <li className="text-gray-500">لا توجد صلاحيات مفعلة</li>
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-orange-600">التوصيات:</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                          <li>• فعل الوصول للمنتجات لتحسين الردود</li>
                          <li>• فعل الوصول للطلبات لخدمة أفضل</li>
                          <li>• يمكن تعطيل الصلاحيات حسب الحاجة</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* أزرار الإجراءات */}
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={testAI}
                        variant="outline"
                        disabled={isTesting || !settings.api_key}
                        className="flex items-center gap-2"
                      >
                        {isTesting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        اختبار الذكاء الاصطناعي
                      </Button>

                      {testResult && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm">
                          {testResult === 'success' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600 font-medium">نجح الاختبار ✅</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-red-600 font-medium">فشل الاختبار ❌</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={saveSettings}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      حفظ الإعدادات
                    </Button>
                  </div>

                  {/* معلومات إضافية */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${settings.is_enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>النظام: {settings.is_enabled ? 'مفعل' : 'معطل'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${settings.api_key ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>API Key: {settings.api_key ? 'متوفر' : 'مطلوب'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${settings.auto_reply_enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>الرد التلقائي: {settings.auto_reply_enabled ? 'مفعل' : 'معطل'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Tabs>
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

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};
