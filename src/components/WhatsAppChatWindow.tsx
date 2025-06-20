import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Loader2, 
  ImagePlus, 
  Phone, 
  Video, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";

interface WhatsAppMessage {
  id: string;
  text: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  status?: 'sent' | 'delivered' | 'read';
  messageType?: 'text' | 'image' | 'audio' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface WhatsAppChatWindowProps {
  conversationId: string;
  isConnected: boolean;
}

const WhatsAppChatWindow = ({ conversationId, isConnected }: WhatsAppChatWindowProps) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contactInfo, setContactInfo] = useState<{name: string, phone: string, isOnline?: boolean} | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل الرسائل عند تغيير المحادثة
  useEffect(() => {
    if (conversationId && isConnected) {
      loadMessages(true); // تحميل أولي مع loader
      loadContactInfo();

      // تحديث دوري للرسائل كل 5 ثوانٍ بدون loader
      const interval = setInterval(() => loadMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId, isConnected]);

  // التمرير للأسفل عند وصول رسائل جديدة (فقط إذا كان المستخدم في الأسفل)
  useEffect(() => {
    if (messages.length > 0) {
      // تأخير بسيط لضمان تحديث DOM
      setTimeout(() => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
          const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
          if (isAtBottom) {
            scrollToBottom();
          }
        }
      }, 100);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadContactInfo = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/whatsapp-baileys/contact/${conversationId}`);
      const data = await response.json();
      
      if (data.success && data.contact) {
        setContactInfo({
          name: data.contact.name || conversationId,
          phone: conversationId,
          isOnline: data.contact.isOnline || false
        });
      } else {
        setContactInfo({
          name: conversationId,
          phone: conversationId,
          isOnline: false
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل معلومات جهة الاتصال:', error);
      setContactInfo({
        name: conversationId,
        phone: conversationId,
        isOnline: false
      });
    }
  };

  const loadMessages = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3002/api/whatsapp-baileys/conversation/${conversationId}`);
      const data = await response.json();

      if (data.success && data.messages) {
        const formattedMessages: WhatsAppMessage[] = data.messages.map((msg: any) => {
          let messageType: 'text' | 'image' | 'audio' | 'file' = 'text';
          let fileUrl: string | undefined;
          let fileName: string | undefined;

          // تحديد نوع الرسالة
          if (msg.message_text?.includes('[صورة]') || msg.message_text?.includes('[image]')) {
            messageType = 'image';
            fileUrl = msg.file_url;
          } else if (msg.message_text?.includes('[صوت]') || msg.message_text?.includes('[audio]')) {
            messageType = 'audio';
            fileUrl = msg.file_url;
          } else if (msg.message_text?.includes('[ملف]') || msg.message_text?.includes('[file]')) {
            messageType = 'file';
            fileUrl = msg.file_url;
            fileName = msg.file_name;
          }

          return {
            id: msg.message_id || `msg_${Date.now()}_${Math.random()}`,
            text: msg.message_text || '',
            timestamp: new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: msg.message_type === 'outgoing' ? 'outgoing' : 'incoming',
            status: msg.message_type === 'outgoing' ? 'delivered' : undefined,
            messageType,
            fileUrl,
            fileName
          };
        });

        // تحديث الرسائل فقط إذا كان هناك تغيير
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(formattedMessages)) {
            return formattedMessages;
          }
          return prevMessages;
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الرسائل:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedImage) || !isConnected || isSending) return;

    setIsSending(true);
    const messageText = message;
    setMessage('');

    // إضافة رسالة مؤقتة للواجهة
    const tempMessage: WhatsAppMessage = {
      id: `temp_${Date.now()}`,
      text: messageText,
      timestamp: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'outgoing',
      status: 'sent'
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      if (selectedImage) {
        // إرسال صورة
        const formData = new FormData();
        formData.append('phoneNumber', conversationId);
        formData.append('file', selectedImage);
        if (messageText) {
          formData.append('caption', messageText);
        }

        const response = await fetch('http://localhost:3002/api/whatsapp-baileys/send-file', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          console.log('تم إرسال الملف بنجاح');
        } else {
          throw new Error('فشل في إرسال الملف');
        }

        // مسح الصورة المحددة
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // إرسال رسالة نصية
        const response = await fetch('http://localhost:3002/api/whatsapp-baileys/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: conversationId,
            message: messageText
          })
        });

        if (!response.ok) {
          throw new Error('فشل في إرسال الرسالة');
        }
      }

      // تحديث الرسائل بعد الإرسال
      setTimeout(() => {
        loadMessages();
      }, 1000);

    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      // إزالة الرسالة المؤقتة في حالة الفشل
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setMessage(messageText); // إعادة النص للحقل
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderMessageStatus = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  if (!isConnected) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">الواتساب غير متصل</h3>
          <p>يرجى الاتصال بالواتساب أولاً لعرض المحادثات</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* رأس المحادثة */}
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="relative">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {contactInfo?.name.charAt(0).toUpperCase() || '?'}
              </div>
              {contactInfo?.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {contactInfo?.name || conversationId}
              </h3>
              <p className="text-sm text-gray-500">
                {contactInfo?.phone || conversationId}
              </p>
              {contactInfo?.isOnline && (
                <Badge variant="secondary" className="text-xs">
                  متصل الآن
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* منطقة الرسائل */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{maxHeight: 'calc(100vh - 200px)'}}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="mr-2">تحميل الرسائل...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p>لا توجد رسائل</p>
              <p className="text-sm mt-2">ابدأ محادثة جديدة</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                    msg.type === 'outgoing'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {/* عرض الصور */}
                  {msg.messageType === 'image' && msg.fileUrl && (
                    <div className="mb-2">
                      <img
                        src={msg.fileUrl}
                        alt="صورة"
                        className="max-w-full rounded cursor-pointer"
                        onClick={() => window.open(msg.fileUrl!, '_blank')}
                      />
                    </div>
                  )}

                  {/* عرض النص */}
                  {msg.text && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  )}

                  {/* معلومات الرسالة */}
                  <div className={`flex items-center justify-end mt-1 space-x-1 space-x-reverse ${
                    msg.type === 'outgoing' ? 'text-green-100' : 'text-gray-400'
                  }`}>
                    <span className="text-xs">{msg.timestamp}</span>
                    {msg.type === 'outgoing' && renderMessageStatus(msg.status)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* منطقة الإدخال */}
      <div className="p-4 border-t flex-shrink-0">
        {/* معاينة الصورة */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="معاينة" className="max-w-32 max-h-32 rounded border" />
            <Button
              onClick={handleRemoveImage}
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            >
              ×
            </Button>
          </div>
        )}

        <div className="flex space-x-2 space-x-reverse">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 min-h-[60px] max-h-32 resize-none"
            disabled={isSending || !isConnected}
          />

          {/* زر رفع الصور */}
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !isConnected}
            className="px-3"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>

          {/* زر الإرسال */}
          <Button
            onClick={handleSendMessage}
            disabled={(!message.trim() && !selectedImage) || isSending || !isConnected}
            className="px-6 bg-green-500 hover:bg-green-600"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* حقل رفع الملفات المخفي */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </Card>
  );
};

export default WhatsAppChatWindow;
