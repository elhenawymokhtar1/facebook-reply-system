
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  facebook_page_id: string;
  customer_name: string;
  customer_facebook_id: string;
  last_message: string | null;
  last_message_at: string;
  is_online: boolean;
  unread_count: number;
  conversation_status?: 'active' | 'pending' | 'resolved' | 'spam' | 'archived';
  page_id: string;
  created_at: string;
  updated_at: string;
  page_name?: string;
  page_picture_url?: string;
}

export const useConversations = () => {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      console.log('🔄 [useConversations] Starting fetch from Supabase...');

      try {
        const { data, error: supabaseError } = await supabase
          .from('conversations')
          .select('*')
          .order('last_message_at', { ascending: false })
          .limit(50);

        if (supabaseError) {
          console.error('❌ [useConversations] Supabase error:', supabaseError);
          throw supabaseError;
        }

        // إضافة معلومات الصفحة يدوياً بناءً على facebook_page_id
        const conversationsWithPageInfo = data?.map(conversation => {
          let page_name = 'صفحة غير معروفة';

          if (conversation.facebook_page_id === '260345600493273') {
            page_name = 'Swan shop';
          } else if (conversation.facebook_page_id === '240244019177739') {
            page_name = 'سولا 127';
          }

          return {
            ...conversation,
            page_name,
            page_picture_url: null
          };
        }) || [];

        console.log(`✅ [useConversations] Fetched ${conversationsWithPageInfo?.length || 0} conversations from Supabase`);
        console.log('📋 [useConversations] First conversation:', conversationsWithPageInfo?.[0]);

        // تشخيص العدادات
        const unreadConversations = conversationsWithPageInfo?.filter(c => c.unread_count > 0) || [];
        const repliedConversations = conversationsWithPageInfo?.filter(c => c.unread_count === 0) || [];

        console.log('📊 [useConversations] Counters analysis:', {
          total: conversationsWithPageInfo?.length || 0,
          unread: unreadConversations.length,
          replied: repliedConversations.length,
          unreadDetails: unreadConversations.map(c => ({
            id: c.id,
            name: c.customer_name,
            unread_count: c.unread_count,
            last_message: c.last_message?.substring(0, 30)
          }))
        });

        return conversationsWithPageInfo as Conversation[];

      } catch (error) {
        console.error('❌ [useConversations] Error fetching conversations:', error);
        throw error;
      }
    },
    staleTime: 30000, // البيانات تبقى fresh لمدة 30 ثانية
    cacheTime: 300000, // البيانات تبقى في الكاش لمدة 5 دقائق
    refetchOnWindowFocus: false, // لا تعيد التحميل عند التركيز على النافذة
    retry: 2, // إعادة المحاولة مرتين فقط
  });

  // إضافة logs للنتائج
  console.log('🎯 [useConversations] Hook state:', {
    conversationsCount: conversations.length,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message
  });

  // استمع للتحديثات المباشرة للمحادثات (مع throttling)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload.eventType);

          // Throttle updates - لا تحديث أكثر من مرة كل 3 ثواني
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            console.log('🔄 Invalidating conversations cache...');
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }, 3000);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
      console.log('📡 Real-time subscription cleaned up');
    };
  }, [queryClient]);

  // إضافة mutation لتحديث حالة المحادثة
  const updateConversationStatus = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      console.log('🔄 تحديث حالة المحادثة:', { conversationId, status });

      const { error } = await supabase
        .from('conversations')
        .update({ conversation_status: status })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ خطأ في تحديث حالة المحادثة:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ تم تحديث حالة المحادثة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('❌ فشل في تحديث حالة المحادثة:', error);
    }
  });

  return {
    conversations,
    isLoading,
    error,
    refetch,
    updateConversationStatus
  };
};
