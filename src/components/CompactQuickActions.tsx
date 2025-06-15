import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Bot, 
  Store, 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Settings, 
  Tag, 
  Truck, 
  Percent,
  Activity,
  Zap,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const CompactQuickActions = () => {
  const quickActions = [
    {
      title: "المحادثات",
      description: "رسائل جديدة",
      icon: MessageSquare,
      to: "/conversations",
      color: "bg-blue-500",
      count: "12",
      priority: "high"
    },
    {
      title: "الردود الآلية",
      description: "إدارة الردود",
      icon: Bot,
      to: "/responses",
      color: "bg-green-500",
      priority: "high"
    },
    {
      title: "المتجر",
      description: "لوحة التحكم",
      icon: Store,
      to: "/store-dashboard",
      color: "bg-purple-500",
      badge: "جديد",
      priority: "high"
    },
    {
      title: "المنتجات",
      description: "إدارة المنتجات",
      icon: ShoppingBag,
      to: "/ecommerce-products",
      color: "bg-indigo-500",
      priority: "medium"
    },
    {
      title: "الطلبات",
      description: "متابعة الطلبات",
      icon: Package,
      to: "/orders",
      color: "bg-orange-500",
      count: "3",
      priority: "high"
    },
    {
      title: "التحليلات",
      description: "إحصائيات الأداء",
      icon: BarChart3,
      to: "/analytics",
      color: "bg-cyan-500",
      priority: "medium"
    },
    {
      title: "الفئات",
      description: "تنظيم الفئات",
      icon: Tag,
      to: "/categories",
      color: "bg-pink-500",
      priority: "low"
    },
    {
      title: "الشحن",
      description: "إعدادات الشحن",
      icon: Truck,
      to: "/shipping-management",
      color: "bg-emerald-500",
      priority: "low"
    },
    {
      title: "الكوبونات",
      description: "كوبونات الخصم",
      icon: Percent,
      to: "/coupons-management",
      color: "bg-red-500",
      priority: "low"
    },
    {
      title: "الإعدادات",
      description: "إعدادات النظام",
      icon: Settings,
      to: "/settings",
      color: "bg-gray-500",
      priority: "low"
    }
  ];

  // ترتيب الإجراءات حسب الأولوية
  const sortedActions = quickActions.sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // الإجراءات عالية الأولوية
  const highPriorityActions = sortedActions.filter(action => action.priority === 'high');
  const otherActions = sortedActions.filter(action => action.priority !== 'high');

  return (
    <div className="space-y-4">
      {/* High Priority Actions */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            إجراءات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {highPriorityActions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Link key={index} to={action.to}>
                <div className="group relative flex items-center space-x-3 space-x-reverse p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50">
                  {action.badge && (
                    <Badge 
                      className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 bg-red-500 text-white"
                      variant="destructive"
                    >
                      {action.badge}
                    </Badge>
                  )}
                  {action.count && (
                    <Badge 
                      className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 bg-blue-500 text-white"
                    >
                      {action.count}
                    </Badge>
                  )}
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {action.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Other Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            أدوات أخرى
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {otherActions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Link key={index} to={action.to}>
                <div className="group flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-sm">
                  <div className={`w-8 h-8 rounded-md ${action.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 transform group-hover:scale-105`}>
                    <Icon className="w-4 h-4 text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {action.title}
                      </h4>
                      {action.count && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 border-0">
                          {action.count}
                        </Badge>
                      )}
                      {action.badge && (
                        <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5 border-0">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompactQuickActions;
