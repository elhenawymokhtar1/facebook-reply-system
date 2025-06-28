/**
 * 👑 صفحة تفاصيل الشركة للمدير الأساسي
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  Crown,
  Users,
  ShoppingBag,
  MessageSquare,
  Settings,
  ArrowLeft,
  Loader2,
  Globe,
  MapPin,
  CreditCard,
  Activity,
  TrendingUp
} from 'lucide-react';

interface CompanyDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  company_subscriptions?: any[];
  stores?: any[];
  users?: any[];
  conversations?: any[];
  products?: any[];
}

const SuperAdminCompanyDetails: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAsLoading, setLoginAsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب تفاصيل الشركة مع جميع البيانات المرتبطة
  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);

      // جلب تفاصيل الشركة الأساسية
      const [companyResponse, usersResponse] = await Promise.all([
        fetch(`http://localhost:3002/api/subscriptions/admin/company/${companyId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`http://localhost:3002/api/subscriptions/companies/${companyId}/users`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      ]);

      const companyResult = await companyResponse.json();
      const usersResult = await usersResponse.json();

      if (companyResult.success && companyResult.data) {
        // دمج بيانات المستخدمين مع بيانات الشركة
        const companyData = {
          ...companyResult.data,
          users: usersResult.success ? usersResult.data : []
        };

        setCompany(companyData);
        setError(null);
        console.log('✅ تم جلب تفاصيل الشركة مع المستخدمين:', companyData);
      } else {
        setError('فشل في جلب تفاصيل الشركة');
        console.error('فشل في جلب تفاصيل الشركة:', companyResult.message);
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل الشركة:', error);
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الدخول كشركة
  const handleLoginAsCompany = async () => {
    if (!company) return;
    
    try {
      setLoginAsLoading(true);
      
      const superAdmin = JSON.parse(localStorage.getItem('superAdmin') || '{}');
      
      const response = await fetch('http://localhost:3002/api/subscriptions/admin/login-as-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          superAdminId: superAdmin.id,
          companyId: company.id
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        localStorage.setItem('company', JSON.stringify(result.data.company));
        localStorage.setItem('superAdminSession', JSON.stringify({
          superAdmin: result.data.superAdmin,
          originalLoginType: 'super_admin_as_company',
          loginAsCompany: true
        }));
        
        alert(`تم تسجيل الدخول كشركة ${company.name} 👑`);
        navigate('/company-dashboard');
      } else {
        alert(result.message || 'فشل في تسجيل الدخول كشركة');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول كشركة:', error);
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setLoginAsLoading(false);
    }
  };

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId]);

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>🔄 جاري تحميل تفاصيل الشركة...</p>
          <p className="text-sm">معرف الشركة: {companyId}</p>
        </div>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="text-lg font-bold mb-2">❌ خطأ في تحميل الشركة</h3>
          <p className="mb-2">{error}</p>
          <p className="text-sm mb-4">معرف الشركة: {companyId}</p>
          <button
            onClick={() => navigate('/super-admin-dashboard')}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  // عرض حالة عدم وجود الشركة
  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h3 className="text-lg font-bold mb-2">⚠️ الشركة غير موجودة</h3>
          <p className="mb-2">لم يتم العثور على الشركة المطلوبة</p>
          <p className="text-sm mb-4">معرف الشركة: {companyId}</p>
          <button
            onClick={() => navigate('/super-admin-dashboard')}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/super-admin-dashboard')}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                  <p className="text-gray-600">تفاصيل الشركة • ID: {company.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(company.status)} variant="outline">
                {company.status === 'active' ? '✅ نشط' :
                 company.status === 'suspended' ? '🚫 معلق' :
                 company.status === 'cancelled' ? '❌ ملغي' : company.status}
              </Badge>

              <Button
                onClick={handleLoginAsCompany}
                disabled={loginAsLoading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {loginAsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
                دخول كـ {company.name}
              </Button>
            </div>
          </div>
        </div>

        {/* معلومات أساسية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Mail className="h-5 w-5" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">البريد الإلكتروني</p>
                  <p className="text-sm text-gray-600">{company.email}</p>
                </div>
              </div>
              {company.phone && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Phone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">رقم الهاتف</p>
                    <p className="text-sm text-gray-600">{company.phone}</p>
                  </div>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">الموقع الإلكتروني</p>
                    <p className="text-sm text-gray-600">{company.website}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <MapPin className="h-5 w-5" />
                العنوان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {company.address && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">العنوان التفصيلي</p>
                    <p className="text-sm text-gray-600">{company.address}</p>
                  </div>
                </div>
              )}
              {company.city && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">المدينة</p>
                    <p className="text-sm text-gray-600">{company.city}</p>
                  </div>
                </div>
              )}
              {company.country && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">البلد</p>
                    <p className="text-sm text-gray-600">{company.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Calendar className="h-5 w-5" />
                معلومات النشاط
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">تاريخ التسجيل</p>
                  <p className="text-sm text-gray-600">{formatDate(company.created_at)}</p>
                </div>
              </div>
              {company.last_login_at ? (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Activity className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">آخر دخول</p>
                    <p className="text-sm text-gray-600">{formatDate(company.last_login_at)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Activity className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">آخر دخول</p>
                    <p className="text-sm text-gray-500">لم يسجل دخول بعد</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* تبويبات التفاصيل */}
        <Card className="overflow-hidden">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b bg-gray-50/50">
              <TabsList className="grid w-full grid-cols-5 h-14 bg-transparent border-0 rounded-none p-0">
                <TabsTrigger
                  value="overview"
                  className="relative h-full rounded-none border-0 bg-transparent px-6 py-4 font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <span>نظرة عامة</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="subscription"
                  className="relative h-full rounded-none border-0 bg-transparent px-6 py-4 font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    <span>الاشتراك</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="stores"
                  className="relative h-full rounded-none border-0 bg-transparent px-6 py-4 font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏪</span>
                    <span>المتاجر</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="relative h-full rounded-none border-0 bg-transparent px-6 py-4 font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span>المستخدمين</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="relative h-full rounded-none border-0 bg-transparent px-6 py-4 font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <span>النشاط</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  إحصائيات الشركة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{company.stores?.length || 0}</p>
                    <p className="text-sm text-gray-600 font-medium">متجر</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  📊 إجمالي المتاجر المسجلة
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{company.users?.length || 0}</p>
                    <p className="text-sm text-gray-600 font-medium">مستخدم</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  👥 إجمالي المستخدمين النشطين
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-600">{company.conversations?.length || 0}</p>
                    <p className="text-sm text-gray-600 font-medium">محادثة</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  💬 إجمالي المحادثات
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-orange-600">{company.company_subscriptions?.length || 0}</p>
                    <p className="text-sm text-gray-600 font-medium">اشتراك</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  📈 إجمالي الاشتراكات
                </div>
              </CardContent>
            </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="p-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  تفاصيل الاشتراك
                </h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      معلومات الاشتراك الحالي
                    </CardTitle>
                  </CardHeader>
            <CardContent>
              {company.company_subscriptions && company.company_subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {company.company_subscriptions.map((subscription, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{subscription.subscription_plans?.name || 'خطة غير محددة'}</h4>
                        <Badge className={subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {subscription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        ينتهي في: {formatDate(subscription.end_date)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">لا يوجد اشتراك نشط</p>
                </div>
              )}
            </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stores" className="p-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-xl">🏪</span>
                  المتاجر ({company.stores?.length || 0})
                </h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      قائمة المتاجر المسجلة
                    </CardTitle>
                  </CardHeader>
            <CardContent>
              {company.stores && company.stores.length > 0 ? (
                <div className="space-y-4">
                  {company.stores.map((store: any) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{store.name}</div>
                          <div className="text-sm text-gray-500">ID: {store.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={store.is_active ? "default" : "secondary"}>
                          {store.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {new Date(store.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد متاجر</h3>
                  <p className="text-gray-500">لم يتم إنشاء أي متاجر لهذه الشركة بعد</p>
                </div>
              )}
            </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="p-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  المستخدمين ({company.users?.length || 0})
                </h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      قائمة المستخدمين المسجلين
                    </CardTitle>
                  </CardHeader>
            <CardContent>
              {company.users && company.users.length > 0 ? (
                <div className="space-y-4">
                  {company.users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant="outline">
                          {user.role || "مستخدم"}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد مستخدمين</h3>
                  <p className="text-gray-500">لم يتم إضافة أي مستخدمين لهذه الشركة بعد</p>
                </div>
              )}
            </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="p-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  سجل النشاط
                </h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      آخر الأنشطة والفعاليات
                    </CardTitle>
                  </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* نشاط حديث */}
                <div className="border-l-4 border-l-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-700">تسجيل الشركة</p>
                      <p className="text-sm text-blue-600">تم إنشاء حساب الشركة</p>
                    </div>
                    <div className="text-sm text-blue-500">
                      {formatDate(company.created_at)}
                    </div>
                  </div>
                </div>

                {company.last_login_at && (
                  <div className="border-l-4 border-l-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-700">آخر دخول</p>
                        <p className="text-sm text-green-600">تم تسجيل الدخول للنظام</p>
                      </div>
                      <div className="text-sm text-green-500">
                        {formatDate(company.last_login_at)}
                      </div>
                    </div>
                  </div>
                )}

                {company.company_subscriptions && company.company_subscriptions.length > 0 && (
                  <div className="border-l-4 border-l-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-purple-700">الاشتراك النشط</p>
                        <p className="text-sm text-purple-600">
                          خطة: {company.company_subscriptions[0].subscription_plans?.name || 'غير محدد'}
                        </p>
                      </div>
                      <div className="text-sm text-purple-500">
                        ينتهي: {formatDate(company.company_subscriptions[0].end_date)}
                      </div>
                    </div>
                  </div>
                )}

                {company.users && company.users.length > 0 && (
                  <div className="border-l-4 border-l-orange-500 pl-4 py-3 bg-orange-50 rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-orange-700">المستخدمين</p>
                        <p className="text-sm text-orange-600">
                          {company.users.length} مستخدم مسجل
                        </p>
                      </div>
                      <div className="text-sm text-orange-500">
                        آخر مستخدم: {formatDate(company.users[0]?.created_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminCompanyDetails;
