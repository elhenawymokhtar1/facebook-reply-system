
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Facebook, Key, Bell, Clock, Shield, Loader2, CheckCircle, AlertCircle, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFacebookApi } from "@/hooks/useFacebookApi";
import { GeminiSettings } from "@/components/GeminiSettings";

const Settings = () => {
  const { toast } = useToast();
  const [tempAccessToken, setTempAccessToken] = useState("EAAUpPO0SIEABO9ihG4UZBS1qLGUzMDGxcZAJP0SZAm9jYfLv6O6SmTQNmEYaXRW6rH8zMT6Iiu57wJRUZC9ipGlCF5y0bBFeJvU45DqfZAiqCuplQC00G92hcOAZChINt6TJQxuAehClhABkR9wvkgENRnmecUMqw5wrYCQZCB48zD32U7reTZC3cl5imCaSkHsKXq0aZBj5auHkZCZAJcoY0gNnqd7");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [settings, setSettings] = useState({
    autoReply: true,
    notificationsEnabled: true,
    responseDelay: 5,
    workingHours: {
      enabled: true,
      start: "09:00",
      end: "18:00"
    }
  });

  const {
    accessToken,
    isConnected,
    isLoadingSettings,
    savedSettings,
    pages,
    isLoadingPages,
    pagesError,
    connectedPages,
    isLoadingConnectedPages,
    setAccessToken,
    testConnection,
    connectPage,
    disconnect,
    resetForNewConnection,
    isTestingConnection,
    isConnectingPage,
  } = useFacebookApi();

  const handleSaveSettings = () => {
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم حفظ جميع الإعدادات بنجاح",
    });
  };

  const handleTestConnection = () => {
    if (!tempAccessToken.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز الوصول",
        variant: "destructive",
      });
      return;
    }
    testConnection.mutate(tempAccessToken);
  };

  const handleConnectPage = () => {
    if (!selectedPageId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صفحة",
        variant: "destructive",
      });
      return;
    }

    const selectedPage = pages.find(page => page.id === selectedPageId);
    if (!selectedPage) return;

    connectPage.mutate({
      pageId: selectedPage.id,
      pageAccessToken: selectedPage.access_token,
      pageName: selectedPage.name,
    });
  };

  const handleDisconnect = () => {
    disconnect.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الإعدادات</h1>
          <p className="text-gray-600">إدارة إعدادات الحساب والردود الآلية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Facebook Connection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span>ربط صفحات فيسبوك</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSettings ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin ml-2" />
                  <span>تحميل الإعدادات...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">صفحات الفيسبوك</h3>
                      <p className="text-sm text-gray-600">
                        {connectedPages.length > 0 ?
                          `متصل - ${connectedPages.length} صفحة مربوطة` :
                          isConnected && savedSettings ?
                          `متصل - ${savedSettings.page_name || 'صفحة غير محددة'}` :
                          "يمكنك ربط عدة صفحات فيسبوك"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant={connectedPages.length > 0 || isConnected ? "default" : "secondary"} className={
                      connectedPages.length > 0 || isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }>
                      {connectedPages.length > 0 || isConnected ? (
                        <><CheckCircle className="w-3 h-3 ml-1" /> متصل</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 ml-1" /> غير متصل</>
                      )}
                    </Badge>
                    {(connectedPages.length > 0 || isConnected) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        className="text-red-600 hover:text-red-700"
                      >
                        قطع الاتصال
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {(!isConnected || !savedSettings) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">ربط صفحات فيسبوك</h4>
                  <p className="text-sm text-yellow-700 mb-4">
                    يمكنك ربط عدة صفحات فيسبوك لإدارة جميع المحادثات من مكان واحد
                  </p>

                  <div className="space-y-4">
                    {!isConnected && (
                      <div>
                        <Label htmlFor="access-token">رمز الوصول (Access Token)</Label>
                        <div className="flex space-x-2 space-x-reverse mt-1">
                          <Input
                            id="access-token"
                            type="password"
                            placeholder="أدخل رمز الوصول الخاص بك..."
                            value={tempAccessToken}
                            onChange={(e) => setTempAccessToken(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={isTestingConnection || !tempAccessToken.trim()}
                          >
                            {isTestingConnection ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Key className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {isConnected && !savedSettings && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ تم الاتصال بنجاح! الآن اختر الصفحات التي تريد ربطها.
                        </p>
                      </div>
                    )}

                    {pages.length > 0 && (
                      <div>
                        <Label htmlFor="page-select">اختر الصفحة</Label>
                        <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر صفحة للربط..." />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.map((page) => (
                              <SelectItem key={page.id} value={page.id}>
                                {page.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {pages.length > 0 && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                        onClick={handleConnectPage}
                        disabled={isConnectingPage || !selectedPageId}
                      >
                        {isConnectingPage ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : (
                          <Facebook className="w-4 h-4 ml-2" />
                        )}
                        ربط هذه الصفحة
                      </Button>
                    )}

                    {pagesError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          خطأ: {pagesError.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* عرض الصفحات المربوطة */}
              {connectedPages.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 mb-3">الصفحات المربوطة ({connectedPages.length})</h4>
                  {connectedPages.map((page, index) => (
                    <div key={page.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 text-sm text-green-700">
                          <p><strong>الصفحة:</strong> {page.page_name}</p>
                          <p><strong>معرف الصفحة:</strong> {page.page_id}</p>
                          <p><strong>تاريخ الربط:</strong> {new Date(page.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            متصل
                          </Badge>
                          {index === 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              الرئيسية
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isConnected && savedSettings && connectedPages.length === 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">تم الربط بنجاح!</h4>
                    <div className="space-y-2 text-sm text-green-700">
                      <p><strong>الصفحة:</strong> {savedSettings.page_name}</p>
                      <p><strong>معرف الصفحة:</strong> {savedSettings.page_id}</p>
                      <p><strong>تاريخ الربط:</strong> {new Date(savedSettings.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">💡 ربط صفحات إضافية</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      لربط صفحات إضافية، كرر نفس العملية: أدخل Access Token جديد واختر صفحة أخرى.
                      ستظهر جميع المحادثات من الصفحات المربوطة في صفحة المحادثات.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // إعادة تعيين الحالة المحلية
                        setTempAccessToken("");
                        setSelectedPageId("");

                        // إعادة تعيين حالة الاتصال في الـ hook
                        resetForNewConnection();

                        // إظهار رسالة توضيحية
                        toast({
                          title: "جاهز لربط صفحة جديدة",
                          description: "يمكنك الآن إدخال Access Token جديد لربط صفحة أخرى",
                        });
                      }}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                    >
                      <Facebook className="w-4 h-4 ml-2" />
                      ربط صفحة جديدة
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="webhook-url">رابط Webhook</Label>
                    <div className="space-y-3 mt-1">
                      <Input
                        id="webhook-url"
                        placeholder="https://your-domain.com:3001/webhook"
                        value={savedSettings.webhook_url || 'http://localhost:3001/webhook'}
                        className="font-mono text-sm"
                        readOnly
                      />

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">إعداد Webhook:</h4>
                        <div className="space-y-2 text-sm text-blue-700">
                          <div className="flex items-center justify-between">
                            <span>URL:</span>
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                              http://localhost:3001/webhook
                            </code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Verify Token:</span>
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                              facebook_webhook_verify_token_2024
                            </code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Events:</span>
                            <span className="text-xs">messages, messaging_postbacks</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">خطوات التفعيل:</h4>
                        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                          <li>شغل خادم Webhook: <code className="bg-yellow-100 px-1 rounded">npm run webhook</code></li>
                          <li>استخدم ngrok للوصول العام: <code className="bg-yellow-100 px-1 rounded">ngrok http 3001</code></li>
                          <li>أضف URL في Facebook Developer Console</li>
                          <li>اشترك في الأحداث: messages, messaging_postbacks</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>



          {/* Gemini AI Settings */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Bot className="w-5 h-5 text-purple-600" />
                <span>Gemini AI - الذكاء الاصطناعي</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GeminiSettings />
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Shield className="w-5 h-5 text-green-600" />
                <span>إعدادات سريعة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">الرد الآلي</h4>
                  <p className="text-sm text-gray-600">تفعيل الردود الآلية</p>
                </div>
                <Switch
                  checked={settings.autoReply}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, autoReply: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">الإشعارات</h4>
                  <p className="text-sm text-gray-600">تلقي إشعارات الرسائل</p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, notificationsEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">أوقات العمل</h4>
                  <p className="text-sm text-gray-600">الرد خلال أوقات محددة</p>
                </div>
                <Switch
                  checked={settings.workingHours.enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, enabled: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Response Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>إعدادات الردود</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="response-delay">تأخير الرد (بالثواني)</Label>
                <Input
                  id="response-delay"
                  type="number"
                  min="0"
                  max="60"
                  value={settings.responseDelay}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, responseDelay: parseInt(e.target.value) }))
                  }
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">
                  الوقت بالثواني قبل إرسال الرد الآلي
                </p>
              </div>

              {settings.workingHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work-start">بداية العمل</Label>
                    <Input
                      id="work-start"
                      type="time"
                      value={settings.workingHours.start}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start: e.target.value }
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="work-end">نهاية العمل</Label>
                    <Input
                      id="work-end"
                      type="time"
                      value={settings.workingHours.end}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end: e.target.value }
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="default-response">الرد الافتراضي</Label>
                <Textarea
                  id="default-response"
                  placeholder="الرد الذي سيُرسل عندما لا توجد كلمة مفتاحية مطابقة..."
                  className="mt-1 h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Bell className="w-5 h-5 text-orange-600" />
                <span>الإشعارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">
                  ستتلقى إشعارات عند وصول رسائل جديدة
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>رسائل جديدة</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>فشل في الرد</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>تقارير يومية</span>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
