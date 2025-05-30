
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
  created_at: string;
}

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // إرسال رسالة جديدة
  const sendMessage = useMutation({
    mutationFn: async ({ content, senderType, imageFile }: { content: string; senderType: 'admin' | 'bot'; imageFile?: File }) => {
      if (!conversationId) throw new Error('No conversation selected');

      let finalContent = content;
      let imageUrl = null;

      // رفع الصورة إذا كانت موجودة
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // الحصول على الرابط العام للصورة
        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;

        // المحتوى النهائي يبقى كما هو (بدون إضافة رابط الصورة للنص)
        finalContent = content;
      }

      // الحصول على معلومات المحادثة
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('customer_facebook_id, facebook_page_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        throw new Error('Conversation not found');
      }

      // إرسال الرسالة إلى Facebook إذا كانت من الأدمن
      if (senderType === 'admin') {
        try {
          // الحصول على إعدادات Facebook
          const { data: facebookSettings, error: settingsError } = await supabase
            .from('facebook_settings')
            .select('access_token')
            .single();

          if (settingsError || !facebookSettings) {
            throw new Error('Facebook settings not found');
          }

          // إرسال الرسالة عبر Facebook API
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          // إذا كانت هناك صورة، أرسلها كـ attachment
          if (imageUrl) {
            await facebookService.sendImage(
              facebookSettings.access_token,
              conversation.customer_facebook_id,
              imageUrl
            );

            // إرسال النص إذا كان موجود
            if (content.trim()) {
              await facebookService.sendMessage(
                facebookSettings.access_token,
                conversation.customer_facebook_id,
                content
              );
            }
          } else {
            // إرسال النص فقط
            await facebookService.sendMessage(
              facebookSettings.access_token,
              conversation.customer_facebook_id,
              finalContent
            );
          }

          console.log('Message sent to Facebook successfully');
        } catch (facebookError) {
          console.error('Error sending message to Facebook:', facebookError);
          throw new Error('Failed to send message to Facebook');
        }
      }

      // حفظ الرسالة في قاعدة البيانات
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: finalContent,
          sender_type: senderType,
          is_read: false,
          is_auto_reply: senderType === 'bot',
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw error;
      }

      // تحديث آخر رسالة في المحادثة
      await supabase
        .from('conversations')
        .update({
          last_message: finalContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
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

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
};
