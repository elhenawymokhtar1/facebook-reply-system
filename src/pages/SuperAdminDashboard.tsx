/**
 * 👑 لوحة تحكم المستخدم الأساسي
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Building, 
  Users, 
  TrendingUp, 
  Shield, 
  Settings,
  LogOut,
  ArrowLeft,
  Activity,
  DollarSign,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
  total_companies: number;
  total_users: number;
  total_subscriptions: number;
  last_updated: string;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  status: string;
  created_at: string;
  subscription?: {
    plan: {
      name: string;
      price_monthly: number;
    };
  };
  users_count: number;
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [superAdmin, setSuperAdmin] = useState<any>(null);

  useEffect(() => {
    // التحقق من تسجيل دخول المستخدم الأساسي
    const adminData = localStorage.getItem('superAdmin');
    if (!adminData) {
      navigate('/super-admin-login');
      return;
    }

    try {
      const admin = JSON.parse(adminData);
      setSuperAdmin(admin);
      loadDashboardData();
    } catch (error) {
      console.error('Error parsing super admin data:', error);
      navigate('/super-admin-login');
    }
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // تحميل الإحصائيات والشركات
      const [statsRes, companiesRes] = await Promise.all([
        fetch('http://localhost:3002/api/subscriptions/admin/stats'),
        fetch('http://localhost:3002/api/subscriptions/admin/companies')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        if (companiesData.success) {
          setCompanies(companiesData.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('فشل في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdmin');
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/super-admin-login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  لوحة تحكم مدير النظام
                </h1>
                <p className="text-sm text-gray-500">
                  مرحباً {superAdmin?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/system-test')}
              >
                <Settings className="h-4 w-4 mr-2" />
                اختبار النظام
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات النظام */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الشركات</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.total_companies || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.total_users || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">الاشتراكات النشطة</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.total_subscriptions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">حالة النظام</p>
                  <p className="text-lg font-bold text-green-600">
                    يعمل بشكل طبيعي
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قائمة الشركات */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  الشركات المسجلة
                </CardTitle>
                <CardDescription>
                  إدارة ومراقبة جميع الشركات في النظام
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate('/companies-management')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Building className="h-4 w-4 mr-2" />
                إدارة الشركات
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد شركات مسجلة حتى الآن
                </div>
              ) : (
                companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{company.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{company.email}</span>
                          </div>
                          {company.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.city && (
                            <span>{company.city}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>تاريخ التسجيل: {new Date(company.created_at).toLocaleDateString('ar')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(company.status)}
                      
                      {company.subscription?.plan && (
                        <Badge variant="outline">
                          {company.subscription.plan.name}
                        </Badge>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        {company.users_count || 0} مستخدم
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // يمكن إضافة صفحة تفاصيل الشركة هنا
                          toast.info('صفحة تفاصيل الشركة قيد التطوير');
                        }}
                      >
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* إجراءات سريعة */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Building className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">إدارة الشركات</h3>
              <p className="text-sm text-gray-600 mb-4">إدارة شاملة لجميع الشركات</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/companies-management')}
              >
                إدارة
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">إدارة الأمان</h3>
              <p className="text-sm text-gray-600 mb-4">مراقبة أمان النظام والصلاحيات</p>
              <Button variant="outline" size="sm">
                قريباً
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">إدارة الفوترة</h3>
              <p className="text-sm text-gray-600 mb-4">مراقبة المدفوعات والاشتراكات</p>
              <Button variant="outline" size="sm">
                قريباً
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Settings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">إعدادات النظام</h3>
              <p className="text-sm text-gray-600 mb-4">تكوين إعدادات النظام العامة</p>
              <Button variant="outline" size="sm">
                قريباً
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
