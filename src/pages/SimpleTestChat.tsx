import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Bot,
  User,
  MessageCircle,
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

const SimpleTestChat = () => {
  const { toast } = useToast();
  
  // محادثة اختبار ثابتة - استخدام ID ثابت للاختبار
  const TEST_CONVERSATION_ID = 'test-conversation-main';
  const TEST_CUSTOMER_NAME = 'عميل تجريبي';
  const [currentConversationId, setCurrentConversationId] = useState(TEST_CONVERSATION_ID);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // تحميل الرسائل
  const loadMessages = async () => {
    try {
      // البحث في test_messages أولاً، ثم في messages إذا لم توجد
      let { data: testData, error: testError } = await supabase
        .from('test_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (testError) {
        console.error('Error loading from test_messages:', testError);
        testData = [];
      }

      // إذا لم توجد رسائل في test_messages، جرب messages
      if (!testData || testData.length === 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });

        if (!messagesError && messagesData) {
          // تحويل تنسيق messages إلى test_messages
          const convertedData = messagesData.map(msg => ({
            ...msg,
            sender_type: msg.sender_type === 'customer' ? 'user' : 'bot'
          }));
          setMessages(convertedData);
          return;
        }
      }

      setMessages(testData || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    }
  };

  // مسح المحادثة (الرسائل فقط)
  const clearChat = async () => {
    try {
      // مسح من test_messages
      await supabase
        .from('test_messages')
        .delete()
        .eq('conversation_id', currentConversationId);

      // مسح من messages أيضاً
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', currentConversationId);

      setMessages([]);
      toast({
        title: "تم المسح",
        description: "تم مسح المحادثة بنجاح",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "خطأ",
        description: "فشل في مسح المحادثة",
        variant: "destructive",
      });
    }
  };

  // إرسال رسالة
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      // حفظ رسالة المستخدم أولاً
      const { error } = await supabase
        .from('test_messages')
        .insert({
          conversation_id: currentConversationId,
          content: newMessage,
          sender_type: 'user'
        });

      if (error) throw error;

      const userMessage = newMessage;
      setNewMessage('');
      await loadMessages();

      // استدعاء Gemini AI
      setTimeout(() => {
        simulateAIResponse(userMessage);
      }, 500);
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

  // استخدام نظام Gemini AI مباشرة (نفس إعدادات المحادثات الحقيقية)
  const simulateAIResponse = async (userMessage: string) => {
    console.log('🤖 [SIMPLE TEST CHAT] Starting AI response for:', userMessage);

    try {
      // استخدام نظام Gemini AI الحقيقي مباشرة - نفس إعدادات المحادثات
      const { SimpleGeminiService } = await import('@/services/simpleGeminiService');

      // معالجة الرسالة باستخدام Gemini AI مع conversation ID الحالي
      const success = await SimpleGeminiService.processMessage(
        userMessage,
        currentConversationId,
        'test-user',
        'test-page'
      );

      if (success) {
        console.log('✅ [SIMPLE TEST CHAT] Message processed successfully');
        // إعادة تحميل الرسائل لعرض رد Gemini
        await loadMessages();
      } else {
        console.error('❌ [SIMPLE TEST CHAT] Failed to process message');
        throw new Error('Failed to process message');
      }
    } catch (error) {
      console.error('❌ [SIMPLE TEST CHAT] Error with AI response:', error);

      // رد افتراضي في حالة الخطأ
      const errorResponse = "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";

      await supabase
        .from('test_messages')
        .insert({
          conversation_id: currentConversationId,
          content: errorResponse,
          sender_type: 'bot'
        });

      await loadMessages();
    }
  };

  // التمرير لآخر رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full bg-gray-50 overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">محاكي المحادثات المبسط</h1>
              <p className="text-gray-600">اختبار نظام Gemini AI بنفس إعدادات المحادثات الحقيقية</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadMessages} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>
              <Button onClick={clearChat} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 ml-2" />
                مسح المحادثة
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-4xl mx-auto h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {TEST_CUSTOMER_NAME}
              <span className="text-sm text-gray-500 font-normal">
                (ID: {currentConversationId.substring(0, 8)}...)
              </span>
            </CardTitle>
          </CardHeader>

          {/* الرسائل */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد رسائل</h3>
                <p>ابدأ محادثة جديدة مع Gemini AI</p>
              </div>
            ) : (
              messages.map((message) => (
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
                        {message.sender_type === 'user' ? 'أنت' : 'Gemini AI'}
                      </span>
                    </div>
                    <div className="text-sm">
                      {/* فحص إذا كانت الرسالة تحتوي على صورة */}
                      {message.content.startsWith('📸 صورة') && message.content.includes('http') ? (
                        <div className="space-y-2">
                          <div>{message.content.split(':')[0]}:</div>
                          <img
                            src={message.content.split(': ')[1]}
                            alt="صورة المنتج"
                            className="max-w-full h-auto rounded-lg border"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const errorDiv = target.nextElementSibling as HTMLElement;
                              if (errorDiv) errorDiv.style.display = 'block';
                            }}
                          />
                          <div style={{display: 'none'}} className="text-red-500 text-xs">
                            فشل في تحميل الصورة
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(message.created_at).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* إرسال رسالة */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                placeholder="اكتب رسالتك هنا..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SimpleTestChat;
