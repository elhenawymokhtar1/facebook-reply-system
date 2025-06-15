import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Package, 
  ShoppingBag, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const QuickStatsBar = () => {
  const stats = [
    {
      title: "رسائل جديدة",
      value: "12",
      icon: MessageSquare,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      to: "/conversations",
      status: "urgent"
    },
    {
      title: "طلبات معلقة",
      value: "3",
      icon: Package,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      to: "/orders",
      status: "warning"
    },
    {
      title: "منتجات نشطة",
      value: "45",
      icon: ShoppingBag,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      to: "/ecommerce-products",
      status: "success"
    },
    {
      title: "مبيعات اليوم",
      value: "1,250 ج",
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      to: "/ecommerce-analytics",
      status: "info"
    },
    {
      title: "عملاء نشطين",
      value: "28",
      icon: Users,
      color: "bg-cyan-500",
      textColor: "text-cyan-600",
      bgColor: "bg-cyan-50",
      to: "/conversations",
      status: "info"
    },
    {
      title: "معدل الاستجابة",
      value: "98%",
      icon: Clock,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      to: "/analytics",
      status: "success"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'urgent':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">عاجل</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">تحذير</Badge>;
      case 'success':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">جيد</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <Link key={index} to={stat.to}>
                <div className={`group relative p-3 rounded-lg ${stat.bgColor} hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {getStatusIcon(stat.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-lg ${stat.textColor}`}>
                        {stat.value}
                      </h3>
                      {getStatusBadge(stat.status)}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {stat.title}
                    </p>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-gray-300 transition-colors duration-200"></div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStatsBar;
