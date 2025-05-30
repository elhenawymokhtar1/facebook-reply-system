
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, User, Bot, MoreVertical, Phone, Video, Loader2, ImagePlus } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { GeminiTestButton } from "@/components/GeminiTestButton";

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

  const conversation = conversations.find(c => c.id === conversationId) ||
    (conversationId.startsWith('test-') ? {
      id: conversationId,
      customer_name: `مستخدم تجريبي ${conversationId.split('-')[1]}`,
      customer_facebook_id: 'test-user',
      is_online: true,
      last_message: 'رسالة تجريبية',
      last_message_at: new Date().toISOString(),
      unread_count: 0
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
              <h3 className="font-medium text-gray-900">{conversation.customer_name}</h3>
              <p className="text-sm text-green-600">
                {conversation.is_online ? "متصل الآن" : "غير متصل"}
              </p>
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
            <p>لا توجد رسائل في هذه المحادثة</p>
          </div>
        ) : (
          <>
            {/* إضافة رسائل تجريبية للاختبار */}
            {(messages.length === 0 || conversationId.startsWith('test-')) && (
              <>
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={`test-msg-${i}`}
                    className={`flex ${
                      i % 2 === 0 ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        i % 2 === 0
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        رسالة تجريبية رقم {i + 1} - هذا نص تجريبي لاختبار التمرير في نافذة الدردشة
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {new Date().toLocaleTimeString('ar', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="صورة"
                        className="max-w-48 max-h-48 rounded border object-cover cursor-pointer"
                        onClick={() => window.open(msg.image_url!, '_blank')}
                      />
                    )}

                    {/* عرض النص */}
                    {msg.content && (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">{formatTimestamp(msg.created_at)}</span>
                    {msg.sender_type === 'bot' && msg.is_auto_reply && (
                      <Badge variant="secondary" className="text-xs bg-white bg-opacity-20">
                        <Bot className="w-3 h-3 ml-1" />
                        {msg.is_ai_generated ? 'Gemini AI' : 'رد آلي'}
                      </Badge>
                    )}
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
            onClick={handleSendMessage}
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
            <GeminiTestButton
              conversationId={conversationId}
              senderId={conversation.customer_facebook_id}
              lastMessage={messages[messages.length - 1]?.content}
            />
          </div>
          <span className="text-green-600">متصل</span>
        </div>
      </div>
    </Card>
  );
};

export default ChatWindow;
