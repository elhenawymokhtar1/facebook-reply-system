
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Clock, TrendingUp, Plus, Settings, Eye, RefreshCw, Activity, Store, ShoppingBag, Package } from "lucide-react";
import { Link } from "react-router-dom";
import StatsCard from "@/components/StatsCard";
import RecentMessages from "@/components/RecentMessages";
import QuickActions from "@/components/QuickActions";
import CompactQuickActions from "@/components/CompactQuickActions";
import EnhancedQuickActions from "@/components/EnhancedQuickActions";
import QuickStatsBar from "@/components/QuickStatsBar";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";

const Index = () => {
  console.log('📊 Index page is rendering...');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { company, isNewCompany } = useCurrentCompany();

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
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-y-auto" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isNewCompany ?
                  `مرحباً ${company?.name || 'بك'} في نظامك الجديد! 🎉` :
                  'لوحة التحكم الذكية'
                }
              </h1>
              <p className="text-gray-600">
                {isNewCompany ?
                  'نظام ذكي لإدارة رسائل Facebook Messenger والرد التلقائي على العملاء - جاهز للبدء!' :
                  'إدارة الردود الآلية على رسائل الفيسبوك'
                }
              </p>
              {/* رسالة ترحيبية للشركات الجديدة */}
              {isNewCompany && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">🎯 نظامك جاهز للانطلاق!</h3>
                  <p className="text-green-700 text-sm">
                    مرحباً بك في عالم الردود الذكية! ابدأ بإعداد Facebook API وشاهد النظام يعمل تلقائياً.
                  </p>
                </div>
              )}
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

        {/* Quick Stats Bar */}
        <QuickStatsBar />

        {/* قسم البدء السريع للشركات الجديدة */}
        {isNewCompany && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  دليل البدء السريع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                    <Settings className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium text-green-800 mb-1">1. إعداد النظام</h4>
                    <p className="text-sm text-green-700 mb-3">اضبط مفاتيح Facebook و Gemini AI</p>
                    <div className="flex gap-2 justify-center">
                      <Link to="/settings">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          الإعدادات
                        </Button>
                      </Link>
                      <Link to="/quick-start-guide">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                          الدليل
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium text-green-800 mb-1">2. اختبار النظام</h4>
                    <p className="text-sm text-green-700 mb-3">جرب الردود الذكية قبل التشغيل</p>
                    <Link to="/simple-test-chat">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        اختبار
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium text-green-800 mb-1">3. بدء المحادثات</h4>
                    <p className="text-sm text-green-700 mb-3">راقب الرسائل الواردة من العملاء</p>
                    <Link to="/conversations">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        المحادثات
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <CompactQuickActions />
          </div>

          {/* Recent Messages */}
          <div className="lg:col-span-2">
            <RecentMessages />
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mt-8">
          <EnhancedQuickActions />
        </div>
      </div>
    </div>
  );
};

export default Index;
