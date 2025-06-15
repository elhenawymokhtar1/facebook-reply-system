import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import {
  Rocket,
  Store,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Settings,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Palette,
  MessageSquare,
  Bot,
  Truck,
  Percent,
  Tags
} from "lucide-react";
import { Link } from "react-router-dom";

const StoreDashboard = () => {
  const quickStats = [
    {
      title: 'إجمالي المنتجات',
      value: '13',
      change: '+3 هذا الأسبوع',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'الطلبات الجديدة',
      value: '0',
      change: 'جاهز لاستقبال الطلبات',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'العملاء',
      value: '0',
      change: 'ابدأ التسويق الآن',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'المبيعات',
      value: '0 ج',
      change: 'أول عملية بيع قادمة',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const quickActions = [
    {
      title: 'إعداد المتجر',
      description: 'أضف المنتجات وأعد الشحن والكوبونات',
      icon: Rocket,
      link: '/store-setup',
      color: 'bg-gradient-to-r from-green-500 to-blue-500',
      highlight: true
    },
    {
      title: 'إدارة المنتجات',
      description: 'أضف وعدل المنتجات والأسعار',
      icon: ShoppingBag,
      link: '/ecommerce-products',
      color: 'bg-blue-600'
    },
    {
      title: 'زيارة المتجر',
      description: 'شاهد متجرك كما يراه العملاء',
      icon: Store,
      link: '/shop',
      color: 'bg-purple-600'
    },
    {
      title: 'إدارة الطلبات',
      description: 'تابع ومعالج طلبات العملاء',
      icon: Package,
      link: '/orders',
      color: 'bg-green-600'
    },
    {
      title: 'التحليلات',
      description: 'راقب أداء المتجر والمبيعات',
      icon: BarChart3,
      link: '/ecommerce-analytics',
      color: 'bg-orange-600'
    },
    {
      title: 'الإعدادات',
      description: 'أعد الشحن والكوبونات والمزيد',
      icon: Settings,
      link: '/settings',
      color: 'bg-gray-600'
    },
    {
      title: 'المنتجات متعددة الخواص',
      description: 'إدارة المنتجات بألوان ومقاسات مختلفة',
      icon: Palette,
      link: '/product-variants',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      highlight: true
    }
  ];

  const features = [
    'متجر إلكتروني متكامل مع واجهة احترافية',
    'نظام إدارة المنتجات والمخزون',
    'سلة تسوق ذكية مع كوبونات الخصم',
    'نظام طلبات متكامل مع تتبع الحالات',
    'طرق شحن متعددة مع حساب تكلفة ذكي',
    'تحليلات وتقارير شاملة للأداء',
    'ذكاء اصطناعي لمساعدة العملاء',
    'واجهات متجاوبة لجميع الأجهزة'
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          مرحباً بك في متجر سوان شوب 🛍️
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          منصة التجارة الإلكترونية المتكاملة مع الذكاء الاصطناعي
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/store-setup">
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 text-lg hover:from-green-600 hover:to-blue-600">
              <Rocket className="w-5 h-5 ml-2" />
              ابدأ إعداد متجرك الآن
            </Button>
          </Link>

          <Link to="/product-variants">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 text-lg hover:from-purple-600 hover:to-pink-600">
              <Palette className="w-5 h-5 ml-2" />
              المنتجات متعددة الخواص
            </Button>
          </Link>
        </div>
      </div>

      {/* بطاقة مميزة للمنتجات متعددة الخواص */}
      <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🎨 المنتجات متعددة الخواص</h2>
              <p className="text-purple-100 mb-4">
                إدارة المنتجات بألوان ومقاسات ومواد مختلفة - ميزة جديدة!
              </p>
              <Link to="/product-variants">
                <Button className="bg-white text-purple-600 hover:bg-purple-50">
                  <Palette className="w-4 h-4 ml-2" />
                  جرب الآن
                </Button>
              </Link>
            </div>
            <div className="hidden md:block">
              <Palette className="w-24 h-24 text-purple-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* إجراءات سريعة */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <div className={`${action.color} p-6 rounded-lg text-white hover:opacity-90 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1`}>
                  {/* Background overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/10 rounded-lg"></div>

                  <div className="relative z-10">
                    {action.highlight && (
                      <Badge className="absolute top-2 left-2 bg-white/30 text-white border-0 font-semibold px-3 py-1 shadow-md">
                        جديد
                      </Badge>
                    )}
                    <action.icon className="w-10 h-10 mb-4 drop-shadow-lg" />
                    <h3 className="font-semibold text-lg mb-2 drop-shadow-md">{action.title}</h3>
                    <p className="text-sm opacity-90 mb-4 drop-shadow-sm leading-relaxed">{action.description}</p>
                    <div className="flex items-center text-sm drop-shadow-sm">
                      <span>ابدأ الآن</span>
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </div>
                  </div>

                  {/* Decorative element */}
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/10 rounded-full"></div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* المميزات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              مميزات المتجر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              خطوات البدء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">إعداد المتجر</h4>
                  <p className="text-sm text-green-700">أضف المنتجات وأعد الشحن والكوبونات</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">اختبار المتجر</h4>
                  <p className="text-sm text-blue-700">جرب عملية الطلب الكاملة</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800">بدء التسويق</h4>
                  <p className="text-sm text-purple-700">شارك المتجر وابدأ البيع</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800">مراقبة الأداء</h4>
                  <p className="text-sm text-orange-700">تابع المبيعات والتحليلات</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* روابط سريعة */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            جميع الأنظمة والروابط المهمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* أنظمة المتجر */}
            <Link to="/shop" className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
              <Store className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">المتجر</p>
            </Link>
            <Link to="/ecommerce-products" className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium text-green-800">المنتجات</p>
            </Link>
            <Link to="/orders" className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
              <Package className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium text-purple-800">الطلبات</p>
            </Link>
            <Link to="/ecommerce-analytics" className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium text-orange-800">التحليلات</p>
            </Link>
            <Link to="/product-variants" className="text-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors border border-pink-200">
              <Palette className="w-8 h-8 mx-auto mb-2 text-pink-600" />
              <p className="text-sm font-medium text-pink-800">المنتجات متعددة الخواص</p>
            </Link>
            <Link to="/categories" className="text-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
              <Tags className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-medium text-indigo-800">الفئات</p>
            </Link>

            {/* أنظمة الشحن والكوبونات */}
            <Link to="/shipping" className="text-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200">
              <Truck className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-800">الشحن</p>
            </Link>
            <Link to="/coupons" className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
              <Percent className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium text-red-800">الكوبونات</p>
            </Link>

            {/* أنظمة الذكاء الاصطناعي */}
            <Link to="/conversations" className="text-center p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border border-cyan-200">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
              <p className="text-sm font-medium text-cyan-800">المحادثات</p>
            </Link>
            <Link to="/responses" className="text-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200">
              <Bot className="w-8 h-8 mx-auto mb-2 text-teal-600" />
              <p className="text-sm font-medium text-teal-800">الردود الآلية</p>
            </Link>

            {/* أنظمة الإدارة */}
            <Link to="/settings" className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-800">الإعدادات</p>
            </Link>
            <Link to="/dashboard" className="text-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">لوحة التحكم العامة</p>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default StoreDashboard;
