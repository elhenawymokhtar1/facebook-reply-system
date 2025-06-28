import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  MessageSquare, 
  Eye, 
  CheckCircle, 
  ArrowRight, 
  Facebook, 
  Bot, 
  Smartphone,
  Users,
  Zap,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";

const QuickStartGuide = () => {
  const steps = [
    {
      id: 1,
      title: "إعداد Facebook API",
      description: "اربط صفحة Facebook الخاصة بك مع النظام",
      icon: Facebook,
      color: "blue",
      link: "/settings",
      details: [
        "احصل على Page Access Token من Facebook Developers",
        "أدخل معرف الصفحة (Page ID)",
        "اضبط Webhook للرسائل الواردة"
      ]
    },
    {
      id: 2,
      title: "إعداد الذكاء الاصطناعي",
      description: "فعّل Gemini AI للردود الذكية",
      icon: Bot,
      color: "green",
      link: "/settings",
      details: [
        "احصل على مفتاح Google Gemini API",
        "اختر نموذج الذكاء الاصطناعي المناسب",
        "اضبط إعدادات الردود (درجة الحرارة، الطول)"
      ]
    },
    {
      id: 3,
      title: "اختبار النظام",
      description: "تأكد من عمل الردود الذكية بشكل صحيح",
      icon: Eye,
      color: "purple",
      link: "/simple-test-chat",
      details: [
        "جرب إرسال رسائل تجريبية",
        "اختبر كشف الألوان والمنتجات",
        "تأكد من إرسال الصور التلقائي"
      ]
    },
    {
      id: 4,
      title: "بدء استقبال الرسائل",
      description: "راقب وأدر المحادثات مع العملاء",
      icon: MessageSquare,
      color: "orange",
      link: "/conversations",
      details: [
        "راقب الرسائل الواردة في الوقت الفعلي",
        "اقرأ الردود الآلية المرسلة",
        "تدخل يدوياً عند الحاجة"
      ]
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "ردود فورية",
      description: "رد تلقائي على رسائل العملاء في ثوانٍ"
    },
    {
      icon: Smartphone,
      title: "كشف الألوان",
      description: "إرسال صور المنتجات عند طلب لون معين"
    },
    {
      icon: Users,
      title: "إدارة المحادثات",
      description: "تتبع جميع المحادثات في مكان واحد"
    },
    {
      icon: Shield,
      title: "آمن وموثوق",
      description: "حماية بيانات العملاء وخصوصيتهم"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-y-auto" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 دليل البدء السريع
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            اتبع هذه الخطوات البسيطة لتشغيل نظام الردود الذكية في دقائق معدودة
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {steps.map((step, index) => (
            <Card key={step.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${getColorClasses(step.color).replace('text-', 'bg-').replace('border-', '').split(' ')[0]}`}></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getColorClasses(step.color)}`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    خطوة {step.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
                <Link to={step.link}>
                  <Button className="w-full" variant="outline">
                    ابدأ الخطوة {step.id}
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">✨ مميزات النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">
                جاهز للبدء؟ 🎯
              </h2>
              <p className="text-blue-700 mb-6 max-w-md mx-auto">
                ابدأ بإعداد Facebook API أولاً، ثم انتقل للخطوات التالية
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/settings">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Settings className="w-5 h-5 ml-2" />
                    ابدأ الإعداد الآن
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="outline">
                    العودة للرئيسية
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;
