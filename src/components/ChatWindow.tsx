
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, User, Bot, MoreVertical, Phone, Video, Loader2, ImagePlus, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { GeminiTestButton } from "@/components/GeminiTestButton";
import { getDisplayName } from "@/utils/nameUtils";
import { frontendLogger } from "@/utils/frontendLogger";

interface ChatWindowProps {
  conversationId: string;
}

const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { messages, isLoading, error, sendMessage } = useMessages(conversationId);
  const { conversations } = useConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find(c => c && c.id === conversationId) ||
    (conversationId && conversationId.startsWith('test-') ? {
      id: conversationId,
      customer_name: `مستخدم تجريبي ${conversationId.split('-')[1]}`,
      customer_facebook_id: 'test-user',
      facebook_page_id: '240244019177739',
      is_online: true,
      last_message: 'رسالة تجريبية',
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      page_name: 'صفحة تجريبية',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (message.trim() || selectedImage) {
      try {
        await sendMessage.mutateAsync({
          content: message.trim(),
          senderType: 'admin',
          imageFile: selectedImage || undefined
        });

        setMessage("");
        handleRemoveImage();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // فحص إذا كان النص عبارة عن رابط صورة طويل
  const isImageUrl = (text: string) => {
    if (!text) return false;
    return text.startsWith('https://scontent.xx.fbcdn.net') ||
           text.startsWith('https://scontent-') ||
           (text.startsWith('https://') && text.includes('fbcdn.net')) ||
           text.includes('fbcdn.net') ||
           (text.startsWith('https://') && text.length > 100); // أي رابط طويل
  };

  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>خطأ في تحميل الرسائل</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>المحادثة غير موجودة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* رأس الدردشة */}
      <CardHeader className="pb-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {conversation.is_online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {getDisplayName(
                  conversation.customer_name,
                  conversation.customer_facebook_id,
                  conversation.id,
                  conversation.page_name
                )}
              </h3>
              <div className="flex flex-col space-y-1">
                <p className="text-sm text-green-600">
                  {conversation.is_online ? "متصل الآن" : "غير متصل"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-blue-600 flex items-center">
                    📄 {conversation.page_name ||
                        (conversation.facebook_page_id === '260345600493273' ? 'Swan shop' :
                         conversation.facebook_page_id === '240244019177739' ? 'سولا 127' :
                         'صفحة غير معروفة')}
                  </p>
                  {/* عرض حالة المحادثة البسيطة */}
                  {conversation.unread_count > 0 ? (
                    <Badge variant="secondary" className="text-xs bg-red-500 text-white">
                      <AlertCircle className="w-3 h-3 ml-1" />
                      {conversation.unread_count} غير مقروء
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      تم الرد على الكل
                    </Badge>
                  )}
                </div>
              </div>
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
      <CardContent className="flex-1 overflow-y-scroll p-4 space-y-4" style={{maxHeight: 'calc(100vh - 400px)'}}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="mr-2">تحميل الرسائل...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد رسائل في هذه المحادثة</p>
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <div>معرف المحادثة: {conversationId}</div>
                <div>عدد الرسائل غير المقروءة: {conversation.unread_count}</div>
                <div>تحقق من الـ Console للمزيد من التفاصيل</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* إضافة رسائل تجريبية للاختبار فقط للمحادثات التجريبية */}
            {conversationId.startsWith('test-') && (
              <>
                {/* رسالة نصية عادية */}
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                    <p className="text-sm leading-relaxed">مرحبا، أريد الاستفسار عن المنتجات المتاحة</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">18:25</span>
                    </div>
                  </div>
                </div>

                {/* رسالة مع صورة - بدون عرض الرابط */}
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                    <div className="space-y-2">
                      <img
                        src="https://scontent.xx.fbcdn.net/v/t1.15752-9/494575858_1163162992491513_3678752218676932658_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=9f807c&_nc_ohc=3Fm2kReTgQYXNwrYVOYg&_nc_oc=Adr7gBNfBeAm9LjcsHj-RtO2nrsfxw55KHNvmyg7fs1WPeGSTSPKvpNVFZKnlrbNb&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=03_Q7cD2GGtd0_RspXo2A7K53QGArksfyFXfQ3gCS-fmyj8EMJoGw&oe=68615EE"
                        alt="صورة"
                        className="max-w-48 max-h-48 rounded border object-cover cursor-pointer"
                        onClick={() => window.open("https://scontent.xx.fbcdn.net/v/t1.15752-9/494575858_1163162992491513_3678752218676932658_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=9f807c&_nc_ohc=3Fm2kReTgQYXNwrYVOYg&_nc_oc=Adr7gBNfBeAm9LjcsHj-RtO2nrsfxw55KHNvmyg7fs1WPeGSTSPKvpNVFZKnlrbNb&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=03_Q7cD2GGtd0_RspXo2A7K53QGArksfyFXfQ3gCS-fmyj8EMJoGw&oe=68615EE", '_blank')}
                      />
                      <p className="text-sm leading-relaxed opacity-70">📷 صورة</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">18:26</span>
                    </div>
                  </div>
                </div>

                {/* رسالة رد آلي */}
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-500 text-white">
                    <p className="text-sm leading-relaxed">
                      🎯 مساء الخير ⚽ Omar Elnaghry
                      من المنتجات اللي معنا دلوقتي للعيد 🎁🎁
                      أحوال تختلف القلب 😍 نادر عرض ال 3 قطع إنتاج إيطالي وياباني على
                      باقي الألوان واطلبي دلوقتي 💗
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">18:26</span>
                      <Badge variant="secondary" className="text-xs bg-white bg-opacity-20">
                        <Bot className="w-3 h-3 ml-1" />
                        رد آلي
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender_type === 'customer'
                      ? 'bg-gray-100 text-gray-900'
                      : msg.sender_type === 'bot'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {/* عرض المحتوى مع معالجة الصور */}
                  <div className="space-y-2">
                    {/* عرض الصورة إذا كانت موجودة */}
                    {msg.image_url && msg.image_url !== 'image_sent' && (
                      <img
                        src={msg.image_url}
                        alt="صورة"
                        className="max-w-48 max-h-48 rounded border object-cover cursor-pointer"
                        onClick={() => window.open(msg.image_url!, '_blank')}
                        onError={(e) => {
                          console.error('Error loading image:', msg.image_url);
                          // إخفاء الصورة إذا فشل تحميلها
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}

                    {/* عرض النص - إخفاء الروابط الطويلة للصور */}
                    {msg.content && !isImageUrl(msg.content) && (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}

                    {/* عرض نص بديل للصور بدون محتوى نصي أو مع رابط صورة فقط */}
                    {msg.image_url && (!msg.content || isImageUrl(msg.content)) && (
                      <p className="text-sm leading-relaxed opacity-70">📷 صورة</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                    <span className="text-xs opacity-70">{formatTimestamp(msg.created_at)}</span>
                    <div className="flex items-center gap-1">
                      {/* عرض badge نوع الرسالة فقط للبوت */}
                      {msg.sender_type === 'bot' && msg.is_auto_reply && (
                        <Badge variant="secondary" className="text-xs bg-white bg-opacity-20">
                          <Bot className="w-3 h-3 ml-1" />
                          {msg.is_ai_generated ? 'Gemini AI' : 'رد آلي'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} className="pb-4" />
      </CardContent>

      {/* منطقة إرسال الرسائل */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">
        {/* معاينة الصورة */}
        {imagePreview && (
          <div className="mb-3 p-2 border rounded-lg bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">صورة مرفقة:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="text-red-500 hover:text-red-700"
              >
                إزالة
              </Button>
            </div>
            <img
              src={imagePreview}
              alt="معاينة الصورة"
              className="max-w-32 max-h-32 rounded border object-cover"
            />
          </div>
        )}

        <div className="flex space-x-2 space-x-reverse">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 min-h-[60px] max-h-32 resize-none"
            disabled={sendMessage.isPending}
          />

          {/* زر رفع الصور */}
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessage.isPending}
            className="px-3"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => {
              const buttonData = {
                messageLength: message.trim().length,
                hasImage: !!selectedImage,
                isPending: sendMessage.isPending,
                isDisabled: (!message.trim() && !selectedImage) || sendMessage.isPending,
                conversationId: conversationId
              };

              frontendLogger.buttonClick('Send Message Button', buttonData);
              handleSendMessage();
            }}
            disabled={(!message.trim() && !selectedImage) || sendMessage.isPending}
            className="bg-blue-500 hover:bg-blue-600 px-4"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Input مخفي لرفع الصور */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>اضغط Enter للإرسال، Shift+Enter لسطر جديد</span>
          </div>
          <div className="flex items-center gap-2">
            <GeminiTestButton
              conversationId={conversationId}
              senderId={conversation.customer_facebook_id}
              lastMessage={messages[messages.length - 1]?.content}
            />
            <span className="text-green-600">متصل</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatWindow;
