import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Facebook, 
  BarChart3, 
  Users, 
  Bot, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const HomePage = () => {
  const quickStats = [
    {
      title: 'إجمالي الرسائل',
      value: '2,847',
      change: '+12%',
      icon: MessageCircle,
      color: 'blue'
    },
    {
      title: 'المحادثات النشطة',
      value: '156',
      change: '+8%',
      icon: Users,
      color: 'green'
    },
    {
      title: 'معدل الاستجابة',
      value: '98%',
      change: '+2%',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'متوسط وقت الرد',
      value: '2.3 دقيقة',
      change: '-15%',
      icon: Clock,
      color: 'orange'
    }
  ];

  const quickActions = [
    {
      title: 'محادثات الواتساب',
      description: 'إدارة والرد على رسائل الواتساب',
      icon: MessageCircle,
      color: 'green',
      link: '/whatsapp-conversations'
    },
    {
      title: 'محادثات فيسبوك',
      description: 'إدارة والرد على رسائل فيسبوك',
      icon: Facebook,
      color: 'blue',
      link: '/facebook-conversations'
    },
    {
      title: 'الإحصائيات',
      description: 'عرض تقارير الأداء والإحصائيات',
      icon: BarChart3,
      color: 'purple',
      link: '/analytics'
    },
    {
      title: 'إعدادات الذكاء الاصطناعي',
      description: 'تخصيص الردود التلقائية',
      icon: Bot,
      color: 'indigo',
      link: '/whatsapp-ai-settings'
    }
  ];

  const recentActivities = [
    {
      type: 'message',
      title: 'رسالة جديدة من أحمد محمد',
      time: 'منذ 5 دقائق',
      platform: 'whatsapp'
    },
    {
      type: 'reply',
      title: 'تم إرسال رد تلقائي لـ سارة أحمد',
      time: 'منذ 12 دقيقة',
      platform: 'facebook'
    },
    {
      type: 'connection',
      title: 'تم ربط حساب واتساب جديد',
      time: 'منذ ساعة',
      platform: 'whatsapp'
    },
    {
      type: 'settings',
      title: 'تم تحديث إعدادات الذكاء الاصطناعي',
      time: 'منذ ساعتين',
      platform: 'system'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      indigo: 'bg-indigo-500 text-white'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً بك في نظام إدارة الأعمال
          </h1>
          <p className="text-gray-600">
            نظام شامل لإدارة محادثات الواتساب وفيسبوك مع الذكاء الاصطناعي
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} من الشهر الماضي
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">الإجراءات السريعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getColorClasses(action.color)}`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm">{action.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">النشاط الأخير</h2>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'message' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'reply' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'connection' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      {activity.type === 'settings' && (
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-4">
                <Link
                  to="/analytics"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  عرض جميع الأنشطة
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة الاتصالات</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">واتساب</span>
                </div>
                <span className="text-sm font-medium text-green-600">متصل</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">فيسبوك</span>
                </div>
                <span className="text-sm font-medium text-blue-600">متصل</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">الذكاء الاصطناعي</span>
                </div>
                <span className="text-sm font-medium text-purple-600">نشط</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الإعدادات السريعة</h3>
            <div className="space-y-3">
              <Link
                to="/whatsapp"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">إعدادات الواتساب</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                to="/facebook-settings"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">إعدادات فيسبوك</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                to="/whatsapp-ai-settings"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">إعدادات الذكاء الاصطناعي</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
