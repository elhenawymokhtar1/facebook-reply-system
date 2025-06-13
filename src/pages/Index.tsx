
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, TrendingUp, Plus, Settings, Eye, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import RecentMessages from "@/components/RecentMessages";
import QuickActions from "@/components/QuickActions";

const Index = () => {
  console.log('📊 Index page is rendering...');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // بيانات افتراضية في حالة فشل التحميل
  const defaultStats = {
    totalMessages: 1234,
    autoReplies: 856,
    activeConversations: 42,
    responseRate: "98%"
  };

  useEffect(() => {
    console.log('📊 Index useEffect running...');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log('📡 Fetching dashboard stats...');
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/api/dashboard-stats');
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Stats data received:', data);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError(err.message);
      setStats(defaultStats); // استخدام البيانات الافتراضية
    } finally {
      setLoading(false);
      console.log('✅ Stats loading completed');
    }
  };

  // استخدام البيانات الحقيقية أو الافتراضية
  const currentStats = stats || defaultStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                لوحة التحكم
              </h1>
              <p className="text-gray-600">
                إدارة الردود الآلية على رسائل الفيسبوك
              </p>
            </div>
            <Button
              onClick={fetchStats}
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
          </div>

          {loading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">🔄 جاري تحميل البيانات الحقيقية...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700">⚠️ تعذر تحميل البيانات الحقيقية، يتم عرض بيانات تجريبية</p>
            </div>
          )}

          {stats && !loading && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✅ تم تحميل البيانات الحقيقية - آخر تحديث: {new Date(stats.lastUpdated).toLocaleString('ar-EG')}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="إجمالي الرسائل"
            value={currentStats.totalMessages?.toLocaleString() || "0"}
            icon={MessageSquare}
            change={stats ? "حقيقي" : "تجريبي"}
            color="blue"
          />
          <StatsCard
            title="الردود الآلية"
            value={currentStats.autoReplies?.toLocaleString() || "0"}
            icon={Clock}
            change={stats ? "حقيقي" : "تجريبي"}
            color="green"
          />
          <StatsCard
            title="المحادثات النشطة"
            value={currentStats.activeConversations?.toLocaleString() || "0"}
            icon={Users}
            change={stats ? "آخر 24 ساعة" : "تجريبي"}
            color="purple"
          />
          <StatsCard
            title="معدل الاستجابة"
            value={currentStats.responseRate || "0%"}
            icon={TrendingUp}
            change={stats ? "محسوب" : "تجريبي"}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions />
          </div>

          {/* Recent Messages */}
          <div className="lg:col-span-2">
            <RecentMessages />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
