import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardContent, SimpleCardTitle, SimpleButton } from './SimpleUI';

const SimpleHomePage: React.FC = () => {
  const [stats, setStats] = useState({
    totalMessages: 1234,
    autoReplies: 856,
    activeConversations: 42,
    responseRate: "98%"
  });
  const [loading, setLoading] = useState(false);

  const refreshStats = () => {
    setLoading(true);
    // محاكاة تحديث البيانات
    setTimeout(() => {
      setStats({
        totalMessages: Math.floor(Math.random() * 2000) + 1000,
        autoReplies: Math.floor(Math.random() * 1000) + 500,
        activeConversations: Math.floor(Math.random() * 100) + 20,
        responseRate: `${Math.floor(Math.random() * 10) + 90}%`
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <span className="text-white font-bold">FB</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">رد تلقائي</h1>
                <p className="text-sm text-gray-500">إدارة رسائل الفيسبوك</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/conversations">
                <SimpleButton variant="ghost">💬 المحادثات</SimpleButton>
              </Link>


              <Link to="/settings">
                <SimpleButton variant="ghost">⚙️ الإعدادات</SimpleButton>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏠 لوحة التحكم الرئيسية
              </h1>
              <p className="text-gray-600">
                إدارة الردود الآلية على رسائل الفيسبوك
              </p>
            </div>
            <SimpleButton
              onClick={refreshStats}
              variant="outline"
              disabled={loading}
            >
              {loading ? '🔄 جاري التحديث...' : '🔄 تحديث البيانات'}
            </SimpleButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SimpleCard>
            <SimpleCardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">💬</span>
                  </div>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الرسائل</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">⚡</span>
                  </div>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">الردود الآلية</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.autoReplies.toLocaleString()}</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">👥</span>
                  </div>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">المحادثات النشطة</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-lg">📈</span>
                  </div>
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">معدل الاستجابة</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.responseRate}</p>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>🚀 إجراءات سريعة</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                <Link to="/conversations">
                  <SimpleButton className="w-full justify-start">
                    💬 عرض المحادثات الجديدة
                  </SimpleButton>
                </Link>


                <Link to="/settings">
                  <SimpleButton variant="outline" className="w-full justify-start">
                    ⚙️ إعدادات النظام
                  </SimpleButton>
                </Link>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>📊 حالة النظام</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">النظام المبسط</span>
                  <span className="text-green-600 font-medium">✅ يعمل</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">النظام المتكامل</span>
                  <span className="text-green-600 font-medium">✅ متاح</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">قاعدة البيانات</span>
                  <span className="text-green-600 font-medium">✅ متصلة</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الردود الآلية</span>
                  <span className="text-green-600 font-medium">✅ نشطة</span>
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>🎯 النظام الهجين المتكامل - يجمع بين السرعة والذكاء</p>
          <p className="text-sm mt-2">آخر تحديث: {new Date().toLocaleString('ar-EG')}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleHomePage;
