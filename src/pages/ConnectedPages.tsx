import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFacebookApi } from '@/hooks/useFacebookApi';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import {
  Facebook,
  Search,
  Plus,
  Settings,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  Users,
  MessageSquare,
  Calendar,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  BarChart3
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ConnectedPages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const { company } = useCurrentCompany();

  const {
    connectedPages: realConnectedPages,
    isLoadingConnectedPages,
    disconnectPage,
    deletePage,
    reactivatePage,
    isDisconnectingPage,
    isDeletingPage,
    isReactivatingPage,
  } = useFacebookApi();

  // استخدام البيانات الحقيقية فقط - تم إزالة البيانات التجريبية
  const connectedPages = realConnectedPages;

  // فلترة الصفحات حسب البحث
  const filteredPages = connectedPages.filter(page =>
    page.page_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_id?.includes(searchTerm)
  );

  // إحصائيات سريعة
  const stats = {
    total: connectedPages.length,
    active: connectedPages.filter(page => page.is_active !== false).length,
    inactive: connectedPages.filter(page => page.is_active === false).length,
    disconnected: connectedPages.filter(page => page.disconnected_at).length,
  };

  const handleDisconnect = async (pageId: string) => {
    try {
      await disconnectPage.mutateAsync(pageId);
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error);
    }
  };

  const handleDelete = async (pageId: string) => {
    try {
      await deletePage.mutateAsync(pageId);
    } catch (error) {
      console.error('خطأ في الحذف:', error);
    }
  };

  const handleReactivate = async (pageId: string) => {
    try {
      await reactivatePage.mutateAsync(pageId);
    } catch (error) {
      console.error('خطأ في إعادة التفعيل:', error);
    }
  };

  const getPageStatus = (page: any) => {
    if (page.disconnected_at) return 'disconnected';
    if (page.is_active === false) return 'inactive';
    if (!page.has_access_token) return 'no_token';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">معطل</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">منقطع</Badge>;
      case 'no_token':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">بحاجة إعادة ربط</Badge>;
      default:
        return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <PowerOff className="w-4 h-4 text-yellow-600" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'no_token':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoadingConnectedPages) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">جاري تحميل الصفحات المربوطة...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Facebook className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">الصفحات المربوطة</h1>
                <p className="text-gray-600">إدارة جميع صفحات Facebook المربوطة بـ {company?.name}</p>
                {connectedPages.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    📭 لا توجد صفحات مربوطة - قم بربط صفحات من الإعدادات
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة تحميل
              </Button>
              <Button
                onClick={() => window.location.href = '/settings'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                ربط صفحة جديدة
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الصفحات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الصفحات النشطة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الصفحات المعطلة</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
                </div>
                <PowerOff className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الصفحات المنقطعة</p>
                  <p className="text-2xl font-bold text-red-600">{stats.disconnected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-1">
                <Label htmlFor="search">البحث في الصفحات</Label>
                <div className="relative mt-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="ابحث بالاسم أو معرف الصفحة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages List */}
        <div className="space-y-4">
          {filteredPages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Facebook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'لا توجد نتائج' : 'لا توجد صفحات مربوطة'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'لم يتم العثور على صفحات تطابق البحث'
                    : 'لم يتم ربط أي صفحات Facebook بعد'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => window.location.href = '/settings'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    ربط صفحة جديدة
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPages.map((page) => {
              const status = getPageStatus(page);
              return (
                <Card key={page.page_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {page.page_name || `صفحة ${page.page_id}`}
                            </h3>
                            {getStatusBadge(status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <span className="flex items-center space-x-1 space-x-reverse">
                              <Globe className="w-4 h-4" />
                              <span>معرف: {page.page_id}</span>
                            </span>
                            {page.created_at && (
                              <span className="flex items-center space-x-1 space-x-reverse">
                                <Calendar className="w-4 h-4" />
                                <span>تم الربط: {new Date(page.created_at).toLocaleDateString('ar-EG')}</span>
                              </span>
                            )}
                            {page.updated_at && (
                              <span className="flex items-center space-x-1 space-x-reverse">
                                <RefreshCw className="w-4 h-4" />
                                <span>آخر تحديث: {new Date(page.updated_at).toLocaleDateString('ar-EG')}</span>
                              </span>
                            )}
                            {page.disconnected_at && (
                              <span className="flex items-center space-x-1 space-x-reverse text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span>انقطع في: {new Date(page.disconnected_at).toLocaleDateString('ar-EG')}</span>
                              </span>
                            )}
                          </div>

                          {/* Additional Info */}
                          <div className="mt-3 flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                            {page.has_access_token && (
                              <span className="flex items-center space-x-1 space-x-reverse">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>رمز الوصول متوفر</span>
                              </span>
                            )}
                            {page.has_backup_token && (
                              <span className="flex items-center space-x-1 space-x-reverse">
                                <RefreshCw className="w-3 h-3 text-blue-500" />
                                <span>رمز احتياطي متوفر</span>
                              </span>
                            )}
                            {page.webhook_enabled && (
                              <span className="flex items-center space-x-1 space-x-reverse">
                                <Settings className="w-3 h-3 text-purple-500" />
                                <span>Webhook مفعل</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        {/* Action Buttons */}
                        {status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/conversations?page=${page.page_id}`}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              المحادثات
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPage(page)}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              التفاصيل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/analytics?page=${page.page_id}`}
                            >
                              <BarChart3 className="w-4 h-4 ml-1" />
                              الإحصائيات
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <PowerOff className="w-4 h-4 ml-1" />
                                  قطع الاتصال
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>قطع الاتصال مع الصفحة</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من قطع الاتصال مع صفحة "{page.page_name}"؟
                                    سيتم الاحتفاظ بالبيانات ويمكن إعادة التفعيل لاحقاً.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDisconnect(page.page_id)}
                                    disabled={isDisconnectingPage}
                                  >
                                    {isDisconnectingPage ? (
                                      <Loader2 className="w-4 h-4 animate-spin ml-1" />
                                    ) : (
                                      <PowerOff className="w-4 h-4 ml-1" />
                                    )}
                                    قطع الاتصال
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}

                        {(status === 'inactive' || status === 'no_token') && page.can_reactivate && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPage(page)}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              التفاصيل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(page.page_id)}
                              disabled={isReactivatingPage}
                              className="bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              {isReactivatingPage ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-1" />
                              ) : (
                                <RefreshCw className="w-4 h-4 ml-1" />
                              )}
                              إعادة تفعيل
                            </Button>
                          </>
                        )}

                        {status === 'disconnected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPage(page)}
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            التفاصيل
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الصفحة</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف صفحة "{page.page_name}"؟
                                سيتم حذف جميع البيانات المرتبطة بها نهائياً.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(page.page_id)}
                                disabled={isDeletingPage}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeletingPage ? (
                                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                                ) : (
                                  <Trash2 className="w-4 h-4 ml-1" />
                                )}
                                حذف نهائي
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Page Details Modal */}
        {selectedPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(getPageStatus(selectedPage))}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedPage.page_name || `صفحة ${selectedPage.page_id}`}
                      </h2>
                      {getStatusBadge(getPageStatus(selectedPage))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPage(null)}
                  >
                    إغلاق
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">المعلومات الأساسية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">اسم الصفحة</Label>
                        <p className="text-gray-900 mt-1">{selectedPage.page_name || 'غير محدد'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">معرف الصفحة</Label>
                        <p className="text-gray-900 mt-1 font-mono text-sm">{selectedPage.page_id}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">تاريخ الربط</Label>
                        <p className="text-gray-900 mt-1">
                          {selectedPage.created_at
                            ? new Date(selectedPage.created_at).toLocaleString('ar-EG')
                            : 'غير محدد'
                          }
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <Label className="text-sm font-medium text-gray-600">آخر تحديث</Label>
                        <p className="text-gray-900 mt-1">
                          {selectedPage.updated_at
                            ? new Date(selectedPage.updated_at).toLocaleString('ar-EG')
                            : 'غير محدد'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">حالة الصفحة</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">حالة الصفحة</span>
                        {getStatusBadge(getPageStatus(selectedPage))}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">رمز الوصول</span>
                        <Badge className={selectedPage.has_access_token ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {selectedPage.has_access_token ? 'متوفر' : 'غير متوفر'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">رمز احتياطي</span>
                        <Badge className={selectedPage.has_backup_token ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                          {selectedPage.has_backup_token ? 'متوفر' : 'غير متوفر'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Webhook</span>
                        <Badge className={selectedPage.webhook_enabled ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}>
                          {selectedPage.webhook_enabled ? 'مفعل' : 'معطل'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Disconnection Info */}
                  {selectedPage.disconnected_at && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">معلومات الانقطاع</h3>
                      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-red-800">تم قطع الاتصال</span>
                        </div>
                        <p className="text-red-700 text-sm">
                          تاريخ الانقطاع: {new Date(selectedPage.disconnected_at).toLocaleString('ar-EG')}
                        </p>
                        {selectedPage.disconnection_reason && (
                          <p className="text-red-700 text-sm mt-1">
                            السبب: {selectedPage.disconnection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">الإجراءات المتاحة</h3>
                    <div className="flex flex-wrap gap-2">
                      {getPageStatus(selectedPage) === 'active' && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedPage(null);
                              window.location.href = `/conversations?page=${selectedPage.page_id}`;
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <MessageSquare className="w-4 h-4 ml-1" />
                            عرض المحادثات
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedPage(null);
                              window.location.href = `/analytics?page=${selectedPage.page_id}`;
                            }}
                            variant="outline"
                          >
                            <BarChart3 className="w-4 h-4 ml-1" />
                            الإحصائيات
                          </Button>
                        </>
                      )}
                      {selectedPage.can_reactivate && (
                        <Button
                          onClick={() => {
                            handleReactivate(selectedPage.page_id);
                            setSelectedPage(null);
                          }}
                          disabled={isReactivatingPage}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isReactivatingPage ? (
                            <Loader2 className="w-4 h-4 animate-spin ml-1" />
                          ) : (
                            <RefreshCw className="w-4 h-4 ml-1" />
                          )}
                          إعادة تفعيل
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectedPages;
