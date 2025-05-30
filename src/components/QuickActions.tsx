
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Settings, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const actions = [
    {
      title: "إضافة رد جديد",
      description: "إنشاء رد آلي جديد للرسائل",
      icon: Plus,
      to: "/responses/new",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "عرض الردود",
      description: "إدارة الردود الحالية",
      icon: MessageSquare,
      to: "/responses",
      color: "from-green-500 to-green-600"
    },
    {
      title: "الإحصائيات",
      description: "مراجعة أداء الردود",
      icon: BarChart3,
      to: "/analytics",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "الإعدادات",
      description: "تكوين إعدادات الحساب",
      icon: Settings,
      to: "/settings",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Link key={index} to={action.to}>
              <div className="flex items-center space-x-4 space-x-reverse p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
