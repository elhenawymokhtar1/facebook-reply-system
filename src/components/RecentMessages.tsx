
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, User, Clock } from "lucide-react";

const RecentMessages = () => {
  const messages = [
    {
      id: 1,
      sender: "أحمد محمد",
      message: "مرحبا، أريد معرفة أوقات العمل",
      timestamp: "منذ 5 دقائق",
      status: "تم الرد آلياً",
      response: "أوقات العمل من 9 صباحاً حتى 6 مساءً",
      statusColor: "green"
    },
    {
      id: 2,
      sender: "فاطمة أحمد",
      message: "هل يمكنني الحصول على كتالوج المنتجات؟",
      timestamp: "منذ 12 دقيقة",
      status: "في الانتظار",
      response: null,
      statusColor: "yellow"
    },
    {
      id: 3,
      sender: "محمد علي",
      message: "أريد معرفة الأسعار الجديدة",
      timestamp: "منذ 18 دقيقة",
      status: "تم الرد آلياً",
      response: "يمكنك الاطلاع على قائمة الأسعار من الرابط التالي...",
      statusColor: "green"
    },
    {
      id: 4,
      sender: "سارة خالد",
      message: "متى سيكون المنتج متوفراً؟",
      timestamp: "منذ 25 دقيقة",
      status: "يحتاج متابعة",
      response: null,
      statusColor: "red"
    }
  ];

  const getStatusBadge = (status: string, color: string) => {
    const colorClasses = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colorClasses[color as keyof typeof colorClasses]}>
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">الرسائل الحديثة</CardTitle>
        <Button variant="outline" size="sm">
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{message.sender}</h4>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{message.timestamp}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(message.status, message.statusColor)}
              </div>

              <div className="mb-3">
                <div className="flex items-start space-x-2 space-x-reverse">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{message.message}</p>
                </div>
              </div>

              {message.response && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">الرد الآلي: </span>
                    {message.response}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <Eye className="w-4 h-4 ml-1" />
                  عرض التفاصيل
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentMessages;
