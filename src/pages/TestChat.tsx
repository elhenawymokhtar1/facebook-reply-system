import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Bot, 
  User, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'user' | 'bot';
  created_at: string;
}

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: 'active' | 'pending' | 'closed';
  last_message_at: string;
  created_at: string;
}

const TestChat = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // تحميل المحادثات
  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المحادثات",
        variant: "destructive",
      });
    }
  };

  // تحميل الرسائل
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    }
  };

  // إنشاء محادثة جديدة
  const createNewConversation = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم العميل ورقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          facebook_page_id: 'test-page',
          customer_name: customerName,
          customer_facebook_id: `test-${Date.now()}`,
          customer_phone: customerPhone,
          status: 'active',
          last_message_at: new Date().toISOString(),
          is_online: true,
          unread_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setCustomerName('');
      setCustomerPhone('');
      await loadConversations();
      setSelectedConversation(data.id);

      toast({
        title: "تم إنشاء المحادثة",
        description: `محادثة جديدة مع ${customerName}`,
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المحادثة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إرسال رسالة
  const sendMessage = async (senderType: 'user' | 'bot' = 'user') => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('test_messages')
        .insert({
          conversation_id: selectedConversation,
          content: newMessage,
          sender_type: senderType
        });

      if (error) throw error;

      // تحديث وقت آخر رسالة في المحادثة
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message: newMessage
        })
        .eq('id', selectedConversation);

      setNewMessage('');
      await loadMessages(selectedConversation);
      await loadConversations();

      // محاكاة رد الذكي الاصطناعي
      if (senderType === 'user') {
        setTimeout(() => {
          simulateAIResponse();
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // استخدام نظام Gemini AI الموجود
  const simulateAIResponse = async () => {
    if (!selectedConversation) return;

    try {
      // استخدام نظام Gemini AI الحقيقي
      const { SimpleGeminiService } = await import('@/services/simpleGeminiService');

      // الحصول على آخر رسالة من العميل
      const lastUserMessage = messages
        .filter(m => m.sender_type === 'user')
        .slice(-1)[0]?.content || 'مرحباً';

      // معالجة الرسالة باستخدام Gemini AI مع نفس conversation ID المحدد
      const success = await SimpleGeminiService.processMessage(
        lastUserMessage,
        selectedConversation,
        'test-user',
        'test-page'
      );

      if (success) {
        // إعادة تحميل الرسائل لعرض رد Gemini
        await loadMessages(selectedConversation);
        await loadConversations();
      } else {
        // في حالة فشل Gemini، استخدم رد افتراضي
        const fallbackResponses = [
          "مرحباً! كيف يمكنني مساعدتك اليوم؟",
          "شكراً لتواصلك معنا. ما الذي تبحث عنه؟",
          "أهلاً وسهلاً! هل تريد الاطلاع على منتجاتنا الجديدة؟",
          "يمكنني مساعدتك في اختيار المنتج المناسب لك."
        ];

        const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        await supabase
          .from('test_messages')
          .insert({
            conversation_id: selectedConversation,
            content: fallbackResponse,
            sender_type: 'bot'
          });

        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message: fallbackResponse
          })
          .eq('id', selectedConversation);

        await loadMessages(selectedConversation);
        await loadConversations();
      }
    } catch (error) {
      console.error('Error with AI response:', error);

      // رد افتراضي في حالة الخطأ
      const errorResponse = "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.";

      await supabase
        .from('test_messages')
        .insert({
          conversation_id: selectedConversation,
          content: errorResponse,
          sender_type: 'bot'
        });

      await loadMessages(selectedConversation);
      await loadConversations();
    }
  };

  // حذف محادثة
  const deleteConversation = async (conversationId: string) => {
    try {
      // حذف الرسائل أولاً
      await supabase
        .from('test_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // حذف المحادثة
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      await loadConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف المحادثة بنجاح",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المحادثة",
        variant: "destructive",
      });
    }
  };

  // التمرير لآخر رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'في الانتظار';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  return (
    <div className="conversations-page-container bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">محاكي المحادثات</h1>
              <p className="text-gray-600">اختبار نظام المحادثات بدون الاتصال بالفيسبوك</p>
            </div>
            <Button onClick={loadConversations} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-6 py-8 flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* قائمة المحادثات */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  المحادثات ({conversations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* إنشاء محادثة جديدة */}
                <div className="space-y-3 mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">محادثة جديدة</h4>
                  <Input
                    placeholder="اسم العميل"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    size="sm"
                  />
                  <Input
                    placeholder="رقم الهاتف"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    size="sm"
                  />
                  <Button
                    onClick={createNewConversation}
                    disabled={isLoading}
                    size="sm"
                    className="w-full"
                  >
                    إنشاء محادثة
                  </Button>
                </div>

                {/* قائمة المحادثات */}
                <div className="flex-1 min-h-0">
                  <div className="h-full overflow-y-auto space-y-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conversation.id
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{conversation.customer_name}</h4>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conversation.id);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{conversation.customer_phone}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(conversation.status)} variant="secondary">
                            {getStatusText(conversation.status)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.last_message_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* منطقة المحادثة */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {conversations.find(c => c.id === selectedConversation)?.customer_name}
                      <span className="text-sm text-gray-500">
                        ({conversations.find(c => c.id === selectedConversation)?.customer_phone})
                      </span>
                    </CardTitle>
                  </CardHeader>

                  {/* الرسائل */}
                  <CardContent className="flex-1 overflow-y-scroll p-4 space-y-4" style={{maxHeight: 'calc(100vh - 400px)'}}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.sender_type === 'user' ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <Bot className="w-3 h-3" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.sender_type === 'user' ? 'العميل' : 'الذكي الاصطناعي'}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.created_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} className="pb-4" />
                  </CardContent>

                  {/* إرسال رسالة */}
                  <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        placeholder="اكتب رسالتك هنا..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={() => sendMessage()}
                        disabled={isLoading || !newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
                    <p>اختر محادثة من القائمة أو أنشئ محادثة جديدة</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestChat;
