import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Facebook,
  Settings,
  BarChart3,
  Users,
  Bot,
  Menu,
  X,
  Home,
  MessageSquare,
  Mail,
  Database,
  Activity,
  Layers,
  Shield,
  Palette,
  Globe,
  ChevronDown,
  ChevronRight,
  Store,
  ShoppingBag,
  Package,
  ShoppingCart,
  Truck,
  Gift,
  TestTube,
  FileText,
  DollarSign,
  TrendingUp,
  LogOut,
  Building,
  UserPlus,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  path?: string;
  children?: MenuItem[];
  badge?: string;
  color?: string;
}

const menuItems: MenuItem[] = [
  {
    title: 'الرئيسية',
    icon: Home,
    path: '/',
    color: 'text-blue-600'
  },
  {
    title: 'إدارة الشركة',
    icon: Building,
    color: 'text-orange-600',
    children: [
      {
        title: 'لوحة تحكم الشركة',
        icon: Building,
        path: '/company-dashboard'
      },
      {
        title: 'إدارة المستخدمين',
        icon: Users,
        path: '/user-management'
      },
      {
        title: 'خطط الاشتراك',
        icon: Crown,
        path: '/subscription-plans'
      },
      {
        title: 'ترقية الخطة',
        icon: TrendingUp,
        path: '/upgrade-plan'
      }
    ]
  },
  {
    title: 'لوحة التحكم',
    icon: Activity,
    color: 'text-indigo-600',
    children: [
      {
        title: 'لوحة التحكم الرئيسية',
        icon: Activity,
        path: '/dashboard'
      },
      {
        title: 'لوحة المتجر',
        icon: Store,
        path: '/store-dashboard'
      }
    ]
  },
  {
    title: 'واتساب',
    icon: MessageCircle,
    color: 'text-green-600',
    children: [
      {
        title: 'المحادثات',
        icon: MessageSquare,
        path: '/whatsapp-conversations'
      },
      {
        title: 'إعدادات الواتساب',
        icon: Settings,
        path: '/whatsapp'
      },
      {
        title: 'إعدادات الذكاء الاصطناعي',
        icon: Bot,
        path: '/whatsapp-gemini-settings'
      },
      {
        title: 'واتساب متقدم',
        icon: Settings,
        path: '/whatsapp-advanced'
      },
      {
        title: 'واتساب أساسي',
        icon: MessageCircle,
        path: '/whatsapp-basic'
      },
      {
        title: 'اختبار واتساب',
        icon: TestTube,
        path: '/whatsapp-test'
      },
      {
        title: 'دردشة واتساب',
        icon: MessageSquare,
        path: '/whatsapp-chat'
      }
    ]
  },
  {
    title: 'فيسبوك',
    icon: Facebook,
    color: 'text-blue-700',
    children: [
      {
        title: 'المحادثات',
        icon: MessageSquare,
        path: '/facebook-conversations'
      },
      {
        title: 'إعدادات فيسبوك',
        icon: Settings,
        path: '/facebook-settings'
      },
      {
        title: 'إعدادات الذكاء الاصطناعي',
        icon: Bot,
        path: '/facebook-ai-settings'
      },
      {
        title: 'الردود',
        icon: MessageSquare,
        path: '/responses'
      }
    ]
  },
  {
    title: 'المتجر الإلكتروني',
    icon: Store,
    color: 'text-emerald-600',
    children: [
      {
        title: 'إعدادات المتجر',
        icon: Store,
        path: '/store-management'
      },
      {
        title: 'المنتجات',
        icon: Package,
        path: '/ecommerce-products'
      },
      {
        title: 'الفئات',
        icon: Layers,
        path: '/categories'
      },
      {
        title: 'المتجر',
        icon: ShoppingBag,
        path: '/shop'
      },
      {
        title: 'السلة',
        icon: ShoppingCart,
        path: '/cart'
      },
      {
        title: 'الدفع',
        icon: DollarSign,
        path: '/checkout'
      },
      {
        title: 'إدارة الطلبات',
        icon: FileText,
        path: '/orders'
      },
      {
        title: '🔧 تشخيص الطلبات',
        icon: FileText,
        path: '/test-diagnosis'
      },
      {
        title: 'الكوبونات',
        icon: Gift,
        path: '/coupons'
      },
      {
        title: 'الشحن',
        icon: Truck,
        path: '/shipping'
      },
      {
        title: 'إحصائيات المتجر',
        icon: TrendingUp,
        path: '/ecommerce-analytics'
      },
      {
        title: 'إعداد المتجر',
        icon: Settings,
        path: '/store-setup'
      },
      {
        title: 'متغيرات المنتج',
        icon: Package,
        path: '/product-variants'
      }
    ]
  },
  {
    title: 'الإحصائيات',
    icon: BarChart3,
    color: 'text-purple-600',
    children: [
      {
        title: 'إحصائيات عامة',
        icon: Activity,
        path: '/analytics'
      },
      {
        title: 'إحصائيات المتجر',
        icon: TrendingUp,
        path: '/ecommerce-analytics'
      },
      {
        title: 'تقارير الرسائل',
        icon: Mail,
        path: '/message-reports'
      },
      {
        title: 'أداء الذكاء الاصطناعي',
        icon: Bot,
        path: '/ai-performance'
      }
    ]
  },
  {
    title: 'اختبار النظام',
    icon: TestTube,
    color: 'text-pink-600',
    children: [
      {
        title: 'دليل البدء السريع',
        icon: FileText,
        path: '/quick-start-guide'
      },
      {
        title: 'محاكي الدردشة',
        icon: MessageCircle,
        path: '/simple-test-chat'
      }
    ]
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    color: 'text-gray-600',
    children: [
      {
        title: 'الإعدادات العامة',
        icon: Settings,
        path: '/settings'
      },
      {
        title: 'إعداد المتجر',
        icon: Store,
        path: '/store-setup'
      },
      {
        title: 'إعدادات الأمان',
        icon: Shield,
        path: '/security-settings'
      },
      {
        title: 'إعدادات المظهر',
        icon: Palette,
        path: '/appearance-settings'
      },
      {
        title: 'إعدادات الشبكة',
        icon: Globe,
        path: '/network-settings'
      }
    ]
  },
  {
    title: 'قاعدة البيانات',
    icon: Database,
    color: 'text-indigo-600',
    children: [
      {
        title: 'إدارة البيانات',
        icon: Database,
        path: '/database-management'
      },
      {
        title: 'النسخ الاحتياطي',
        icon: Shield,
        path: '/backup-restore'
      },
      {
        title: 'تنظيف البيانات',
        icon: Activity,
        path: '/data-cleanup'
      }
    ]
  }
];

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['إدارة الشركة']);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // إزالة بيانات المصادقة
    localStorage.removeItem('company');
    localStorage.removeItem('userToken');

    // الانتقال لصفحة تسجيل الدخول
    navigate('/company-login', { replace: true });
  };

  const getCompanyInfo = () => {
    try {
      const companyData = localStorage.getItem('company');
      if (companyData) {
        return JSON.parse(companyData);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات الشركة:', error);
    }
    return null;
  };

  const company = getCompanyInfo();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (children: MenuItem[]) => {
    return children.some(child => child.path && isActive(child.path));
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">إدارة الأعمال</h1>
              <p className="text-xs text-gray-500">نظام شامل للتواصل</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isParentActive(item.children)
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <item.icon className={cn("w-5 h-5", item.color)} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      expandedItems.includes(item.title) 
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {!isCollapsed && expandedItems.includes(item.title) && (
                    <div className="mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.title}
                          to={child.path || '#'}
                          className={cn(
                            "flex items-center space-x-3 rtl:space-x-reverse px-6 py-2 text-sm rounded-lg transition-colors",
                            isActive(child.path || '')
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path || '#'}
                  className={cn(
                    "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.path || '')
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-100",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", item.color)} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* معلومات الشركة */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {company?.name || 'اسم الشركة'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {company?.email || 'company@example.com'}
              </p>
            </div>
          </div>

          {/* زر تسجيل الخروج */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
