
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Facebook, Key, Bell, Clock, Shield, Loader2, CheckCircle, AlertCircle, Bot, Activity, Trash2, Power, RotateCcw, AlertTriangle, Unplug, MessageSquare } from "lucide-react";
import WebhookDiagnostics from "@/components/WebhookDiagnostics";
import { useToast } from "@/hooks/use-toast";
import { useFacebookApi } from "@/hooks/useFacebookApi";



const Settings = () => {
  const { toast } = useToast();
  const [tempAccessToken, setTempAccessToken] = useState("EAAUpPO0SIEABO9ihG4UZBS1qLGUzMDGxcZAJP0SZAm9jYfLv6O6SmTQNmEYaXRW6rH8zMT6Iiu57wJRUZC9ipGlCF5y0bBFeJvU45DqfZAiqCuplQC00G92hcOAZChINt6TJQxuAehClhABkR9wvkgENRnmecUMqw5wrYCQZCB48zD32U7reTZC3cl5imCaSkHsKXq0aZBj5auHkZCZAJcoY0gNnqd7");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [showAddPageForm, setShowAddPageForm] = useState(false);
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
    disconnectPage,
    deletePage,
    reactivatePage,
    resetForNewConnection,
    isTestingConnection,
    isConnectingPage,
    isDisconnectingPage,
    isDeletingPage,
    isReactivatingPage,
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
    }, {
      onSuccess: () => {
        // إخفاء الـ form بعد النجاح
        setShowAddPageForm(false);
        setTempAccessToken("");
        setSelectedPageId("");
      }
    });
  };

  const handleDisconnect = () => {
    disconnect.mutate();
  };

  const handleDisconnectPage = (pageId: string, pageName: string) => {
    if (window.confirm(`هل أنت متأكد من قطع الاتصال مع صفحة "${pageName}"؟\n\n⚠️ سيتم:\n- إيقاف استقبال الرسائل مؤقتاً\n- إزالة الـ Access Token مؤقتاً\n- يمكن إعادة التفعيل لاحقاً بدون إعادة ربط`)) {
      disconnectPage.mutate(pageId);
    }
  };

  const handleDeletePage = (pageId: string, pageName: string) => {
    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف صفحة "${pageName}" نهائياً؟\n\nسيتم حذف جميع الإعدادات والبيانات المرتبطة بهذه الصفحة ولا يمكن التراجع عن هذا الإجراء!`)) {
      if (window.confirm(`تأكيد نهائي: اكتب "نعم" للمتابعة أو ألغِ العملية.`)) {
        deletePage.mutate(pageId);
      }
    }
  };

  const handleReactivatePage = (pageId: string, pageName: string) => {
    if (window.confirm(`هل تريد إعادة تفعيل صفحة "${pageName}"؟\n\n✅ سيتم:\n- استئناف استقبال الرسائل\n- إرجاع الـ Access Token المحفوظ\n- تفعيل جميع الوظائف`)) {
      reactivatePage.mutate(pageId);
    }
  };

  // 🔧 التحكم الذكي في الـ Webhook
  const handleToggleWebhook = async (pageId: string, pageName: string, enabled: boolean) => {
    const action = enabled ? 'تشغيل' : 'إيقاف';
    const confirmMessage = enabled
      ? `هل أنت متأكد من تشغيل استقبال الرسائل لصفحة "${pageName}"؟\n\n✅ سيتم:\n- تشغيل الـ webhook\n- بدء استقبال الرسائل فور سؤال`
      : `هل أنت متأكد من إيقاف استقبال الرسائل لصفحة "${pageName}"؟\n\n⚠️ سيتم:\n- إيقاف الـ webhook\n- توقف استقبال الرسائل فور سؤال\n- الصفحة ستبقى مربوطة`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`/api/facebook/webhook/${pageId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast({
            title: `تم ${action} الـ webhook بنجاح`,
            description: `تم ${action} استقبال الرسائل لصفحة ${pageName}`,
          });

          // إعادة تحميل الصفحات
          window.location.reload();
        } else {
          throw new Error(result.error || `فشل في ${action} الـ webhook`);
        }
      } catch (error: any) {
        toast({
          title: `خطأ في ${action} الـ webhook`,
          description: error.message || `حدث خطأ أثناء ${action} الـ webhook`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-y-auto" dir="rtl">
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span>ربط صفحات فيسبوك</span>
                </div>
                {connectedPages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // إعادة تعيين الحالة المحلية فقط
                      setTempAccessToken("");
                      setSelectedPageId("");
                      setShowAddPageForm(true);

                      // إظهار رسالة توضيحية
                      toast({
                        title: "جاهز لربط صفحة جديدة",
                        description: "أدخل Access Token جديد لربط صفحة أخرى",
                      });
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                  >
                    <Facebook className="w-4 h-4 ml-2" />
                    إضافة صفحة
                  </Button>
                )}
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

              {(!isConnected || !savedSettings || showAddPageForm) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-800">ربط صفحات فيسبوك</h4>
                    {showAddPageForm && connectedPages.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddPageForm(false);
                          setTempAccessToken("");
                          setSelectedPageId("");
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕ إلغاء
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-yellow-700 mb-4">
                    يمكنك ربط عدة صفحات فيسبوك لإدارة جميع المحادثات من مكان واحد
                  </p>

                  <div className="space-y-4">
                    {(!isConnected || showAddPageForm) && (
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
                        <p className="text-xs text-gray-500 mt-1">
                          احصل على الـ Access Token من Facebook Developer Console
                        </p>
                      </div>
                    )}

                    {isConnected && (showAddPageForm || !savedSettings) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ تم الاتصال بنجاح! الآن اختر الصفحة التي تريد ربطها.
                        </p>
                      </div>
                    )}

                    {pages.length > 0 && (showAddPageForm || !savedSettings) && (
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

                    {pages.length > 0 && (showAddPageForm || !savedSettings) && (
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

                    {pagesError && (showAddPageForm || !savedSettings) && (
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
                  {connectedPages.map((page, index) => {
                    const isActive = page.is_active !== false;
                    const isDisconnected = page.disconnected_at;
                    const hasAccessToken = page.has_access_token;
                    const hasBackupToken = page.has_backup_token;
                    const canReactivate = page.can_reactivate;

                    return (
                      <div key={page.id} className={`p-4 border rounded-lg ${
                        isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 text-sm">
                            <p className={isActive ? 'text-green-700' : 'text-gray-600'}>
                              <strong>الصفحة:</strong> {page.page_name}
                            </p>
                            <p className={isActive ? 'text-green-700' : 'text-gray-600'}>
                              <strong>معرف الصفحة:</strong> {page.page_id}
                            </p>
                            <p className={isActive ? 'text-green-700' : 'text-gray-600'}>
                              <strong>تاريخ الربط:</strong> {new Date(page.created_at).toLocaleDateString('ar-EG')}
                            </p>
                            {isDisconnected && (
                              <p className="text-gray-500">
                                <strong>تاريخ قطع الاتصال:</strong> {new Date(page.disconnected_at).toLocaleDateString('ar-EG')}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-xs">
                                <strong>Access Token:</strong>
                              </span>
                              {hasAccessToken ? (
                                <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                                  متوفر
                                </Badge>
                              ) : hasBackupToken ? (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                                  محفوظ احتياطي
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 text-xs">
                                  غير متوفر
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 space-x-reverse">
                            {/* حالة الصفحة */}
                            <Badge variant={isActive ? "default" : "secondary"} className={
                              isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                            }>
                              {isActive ? (
                                <><CheckCircle className="w-3 h-3 ml-1" /> نشط</>
                              ) : (
                                <><Power className="w-3 h-3 ml-1" /> معطل</>
                              )}
                            </Badge>

                            {/* بادج الصفحة الرئيسية */}
                            {index === 0 && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                الرئيسية
                              </Badge>
                            )}

                            {/* أزرار التحكم الذكي */}
                            <div className="flex items-center space-x-1 space-x-reverse">
                              {isActive && hasAccessToken ? (
                                <>
                                  {/* إيقاف الرسائل */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleWebhook(page.page_id, page.page_name, false)}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="إيقاف استقبال الرسائل مؤقتاً"
                                  >
                                    <Power className="w-3 h-3" />
                                  </Button>

                                  {/* قطع الاتصال */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDisconnectPage(page.page_id, page.page_name)}
                                    disabled={isDisconnectingPage}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="قطع الاتصال مؤقتاً"
                                  >
                                    {isDisconnectingPage ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Unplug className="w-3 h-3" />
                                    )}
                                  </Button>

                                  {/* حذف نهائي */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePage(page.page_id, page.page_name)}
                                    disabled={isDeletingPage}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="حذف نهائي"
                                  >
                                    {isDeletingPage ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </Button>
                                </>
                              ) : canReactivate ? (
                                <>
                                  {/* تشغيل الرسائل */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleWebhook(page.page_id, page.page_name, true)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="تشغيل استقبال الرسائل"
                                  >
                                    <Power className="w-3 h-3" />
                                  </Button>

                                  {/* إعادة تفعيل */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReactivatePage(page.page_id, page.page_name)}
                                    disabled={isReactivatingPage}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="إعادة تفعيل"
                                  >
                                    {isReactivatingPage ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RotateCcw className="w-3 h-3" />
                                    )}
                                  </Button>

                                  {/* حذف نهائي */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePage(page.page_id, page.page_name)}
                                    disabled={isDeletingPage}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="حذف نهائي"
                                  >
                                    {isDeletingPage ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {/* إعادة ربط مطلوبة */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "إعادة ربط مطلوبة",
                                        description: "هذه الصفحة تحتاج إعادة ربط كاملة. يرجى حذفها وإضافتها مرة أخرى.",
                                        variant: "destructive",
                                      });
                                    }}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="إعادة ربط مطلوبة"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                  </Button>

                                  {/* حذف نهائي */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePage(page.page_id, page.page_name)}
                                    disabled={isDeletingPage}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="حذف نهائي"
                                  >
                                    {isDeletingPage ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* مؤشر حالة الـ Webhook */}
                        <div className="mt-3 p-2 border rounded text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ml-2 ${
                                isActive && page.webhook_enabled !== false ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className="font-medium">حالة الـ Webhook:</span>
                            </div>
                            <Badge variant={isActive && page.webhook_enabled !== false ? "default" : "secondary"} className={
                              isActive && page.webhook_enabled !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }>
                              {isActive && page.webhook_enabled !== false ? "نشط - يستقبل رسائل" : "معطل - لا يستقبل رسائل"}
                            </Badge>
                          </div>
                        </div>

                        {/* تحذير للصفحات المعطلة */}
                        {!isActive && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <div className="flex items-center text-yellow-700">
                              <AlertTriangle className="w-4 h-4 ml-2" />
                              <span>هذه الصفحة معطلة ولا تستقبل رسائل جديدة</span>
                            </div>
                            <div className="mt-1 text-xs text-yellow-600">
                              {hasBackupToken ?
                                "تم إزالة الـ Access Token مؤقتاً - يمكن إعادة التفعيل" :
                                "لا يوجد Access Token محفوظ - يتطلب إعادة ربط كاملة"
                              }
                            </div>
                          </div>
                        )}

                        {/* تحذير للصفحات بدون Access Token */}
                        {!hasAccessToken && !hasBackupToken && isActive && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                            <div className="flex items-center text-red-700">
                              <AlertTriangle className="w-4 h-4 ml-2" />
                              <span>هذه الصفحة بدون Access Token ولا تعمل</span>
                            </div>
                            <div className="mt-1 text-xs text-red-600">
                              يرجى حذف الصفحة وإعادة ربطها مرة أخرى
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                        // إعادة تعيين الحالة المحلية فقط
                        setTempAccessToken("");
                        setSelectedPageId("");
                        setShowAddPageForm(true);

                        // إظهار رسالة توضيحية
                        toast({
                          title: "جاهز لربط صفحة جديدة",
                          description: "أدخل Access Token جديد لربط صفحة أخرى",
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

              {/* زر إضافة صفحة جديدة عند عدم وجود صفحات */}
              {connectedPages.length === 0 && !isConnected && !savedSettings && (
                <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <Facebook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد صفحات مربوطة</h3>
                  <p className="text-gray-600 mb-4">ابدأ بربط أول صفحة فيسبوك</p>
                  <Button
                    onClick={() => {
                      // إعادة تعيين الحالة المحلية فقط
                      setTempAccessToken("");
                      setSelectedPageId("");
                      setShowAddPageForm(true);

                      // إظهار رسالة توضيحية
                      toast({
                        title: "ابدأ ربط صفحة فيسبوك",
                        description: "أدخل Access Token لربط أول صفحة",
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Facebook className="w-4 h-4 ml-2" />
                    ربط صفحة فيسبوك
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>



          {/* Quick Access to AI Settings */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Bot className="w-5 h-5 text-purple-600" />
                <span>إعدادات الذكاء الاصطناعي</span>
              </CardTitle>
              <CardDescription>
                الوصول السريع لإعدادات Gemini AI للمنصات المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      إعدادات الواتساب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      تكوين Gemini AI للرد التلقائي على رسائل WhatsApp
                    </p>
                    <Button
                      onClick={() => window.location.href = '/whatsapp-gemini-settings'}
                      className="w-full"
                    >
                      فتح إعدادات الواتساب
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      إعدادات الفيسبوك
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      تكوين Gemini AI للرد التلقائي على رسائل وتعليقات Facebook
                    </p>
                    <Button
                      onClick={() => window.location.href = '/facebook-ai-settings'}
                      className="w-full"
                      variant="outline"
                    >
                      فتح إعدادات الفيسبوك
                    </Button>
                  </CardContent>
                </Card>
              </div>
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



          {/* Webhook Diagnostics */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Activity className="w-5 h-5 text-orange-600" />
                <span>تشخيص الـ Webhook</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookDiagnostics />
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
