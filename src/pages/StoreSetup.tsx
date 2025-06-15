import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { addSampleData } from "@/utils/sampleData";
import { 
  Store,
  Package,
  Truck,
  Tag,
  CheckCircle,
  AlertCircle,
  Rocket,
  Database,
  ShoppingBag,
  Users,
  BarChart3
} from 'lucide-react';

const StoreSetup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const handleAddSampleData = async () => {
    setIsLoading(true);
    try {
      const success = await addSampleData();
      if (success) {
        setSetupComplete(true);
        toast({
          title: "تم الإعداد بنجاح! 🎉",
          description: "تم إضافة جميع البيانات التجريبية. المتجر جاهز للإطلاق!",
        });
      } else {
        toast({
          title: "خطأ في الإعداد",
          description: "حدث خطأ أثناء إضافة البيانات. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupSteps = [
    {
      title: 'إضافة المنتجات',
      description: '13 منتج متنوع (أحذية، ملابس، مستحضرات تجميل)',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'إعداد الشحن',
      description: '3 طرق شحن و 4 مناطق توصيل',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'إنشاء الكوبونات',
      description: '3 كوبونات ترحيبية للعملاء',
      icon: Tag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'تجهيز قاعدة البيانات',
      description: 'إعداد جميع الجداول والعلاقات',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const features = [
    {
      title: 'متجر إلكتروني متكامل',
      description: 'واجهة عملاء احترافية مع فلاتر متقدمة',
      icon: ShoppingBag,
      link: '/shop'
    },
    {
      title: 'إدارة شاملة',
      description: 'لوحة تحكم كاملة للمنتجات والطلبات',
      icon: Store,
      link: '/ecommerce-products'
    },
    {
      title: 'تحليلات متقدمة',
      description: 'مراقبة الأداء والمبيعات',
      icon: BarChart3,
      link: '/ecommerce-analytics'
    },
    {
      title: 'ذكاء اصطناعي',
      description: 'مساعد تسوق ذكي للعملاء',
      icon: Users,
      link: '/conversations'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 إطلاق متجر سوان شوب
        </h1>
        <p className="text-gray-600 text-lg">
          اجعل متجرك جاهزاً للإطلاق في دقائق معدودة
        </p>
      </div>

      {!setupComplete ? (
        <>
          {/* خطوات الإعداد */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                ما سيتم إضافته
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {setupSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-12 h-12 ${step.bgColor} rounded-lg flex items-center justify-center`}>
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* تحذير مهم */}
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">تنبيه مهم</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• سيتم إضافة بيانات تجريبية للمتجر</li>
                    <li>• يمكنك تعديل أو حذف هذه البيانات لاحقاً</li>
                    <li>• تأكد من إعداد قاعدة البيانات أولاً</li>
                    <li>• هذه العملية قد تستغرق بضع ثوانٍ</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* زر الإعداد */}
          <div className="text-center">
            <Button
              onClick={handleAddSampleData}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 text-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  جاري الإعداد...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 ml-2" />
                  ابدأ إعداد المتجر
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* رسالة النجاح */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                🎉 تم إعداد المتجر بنجاح!
              </h2>
              <p className="text-green-700 mb-6">
                متجرك الآن جاهز للإطلاق مع جميع البيانات والإعدادات اللازمة
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="font-semibold">13 منتج</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <Truck className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="font-semibold">3 طرق شحن</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="font-semibold">3 كوبونات</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <Database className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="font-semibold">جاهز للعمل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* روابط سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = feature.link}
                  >
                    فتح
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* الخطوات التالية */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>الخطوات التالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800">1</Badge>
                  <span>راجع المنتجات وعدل الأسعار والأوصاف حسب الحاجة</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-800">2</Badge>
                  <span>اختبر عملية الطلب الكاملة من المتجر</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-800">3</Badge>
                  <span>شارك رابط المتجر مع الأصدقاء للاختبار</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-orange-100 text-orange-800">4</Badge>
                  <span>ابدأ التسويق والإعلان عن المتجر</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StoreSetup;
