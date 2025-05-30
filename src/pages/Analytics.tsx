
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const dailyStats = [
    { day: "السبت", messages: 45, responses: 42 },
    { day: "الأحد", messages: 67, responses: 64 },
    { day: "الاثنين", messages: 89, responses: 85 },
    { day: "الثلاثاء", messages: 78, responses: 76 },
    { day: "الأربعاء", messages: 92, responses: 89 },
    { day: "الخميس", messages: 84, responses: 81 },
    { day: "الجمعة", messages: 56, responses: 53 }
  ];

  const responseTimeData = [
    { hour: "9", avgTime: 2.3 },
    { hour: "10", avgTime: 1.8 },
    { hour: "11", avgTime: 2.1 },
    { hour: "12", avgTime: 3.2 },
    { hour: "13", avgTime: 2.8 },
    { hour: "14", avgTime: 2.4 },
    { hour: "15", avgTime: 2.0 },
    { hour: "16", avgTime: 2.6 },
    { hour: "17", avgTime: 3.1 }
  ];

  const topKeywords = [
    { name: "أوقات العمل", value: 156, color: "#3B82F6" },
    { name: "الأسعار", value: 134, color: "#8B5CF6" },
    { name: "التوصيل", value: 89, color: "#10B981" },
    { name: "المنتجات", value: 67, color: "#F59E0B" },
    { name: "الدعم", value: 45, color: "#EF4444" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الإحصائيات والتقارير</h1>
          <p className="text-gray-600">تحليل أداء الردود الآلية على الفيسبوك</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Messages Chart */}
          <Card>
            <CardHeader>
              <CardTitle>الرسائل والردود اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#3B82F6" name="الرسائل" />
                    <Bar dataKey="responses" fill="#8B5CF6" name="الردود" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>متوسط وقت الاستجابة (بالثواني)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="وقت الاستجابة"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Keywords Pie Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>أكثر الكلمات المفتاحية استخداماً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topKeywords}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {topKeywords.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>مؤشرات الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">98.2%</div>
                  <div className="text-sm text-gray-600">معدل الاستجابة</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">2.1s</div>
                  <div className="text-sm text-gray-600">متوسط وقت الاستجابة</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1,247</div>
                  <div className="text-sm text-gray-600">إجمالي الردود هذا الأسبوع</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">89%</div>
                  <div className="text-sm text-gray-600">رضا العملاء</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
