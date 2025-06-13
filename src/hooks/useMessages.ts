
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FacebookApiService } from "@/services/facebookApi";
import { frontendLogger } from "@/utils/frontendLogger";

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'customer' | 'admin' | 'bot';
  facebook_message_id: string | null;
  is_read: boolean;
  is_auto_reply: boolean;
  is_ai_generated?: boolean;
  image_url?: string | null;
  message_status?: 'pending' | 'answered' | 'unanswered' | 'spam' | 'archived';
  page_id: string;
  created_at: string;
}

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        return [];
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data as Message[];
    },
    enabled: !!conversationId,
    retry: 2,
    staleTime: 5000, // البيانات تبقى fresh لمدة 5 ثواني
    gcTime: 30000,   // الاحتفاظ بالـ cache لمدة 30 ثانية
    refetchOnWindowFocus: false, // لا تعيد التحميل عند التركيز على النافذة
    refetchOnMount: false, // لا تعيد التحميل عند mount إذا كانت البيانات fresh
  });

  // إرسال رسالة جديدة
  const sendMessage = useMutation({
    mutationFn: async ({ content, senderType, imageFile }: { content: string; senderType: 'admin' | 'bot'; imageFile?: File }) => {
      const requestId = Math.random().toString(36).substr(2, 9);

      frontendLogger.info(`Starting message send process`, {
        requestId,
        conversationId,
        contentLength: content?.length || 0,
        senderType,
        hasImageFile: !!imageFile
      }, 'MESSAGE_SEND');

      if (!conversationId) {
        frontendLogger.error(`No conversation selected`, { requestId }, 'MESSAGE_SEND');
        throw new Error('No conversation selected');
      }

      let finalContent = content;
      let imageUrl = null;

      // تم حذف نظام رفع الصور - النظام مبسط الآن

      // الحصول على معلومات المحادثة
      console.log(`🔍 [${requestId}] جلب معلومات المحادثة...`);
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('customer_facebook_id, facebook_page_id, customer_name')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error(`❌ [${requestId}] خطأ في جلب المحادثة:`, convError);
        throw new Error('Conversation fetch error: ' + convError.message);
      }

      if (!conversation) {
        console.error(`❌ [${requestId}] المحادثة غير موجودة`);
        throw new Error('Conversation not found');
      }

      console.log(`✅ [${requestId}] تم جلب معلومات المحادثة:`, {
        customer_id: conversation.customer_facebook_id,
        page_id: conversation.facebook_page_id,
        customer_name: conversation.customer_name
      });

      // إرسال الرسالة إلى Facebook إذا كانت من الأدمن
      if (senderType === 'admin') {
        console.log(`📱 [${requestId}] بدء إرسال الرسالة إلى Facebook عبر خادم API...`);
        try {
          const pageId = conversation.facebook_page_id || '240244019177739';
          console.log(`🔍 [${requestId}] معرف الصفحة: ${pageId}`);

          // جلب إعدادات الفيسبوك من خلال API
          const pageSettingsResponse = await fetch(`/api/facebook/page-settings/${pageId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!pageSettingsResponse.ok) {
            console.error(`❌ [${requestId}] خطأ في جلب إعدادات الصفحة: ${pageSettingsResponse.status}`);
            throw new Error(`Failed to get page settings: ${pageSettingsResponse.status}`);
          }
          
          const facebookSettings = await pageSettingsResponse.json();

          if (!facebookSettings || !facebookSettings.access_token) {
            console.error(`❌ [${requestId}] إعدادات Facebook غير موجودة للصفحة: ${pageId}`);
            throw new Error('Facebook settings not found for page: ' + pageId);
          }

          console.log(`✅ [${requestId}] تم جلب إعدادات Facebook للصفحة`);

          // إرسال الصورة والنص عبر API Server
          if (imageUrl) {
            console.log(`📸 [${requestId}] إرسال صورة إلى Facebook عبر API Server...`);
            
            const sendImageResponse = await fetch('/api/facebook/send-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: facebookSettings.access_token,
                recipient_id: conversation.customer_facebook_id,
                image_url: imageUrl
              })
            });
            
            if (!sendImageResponse.ok) {
              const errorData = await sendImageResponse.text();
              console.error(`❌ [${requestId}] خطأ في إرسال الصورة:`, errorData);
              throw new Error(`Failed to send image: ${errorData}`);
            }
            
            console.log(`✅ [${requestId}] تم إرسال الصورة بنجاح`);

            if (content.trim()) {
              console.log(`📝 [${requestId}] إرسال نص مع الصورة...`);
              
              const sendTextResponse = await fetch('/api/facebook/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  access_token: facebookSettings.access_token,
                  recipient_id: conversation.customer_facebook_id,
                  message: content
                })
              });
              
              if (!sendTextResponse.ok) {
                const errorData = await sendTextResponse.text();
                console.error(`❌ [${requestId}] خطأ في إرسال النص:`, errorData);
                throw new Error(`Failed to send text message: ${errorData}`);
              }
              
              console.log(`✅ [${requestId}] تم إرسال النص بنجاح`);
            }
          } else {
            console.log(`📝 [${requestId}] إرسال رسالة نصية إلى Facebook عبر API Server...`);
            
            const sendTextResponse = await fetch('/api/facebook/send-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: facebookSettings.access_token,
                recipient_id: conversation.customer_facebook_id,
                message: finalContent
              })
            });
            
            if (!sendTextResponse.ok) {
              const errorData = await sendTextResponse.text();
              console.error(`❌ [${requestId}] خطأ في إرسال الرسالة النصية:`, errorData);
              throw new Error(`Failed to send text message: ${errorData}`);
            }
            
            console.log(`✅ [${requestId}] تم إرسال الرسالة النصية بنجاح`);
          }

          console.log(`🎉 [${requestId}] تم إرسال الرسالة إلى Facebook بنجاح!`);
        } catch (facebookError) {
          console.error(`❌ [${requestId}] خطأ في إرسال الرسالة إلى Facebook:`, facebookError);
          throw new Error('Failed to send message to Facebook: ' + (facebookError instanceof Error ? facebookError.message : 'Unknown error'));
        }
      }

      // حفظ الرسالة عبر الـ API Server
      frontendLogger.apiCall('POST', `/api/conversations/${conversationId}/messages`, {
        requestId,
        contentLength: finalContent?.length || 0,
        hasImage: !!imageUrl
      });

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: finalContent,
          sender_type: senderType,
          image_url: imageUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        frontendLogger.apiError('POST', `/api/conversations/${conversationId}/messages`, {
          requestId,
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.details || errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      frontendLogger.info(`Message sent successfully via API Server`, {
        requestId,
        messageId: data.id,
        duration: data.duration
      }, 'MESSAGE_SEND');

      return data;
    },
    onSuccess: () => {
      // تأخير التحديث لتجنب التداخل مع real-time subscription
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, 1000); // انتظار ثانية واحدة
    }
  });

  // استمع للرسائل الجديدة والتحديثات مع تحسين لتجنب التكرار
  useEffect(() => {
    if (!conversationId) return;

    // تسجيل الاستماع لبدء عملية الاشتراك
    console.log('🔄 Setting up message subscription for conversation:', conversationId);

    let debounceTimeout: NodeJS.Timeout;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('📥 New message received via real-time:', payload);

          // تجنب التحديث المضاعف باستخدام debounce
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          }, 500); // انتظار 500ms قبل التحديث
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔄 Message updated via real-time:', payload);

          // تجنب التحديث المضاعف باستخدام debounce
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          }, 500); // انتظار 500ms قبل التحديث
        }
      )
      .subscribe((status) => {
        console.log('📢 Subscription status:', status);
      });

    return () => {
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [conversationId]); // إزالة queryClient من dependencies

  // تحديث حالة الرسالة مع تجنب التحديث المضاعف
  const updateMessageStatus = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ message_status: status })
        .eq('id', messageId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // تأخير التحديث لتجنب التداخل مع real-time
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }, 800);
    }
  });

  // تحديث حالة عدة رسائل مع تجنب التحديث المضاعف
  const updateMultipleMessagesStatus = useMutation({
    mutationFn: async ({ messageIds, status }: { messageIds: string[]; status: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ message_status: status })
        .in('id', messageIds);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // تأخير التحديث لتجنب التداخل مع real-time
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }, 800);
    }
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    updateMessageStatus,
    updateMultipleMessagesStatus
  };
};
