import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  MessageSquare, 
  Package, 
  Users, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Settings,
  Crown,
  AlertTriangle,
  Facebook,
  Phone,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SimpleCompanyDashboard: React.FC = () => {
  const navigate = useNavigate();

  // بيانات تجريبية للشركة
  const companyData = {
    name: 'Swan Shop',
    plan: 'Premium',
    status: 'نشط',
    messagesThisMonth: 1250,
    messagesLimit: 5000,
    usersCount: 3,
    usersLimit: 10,
    daysLeft: 23
  };

  const quickActions = [
    {
      title: 'إعدادات Facebook',
      description: 'ربط وإدارة صفحات فيسبوك',
      icon: Facebook,
      color: 'bg-blue-500',
      path: '/settings'
    },
    {
      title: 'إعدادات WhatsApp',
      description: 'ربط وإدارة WhatsApp Business',
      icon: Phone,
      color: 'bg-green-500',
      path: '/whatsapp'
    },
    {
      title: 'المنتجات والمتجر',
      description: 'إدارة المنتجات والطلبات',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      path: '/ecommerce-products'
    },
    {
      title: 'إدارة المستخدمين',
      description: 'إضافة وإدارة فريق العمل',
      icon: Users,
      color: 'bg-orange-500',
      path: '/user-management'
    }
  ];

  const stats = [
    {
      title: 'الرسائل هذا الشهر',
      value: companyData.messagesThisMonth.toLocaleString(),
      limit: companyData.messagesLimit.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      progress: (companyData.messagesThisMonth / companyData.messagesLimit) * 100
    },
    {
      title: 'المستخدمين النشطين',
      value: companyData.usersCount.toString(),
      limit: companyData.usersLimit.toString(),
      icon: Users,
      color: 'text-green-600',
      progress: (companyData.usersCount / companyData.usersLimit) * 100
    },
    {
      title: 'الأيام المتبقية',
      value: companyData.daysLeft.toString(),
      limit: '30',
      icon: Calendar,
      color: 'text-purple-600',
      progress: (companyData.daysLeft / 30) * 100
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{companyData.name}</h1>
                <div className="flex items-center space-x-2 space-x-reverse mt-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Crown className="w-3 h-3 ml-1" />
                    {companyData.plan}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {companyData.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => navigate('/upgrade-plan')}>
                <TrendingUp className="w-4 h-4 ml-2" />
                ترقية الخطة
              </Button>
              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 ml-2" />
                الإعدادات
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value} / {stat.limit}
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>الاستخدام</span>
                    <span>{Math.round(stat.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stat.progress > 80 ? 'bg-red-500' : 
                        stat.progress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stat.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>
              الوصول السريع للأدوات والإعدادات المهمة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">تم إرسال 45 رسالة تلقائية</p>
                  <p className="text-xs text-gray-500">منذ ساعتين</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">تم إضافة 3 منتجات جديدة</p>
                  <p className="text-xs text-gray-500">منذ 4 ساعات</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">انضم مستخدم جديد للفريق</p>
                  <p className="text-xs text-gray-500">أمس</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4">
          <p>© 2025 Facebook Auto Reply System - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleCompanyDashboard;
