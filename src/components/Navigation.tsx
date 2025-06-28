
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  MessageSquare,
  Settings,
  BarChart3,
  Facebook,
  Bell,
  MessageCircle,
  Package,
  Palette,
  ShoppingBag,
  Layers,
  Tags,
  Store,
  ShoppingCart,
  Truck,
  TrendingUp,
  Rocket,
  TestTube,
  Phone,
  Bot,
  Link2
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "الرئيسية" },
    { to: "/store-setup", icon: Rocket, label: "إعداد المتجر", highlight: true },
    { to: "/test-chat", icon: TestTube, label: "محاكي المحادثات", highlight: true },
    { to: "/conversations", icon: MessageCircle, label: "محادثات فيسبوك" },
    { to: "/connected-pages", icon: Link2, label: "الصفحات المربوطة", highlight: true },
    { to: "/whatsapp-conversations", icon: MessageCircle, label: "محادثات واتساب", highlight: true },
    { to: "/whatsapp", icon: Phone, label: "إدارة WhatsApp", highlight: true },
    { to: "/whatsapp-chat", icon: MessageCircle, label: "دردشة WhatsApp", highlight: true },
    { to: "/whatsapp-ai", icon: Bot, label: "ذكاء اصطناعي WhatsApp", highlight: true },
    { to: "/orders", icon: Package, label: "الطلبات" },
    { to: "/ecommerce-products", icon: ShoppingBag, label: "إدارة المنتجات" },
    { to: "/coupons", icon: Tags, label: "الكوبونات" },
    { to: "/shipping", icon: Truck, label: "الشحن" },
    { to: "/shop", icon: Store, label: "المتجر" },
    { to: "/cart", icon: ShoppingCart, label: "السلة" },
    { to: "/ecommerce-analytics", icon: BarChart3, label: "تحليلات المتجر" },
    { to: "/responses", icon: MessageSquare, label: "الردود الآلية" },
    { to: "/analytics", icon: TrendingUp, label: "الإحصائيات العامة" },
    { to: "/settings", icon: Settings, label: "الإعدادات" }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Facebook className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">رد تلقائي</h1>
              <p className="text-sm text-gray-500">إدارة رسائل الفيسبوك</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6 space-x-reverse">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center space-x-2 space-x-reverse ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : item.highlight
                        ? "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full mr-2">
                        جديد
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
