import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Users, 
  Tag, 
  Truck, 
  Percent,
  Settings,
  MessageSquare,
  Bot,
  Activity,
  Rocket,
  BarChart3,
  Zap,
  Globe,
  CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";

const EnhancedQuickActions = () => {
  const mainActions = [
    {
      title: "إدارة المنتجات",
      description: "أضف وعدل المنتجات والأسعار",
      icon: ShoppingBag,
      to: "/ecommerce-products",
      color: "from-blue-500 to-blue-700",
      hoverColor: "from-blue-600 to-blue-800",
      badge: "منتجات",
      badgeColor: "bg-white/30",
      textShadow: true
    },
    {
      title: "المتجر",
      description: "شاهد متجرك كما يراه العملاء",
      icon: Store,
      to: "/shop",
      color: "from-green-500 to-green-700",
      hoverColor: "from-green-600 to-green-800",
      badge: "متجر",
      badgeColor: "bg-white/30",
      textShadow: true
    },
    {
      title: "منتجات متعددة الخواص",
      description: "إدارة المنتجات بألوان ومقاسات مختلفة",
      icon: Rocket,
      to: "/product-variants",
      color: "from-purple-500 to-purple-700",
      hoverColor: "from-purple-600 to-purple-800",
      badge: "جديد",
      badgeColor: "bg-yellow-400 text-purple-800",
      textShadow: true
    },
    {
      title: "التحليلات",
      description: "إحصائيات المبيعات والأداء",
      icon: TrendingUp,
      to: "/ecommerce-analytics",
      color: "from-orange-500 to-orange-700",
      hoverColor: "from-orange-600 to-orange-800",
      badge: "تحليل",
      badgeColor: "bg-white/30",
      textShadow: true
    }
  ];

  const secondaryActions = [
    {
      title: "المحادثات",
      description: "إدارة محادثات العملاء",
      icon: MessageSquare,
      to: "/conversations",
      color: "from-cyan-500 to-cyan-600",
      textColor: "text-white",
      count: "12"
    },
    {
      title: "الردود الآلية",
      description: "إعداد الردود التلقائية",
      icon: Bot,
      to: "/responses",
      color: "from-indigo-500 to-indigo-600",
      textColor: "text-white"
    },
    {
      title: "الطلبات",
      description: "متابعة ومعالجة الطلبات",
      icon: Package,
      to: "/orders",
      color: "from-green-500 to-green-600",
      textColor: "text-white",
      count: "3"
    },
    {
      title: "الفئات",
      description: "تنظيم فئات المنتجات",
      icon: Tag,
      to: "/categories",
      color: "from-pink-500 to-pink-600",
      textColor: "text-white"
    },
    {
      title: "الشحن",
      description: "إدارة طرق الشحن",
      icon: Truck,
      to: "/shipping-management",
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-white"
    },
    {
      title: "الكوبونات",
      description: "إنشاء كوبونات الخصم",
      icon: Percent,
      to: "/coupons-management",
      color: "from-red-500 to-red-600",
      textColor: "text-white"
    },
    {
      title: "إعداد المتجر",
      description: "إعداد المتجر للمرة الأولى",
      icon: Rocket,
      to: "/store-setup",
      color: "from-yellow-500 to-yellow-600",
      textColor: "text-white"
    },
    {
      title: "الإعدادات",
      description: "تكوين النظام والحساب",
      icon: Settings,
      to: "/settings",
      color: "from-gray-500 to-gray-600",
      textColor: "text-white"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            الإجراءات الرئيسية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={action.to}>
                  <div className={`group p-6 rounded-xl bg-gradient-to-br ${action.color} hover:${action.hoverColor} text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1 relative overflow-hidden`}>
                    {/* Background overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/10 rounded-xl"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Icon className="w-10 h-10 drop-shadow-lg" />
                        <Badge className={`${action.badgeColor} text-xs border-0 font-semibold px-3 py-1 shadow-md`}>
                          {action.badge}
                        </Badge>
                      </div>
                      <h3 className={`font-bold text-xl mb-2 ${action.textShadow ? 'drop-shadow-md' : ''}`}>
                        {action.title}
                      </h3>
                      <p className={`text-white/90 text-sm leading-relaxed ${action.textShadow ? 'drop-shadow-sm' : ''}`}>
                        {action.description}
                      </p>
                    </div>

                    {/* Decorative element */}
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full"></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            أدوات إضافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {secondaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={action.to}>
                  <div className={`group p-4 rounded-lg bg-gradient-to-r ${action.color} text-white hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 relative overflow-hidden`}>
                    {/* Background overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/5 rounded-lg"></div>

                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
                        <Icon className="w-5 h-5 drop-shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate drop-shadow-sm">{action.title}</h4>
                          {action.count && (
                            <Badge className="bg-white/30 text-white text-xs px-2 py-0.5 border-0">
                              {action.count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-90 truncate drop-shadow-sm mt-0.5">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedQuickActions;
