
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FacebookApiService } from "@/services/facebookApi";

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
        console.log('⚠️ لا توجد محادثة محددة لجلب الرسائل');
        return [];
      }

      console.log('🔍 جلب الرسائل للمحادثة:', conversationId);

      // أولاً: فحص جميع الرسائل في قاعدة البيانات للتشخيص
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, conversation_id, content, sender_type, created_at')
        .limit(10);

      console.log('🔍 عينة من جميع الرسائل في قاعدة البيانات:', allMessages);

      // ثانياً: فحص الرسائل لهذه المحادثة تحديداً
      const { data: conversationMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);

      console.log(`🔍 الرسائل للمحادثة ${conversationId}:`, conversationMessages);

      // جلب الرسائل مباشرة من Supabase
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ خطأ في جلب الرسائل من Supabase:', error);
        console.error('📋 تفاصيل الخطأ:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log(`✅ تم جلب ${data?.length || 0} رسالة للمحادثة ${conversationId}`);
      console.log('📋 الرسائل المجلبة:', data);

      // إذا لم نجد رسائل، دعنا نتحقق من وجود المحادثة
      if (!data || data.length === 0) {
        console.log('🔍 لا توجد رسائل، التحقق من وجود المحادثة...');
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (convError) {
          console.error('❌ خطأ في جلب المحادثة:', convError);
        } else {
          console.log('📋 بيانات المحادثة:', convData);
        }
      }

      return data as Message[];
    },
    enabled: !!conversationId,
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for messages:`, error);
      return failureCount < 2; // إعادة المحاولة مرتين فقط
    },
    staleTime: 0, // البيانات تبقى fresh لمدة 0 ثواني (دائماً fresh)
    cacheTime: 0, // البيانات لا تبقى في الكاش (دائماً refetch)
  });

  // إرسال رسالة جديدة
  const sendMessage = useMutation({
    mutationFn: async ({ content, senderType, imageFile }: { content: string; senderType: 'admin' | 'bot'; imageFile?: File }) => {
      console.log('🚀 بدء عملية إرسال الرسالة...');
      console.log('📋 التفاصيل:', {
        conversationId,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        senderType,
        hasImage: !!imageFile
      });

      if (!conversationId) {
        console.error('❌ لا توجد محادثة محددة');
        throw new Error('No conversation selected');
      }

      let finalContent = content;
      let imageUrl = null;

      // رفع الصورة إذا كانت موجودة
      if (imageFile) {
        console.log('📷 بدء رفع الصورة...');
        console.log('📋 تفاصيل الصورة:', {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        });

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        console.log('📁 مسار الرفع:', filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('❌ خطأ في رفع الصورة:', uploadError);
          throw uploadError;
        }

        console.log('✅ تم رفع الصورة بنجاح');

        // الحصول على الرابط العام للصورة
        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        console.log('🔗 رابط الصورة:', imageUrl);

        // المحتوى النهائي يبقى كما هو (بدون إضافة رابط الصورة للنص)
        finalContent = content;
      }

      // الحصول على معلومات المحادثة
      console.log('🔍 جلب معلومات المحادثة...');
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('customer_facebook_id, facebook_page_id, customer_name')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('❌ خطأ في جلب معلومات المحادثة:', convError);
        throw new Error('Conversation fetch error: ' + convError.message);
      }

      if (!conversation) {
        console.error('❌ لم يتم العثور على المحادثة');
        throw new Error('Conversation not found');
      }

      console.log('✅ تم جلب معلومات المحادثة:', {
        customer_name: conversation.customer_name,
        customer_facebook_id: conversation.customer_facebook_id,
        facebook_page_id: conversation.facebook_page_id
      });

      // إرسال الرسالة إلى Facebook إذا كانت من الأدمن
      if (senderType === 'admin') {
        console.log('📤 بدء إرسال الرسالة إلى Facebook...');
        try {
          // استخدام facebook_page_id من المحادثة أو الصفحة الافتراضية
          const pageId = conversation.facebook_page_id || '240244019177739';
          console.log('📄 معرف الصفحة المستخدم:', pageId);

          const { FacebookApiService } = await import('@/services/facebookApi');
          console.log('🔍 جلب إعدادات الصفحة...');
          const facebookSettings = await FacebookApiService.getPageSettings(pageId);

          if (!facebookSettings) {
            console.error('❌ لم يتم العثور على إعدادات الصفحة للمعرف:', pageId);

            // عرض جميع الصفحات المتاحة للتشخيص
            const allPages = await FacebookApiService.getAllPages();
            console.log('📋 الصفحات المتاحة:', allPages?.map(p => ({ id: p.page_id, name: p.page_name })));

            throw new Error('Facebook settings not found for page: ' + pageId);
          }

          console.log('✅ تم جلب إعدادات الصفحة:', {
            page_name: facebookSettings.page_name,
            page_id: facebookSettings.page_id,
            has_access_token: !!facebookSettings.access_token
          });

          // إرسال الرسالة عبر Facebook API
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          // إذا كانت هناك صورة، أرسلها كـ attachment
          if (imageUrl) {
            console.log('📷 إرسال الصورة إلى Facebook...');
            const imageResult = await facebookService.sendImage(
              facebookSettings.access_token,
              conversation.customer_facebook_id,
              imageUrl
            );
            console.log('✅ تم إرسال الصورة:', imageResult);

            // إرسال النص إذا كان موجود
            if (content.trim()) {
              console.log('📝 إرسال النص مع الصورة...');
              const textResult = await facebookService.sendMessage(
                facebookSettings.access_token,
                conversation.customer_facebook_id,
                content
              );
              console.log('✅ تم إرسال النص:', textResult);
            }
          } else {
            // إرسال النص فقط
            console.log('📝 إرسال النص إلى Facebook...');
            const textResult = await facebookService.sendMessage(
              facebookSettings.access_token,
              conversation.customer_facebook_id,
              finalContent
            );
            console.log('✅ تم إرسال النص:', textResult);
          }

          console.log('🎉 تم إرسال الرسالة إلى Facebook بنجاح');
        } catch (facebookError) {
          console.error('❌ خطأ في إرسال الرسالة إلى Facebook:', facebookError);

          // تفاصيل إضافية للخطأ
          if (facebookError instanceof Error) {
            console.error('📋 رسالة الخطأ:', facebookError.message);
            console.error('📋 تفاصيل الخطأ:', facebookError.stack);
          }

          throw new Error('Failed to send message to Facebook: ' + (facebookError instanceof Error ? facebookError.message : 'Unknown error'));
        }
      }

      // حفظ الرسالة في قاعدة البيانات مباشرة
      console.log('💾 حفظ الرسالة في قاعدة البيانات...');

      // الحصول على page_id من المحادثة
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('page_id')
        .eq('id', conversationId)
        .single();

      const messageData = {
        conversation_id: conversationId,
        content: finalContent,
        sender_type: senderType,
        is_read: false,
        is_auto_reply: senderType === 'bot',
        image_url: imageUrl,
        page_id: conversationData?.page_id || 'unknown'
      };
      console.log('📋 بيانات الرسالة:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في حفظ الرسالة في قاعدة البيانات:', error);
        console.error('📋 تفاصيل الخطأ:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ تم حفظ الرسالة في قاعدة البيانات:', data.id);

      // تحديث آخر رسالة في المحادثة وإعادة تعيين عداد الرسائل غير المقروءة
      console.log('🔄 تحديث آخر رسالة في المحادثة...');
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: finalContent,
          last_message_at: new Date().toISOString(),
          unread_count: 0  // إعادة تعيين العداد لأننا رددنا على الرسائل
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('❌ خطأ في تحديث المحادثة:', updateError);
      } else {
        console.log('✅ تم تحديث المحادثة بنجاح');
      }

      // تحديث حالة جميع رسائل العميل غير المقروءة إلى مقروءة
      console.log('🔄 تحديث حالة رسائل العميل إلى مقروءة...');
      const { error: messagesUpdateError } = await supabase
        .from('messages')
        .update({ message_status: 'answered' })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .eq('message_status', 'unanswered');

      if (messagesUpdateError) {
        console.error('❌ خطأ في تحديث حالة الرسائل:', messagesUpdateError);
      } else {
        console.log('✅ تم تحديث حالة رسائل العميل بنجاح');
      }

      console.log('🎉 تمت عملية إرسال الرسالة بالكامل بنجاح!');
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation Success: تم إرسال الرسالة بنجاح');
      console.log('📋 بيانات الرسالة المرسلة:', data);

      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      console.log('🔄 تم تحديث الـ queries');
    },
    onError: (error) => {
      console.error('❌ Mutation Error: فشل في إرسال الرسالة');
      console.error('📋 تفاصيل الخطأ:', error);

      if (error instanceof Error) {
        console.error('📋 رسالة الخطأ:', error.message);
        console.error('📋 Stack trace:', error.stack);
      }
    },
    onMutate: (variables) => {
      console.log('🔄 Mutation Start: بدء عملية إرسال الرسالة');
      console.log('📋 المتغيرات:', {
        content: variables.content.substring(0, 50) + (variables.content.length > 50 ? '...' : ''),
        senderType: variables.senderType,
        hasImage: !!variables.imageFile
      });
    }
  });

  // استمع للرسائل الجديدة
  useEffect(() => {
    if (!conversationId) return;

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
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // إضافة mutation لتحديث حالة الرسالة
  const updateMessageStatus = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: string }) => {
      console.log('🔄 تحديث حالة الرسالة:', { messageId, status });

      const { error } = await supabase
        .from('messages')
        .update({ message_status: status })
        .eq('id', messageId);

      if (error) {
        console.error('❌ خطأ في تحديث حالة الرسالة:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ تم تحديث حالة الرسالة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
    onError: (error) => {
      console.error('❌ فشل في تحديث حالة الرسالة:', error);
    }
  });

  // إضافة mutation لتحديث حالة عدة رسائل
  const updateMultipleMessagesStatus = useMutation({
    mutationFn: async ({ messageIds, status }: { messageIds: string[]; status: string }) => {
      console.log('🔄 تحديث حالة عدة رسائل:', { messageIds, status });

      const { error } = await supabase
        .from('messages')
        .update({ message_status: status })
        .in('id', messageIds);

      if (error) {
        console.error('❌ خطأ في تحديث حالة الرسائل:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ تم تحديث حالة الرسائل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
    onError: (error) => {
      console.error('❌ فشل في تحديث حالة الرسائل:', error);
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
