import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
// import { AutoReplyService } from "@/services/autoReplyService"; // تم حذفه
import { SimpleGeminiService } from "@/services/simpleGeminiService";
import { useToast } from "@/hooks/use-toast";

interface TestMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  matchedKeyword?: string;
}

const AutoReplyTester = () => {
  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("");
  const [isTestingReply, setIsTestingReply] = useState(false);
  const [testHistory, setTestHistory] = useState<TestMessage[]>([]);

  const handleTestReply = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رسالة للاختبار",
        variant: "destructive",
      });
      return;
    }

    setIsTestingReply(true);

    try {
      // إضافة رسالة المستخدم للتاريخ
      const userMessage: TestMessage = {
        id: Date.now().toString(),
        text: testMessage,
        sender: 'user',
        timestamp: new Date()
      };

      setTestHistory(prev => [...prev, userMessage]);

      // البحث عن رد مناسب باستخدام النظام الجديد
      const success = await SimpleGeminiService.processMessage(testMessage, 'test-conversation', 'test-sender');

      if (success) {
        // إضافة رد البوت
        const botMessage: TestMessage = {
          id: (Date.now() + 1).toString(),
          text: "تم معالجة الرسالة بنجاح بواسطة النظام الذكي الجديد",
          sender: 'bot',
          timestamp: new Date(),
          matchedKeyword: 'نظام ذكي'
        };

        setTimeout(() => {
          setTestHistory(prev => [...prev, botMessage]);
        }, 1000); // محاكاة تأخير الرد

        toast({
          title: "تم المعالجة بنجاح",
          description: "تم معالجة الرسالة بواسطة النظام الذكي الجديد",
        });
      } else {
        // لا يوجد رد مناسب
        const noReplyMessage: TestMessage = {
          id: (Date.now() + 1).toString(),
          text: "فشل في معالجة الرسالة بواسطة النظام الجديد",
          sender: 'bot',
          timestamp: new Date()
        };

        setTimeout(() => {
          setTestHistory(prev => [...prev, noReplyMessage]);
        }, 1000);

        toast({
          title: "لم يتم العثور على رد مناسب",
          description: "لا توجد كلمات مفتاحية تطابق هذه الرسالة",
          variant: "destructive",
        });
      }

      setTestMessage("");
    } catch (error) {
      toast({
        title: "خطأ في الاختبار",
        description: "حدث خطأ أثناء اختبار الرد الآلي",
        variant: "destructive",
      });
    } finally {
      setIsTestingReply(false);
    }
  };

  const clearHistory = () => {
    setTestHistory([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span>اختبار الردود الآلية</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* منطقة المحادثة */}
        <div className="flex-1 border rounded-lg p-4 bg-gray-50 overflow-y-auto max-h-96">
          {testHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ابدأ بكتابة رسالة لاختبار الردود الآلية</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.sender === 'user' ? 'أنت' : 'البوت'}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm">{message.text}</p>
                    
                    {message.matchedKeyword && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          مطابقة: {message.matchedKeyword}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* منطقة إدخال الرسالة */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="test-message">رسالة الاختبار</Label>
            <Textarea
              id="test-message"
              placeholder="اكتب رسالة لاختبار الردود الآلية..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="mt-1"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTestReply();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={clearHistory}
              disabled={testHistory.length === 0}
            >
              مسح المحادثة
            </Button>
            
            <Button
              onClick={handleTestReply}
              disabled={isTestingReply || !testMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTestingReply ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Send className="w-4 h-4 ml-2" />
              )}
              اختبار الرد
            </Button>
          </div>
        </div>

        {/* نصائح */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">نصائح للاختبار:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• جرب كلمات مثل: "مرحبا"، "الأسعار"، "التوصيل"</li>
            <li>• اختبر كلمات مختلفة لنفس الموضوع</li>
            <li>• تأكد من أن الردود مناسبة ومفهومة</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoReplyTester;
