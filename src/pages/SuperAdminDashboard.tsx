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
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import SuperAdminCompaniesTable from '@/components/SuperAdminCompaniesTable';

interface SystemStats {
  total_companies: number;
  total_users: number;
  total_subscriptions: number;
  last_updated: string;
}



const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
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

      // تحميل الإحصائيات فقط
      const statsRes = await fetch('http://localhost:3002/api/subscriptions/admin/stats');

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
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

        {/* جدول الشركات مع ميزة "دخول كـ" */}
        <SuperAdminCompaniesTable superAdminId="super-admin-id" />

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
