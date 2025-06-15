
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MessageSquare,
  Settings,
  BarChart3,
  ShoppingBag,
  Store,
  Package,
  Users,
  Tag,
  Truck,
  Percent,
  Bot,
  Activity,
  Rocket,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const actions = [
    {
      title: "المحادثات",
      description: "عرض وإدارة المحادثات النشطة",
      icon: MessageSquare,
      to: "/conversations",
      color: "from-blue-500 to-blue-600",
      priority: "high"
    },
    {
      title: "الردود الآلية",
      description: "إدارة الردود التلقائية",
      icon: Bot,
      to: "/responses",
      color: "from-green-500 to-green-600",
      priority: "high"
    },
    {
      title: "المتجر الإلكتروني",
      description: "إدارة المنتجات والمبيعات",
      icon: Store,
      to: "/store-dashboard",
      color: "from-purple-500 to-purple-600",
      priority: "high",
      badge: "جديد"
    },
    {
      title: "الطلبات",
      description: "متابعة ومعالجة الطلبات",
      icon: Package,
      to: "/orders",
      color: "from-orange-500 to-orange-600",
      priority: "high"
    },
    {
      title: "المنتجات",
      description: "إضافة وتعديل المنتجات",
      icon: ShoppingBag,
      to: "/ecommerce-products",
      color: "from-indigo-500 to-indigo-600",
      priority: "medium"
    },
    {
      title: "الفئات",
      description: "تنظيم فئات المنتجات",
      icon: Tag,
      to: "/categories",
      color: "from-pink-500 to-pink-600",
      priority: "medium"
    },
    {
      title: "الإحصائيات",
      description: "تحليل الأداء والمبيعات",
      icon: BarChart3,
      to: "/analytics",
      color: "from-cyan-500 to-cyan-600",
      priority: "medium"
    },
    {
      title: "الإعدادات",
      description: "تكوين النظام والحساب",
      icon: Settings,
      to: "/settings",
      color: "from-gray-500 to-gray-600",
      priority: "low"
    },
    {
      title: "الشحن",
      description: "إدارة طرق الشحن والأسعار",
      icon: Truck,
      to: "/shipping-management",
      color: "from-emerald-500 to-emerald-600",
      priority: "medium"
    },
    {
      title: "الكوبونات",
      description: "إنشاء وإدارة كوبونات الخصم",
      icon: Percent,
      to: "/coupons-management",
      color: "from-red-500 to-red-600",
      priority: "medium"
    },
    {
      title: "إعداد المتجر",
      description: "إعداد المتجر للمرة الأولى",
      icon: Rocket,
      to: "/store-setup",
      color: "from-yellow-500 to-yellow-600",
      priority: "medium",
      badge: "مهم"
    },
    {
      title: "تحليلات المتجر",
      description: "إحصائيات مفصلة للمتجر",
      icon: TrendingUp,
      to: "/ecommerce-analytics",
      color: "from-violet-500 to-violet-600",
      priority: "medium"
    }
  ];

  // ترتيب الإجراءات حسب الأولوية
  const sortedActions = actions.sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          الإجراءات السريعة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedActions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Link key={index} to={action.to}>
              <div className="group relative flex items-center space-x-3 space-x-reverse p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white hover:bg-gray-50">
                {action.badge && (
                  <Badge
                    className="absolute -top-1 -right-1 text-xs px-2 py-0.5 bg-red-500 text-white"
                    variant="destructive"
                  >
                    {action.badge}
                  </Badge>
                )}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-200 truncate">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-500 transition-colors duration-200 truncate">
                    {action.description}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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
