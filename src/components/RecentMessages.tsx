
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, User, Clock, RefreshCw } from "lucide-react";

const RecentMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // بيانات افتراضية في حالة فشل التحميل
  const defaultMessages = [
    {
      id: 1,
      customer_name: "أحمد محمد",
      content: "مرحبا، أريد معرفة أوقات العمل",
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sender_type: "customer",
      is_auto_reply: false
    },
    {
      id: 2,
      customer_name: "فاطمة أحمد",
      content: "هل يمكنني الحصول على كتالوج المنتجات؟",
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      sender_type: "customer",
      is_auto_reply: false
    },
    {
      id: 3,
      customer_name: "محمد علي",
      content: "أريد معرفة الأسعار الجديدة",
      created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      sender_type: "customer",
      is_auto_reply: false
    },
    {
      id: 4,
      customer_name: "سارة خالد",
      content: "متى سيكون المنتج متوفراً؟",
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      sender_type: "customer",
      is_auto_reply: false
    }
  ];

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3005/api/messages/recent');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.slice(0, 6)); // أحدث 6 رسائل
      setError(null);
    } catch (err) {
      console.error('Error fetching recent messages:', err);
      setError(err.message);
      setMessages(defaultMessages); // استخدام البيانات الافتراضية
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const messageTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  const getMessageStatus = (message) => {
    if (message.sender_type === 'admin') {
      return { status: "رد إداري", color: "blue" };
    } else if (message.sender_type === 'bot' || message.is_auto_reply) {
      return { status: "رد آلي", color: "green" };
    } else {
      return { status: "رسالة عميل", color: "yellow" };
    }
  };

  const getStatusBadge = (status: string, color: string) => {
    const colorClasses = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800"
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
        <CardTitle className="text-lg font-semibold">
          الرسائل الحديثة
          {error && <span className="text-sm text-yellow-600 font-normal mr-2">(بيانات تجريبية)</span>}
          {!error && !loading && <span className="text-sm text-green-600 font-normal mr-2">(بيانات حقيقية)</span>}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={fetchMessages}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            عرض الكل
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-500">جاري تحميل الرسائل...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">لا توجد رسائل حديثة</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => {
              const messageStatus = getMessageStatus(message);
              return (
                <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {message.customer_name || message.sender_name || "عميل"}
                        </h4>
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(message.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(messageStatus.status, messageStatus.color)}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 text-sm">{message.content}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentMessages;
