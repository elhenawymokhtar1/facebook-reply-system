
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
      const { data, error: supabaseError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (supabaseError) {
        throw supabaseError;
      }

      // إضافة معلومات الصفحة
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

      return conversationsWithPageInfo as Conversation[];
    },
    staleTime: 30000, // البيانات تبقى fresh لمدة 30 ثانية
    cacheTime: 300000, // البيانات تبقى في الكاش لمدة 5 دقائق
    refetchOnWindowFocus: false, // لا تعيد التحميل عند التركيز على النافذة
    retry: 2, // إعادة المحاولة مرتين فقط
  });

  // استمع للتحديثات المباشرة للمحادثات
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
        () => {
          // Throttle updates - لا تحديث أكثر من مرة كل 3 ثواني
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // تحديث حالة المحادثة
  const updateConversationStatus = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      const { error } = await supabase
        .from('conversations')
        .update({ conversation_status: status })
        .eq('id', conversationId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
