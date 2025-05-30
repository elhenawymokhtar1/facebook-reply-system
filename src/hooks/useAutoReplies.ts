import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AutoReply {
  id: string;
  keywords: string[];
  response_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAutoReplies = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // الحصول على جميع الردود الآلية
  const { data: autoReplies = [], isLoading, error } = useQuery({
    queryKey: ['auto-replies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_replies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching auto replies:', error);
        throw error;
      }

      return data as AutoReply[];
    },
  });

  // إضافة رد آلي جديد
  const addAutoReply = useMutation({
    mutationFn: async ({ keywords, responseText }: { keywords: string[]; responseText: string }) => {
      const { data, error } = await supabase
        .from('auto_replies')
        .insert({
          keywords,
          response_text: responseText,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding auto reply:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-replies'] });
      toast({
        title: "تم إضافة الرد الآلي",
        description: "تم إضافة الرد الآلي بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة الرد الآلي",
        description: error.message || "حدث خطأ أثناء إضافة الرد الآلي",
        variant: "destructive",
      });
    },
  });

  // تحديث رد آلي
  const updateAutoReply = useMutation({
    mutationFn: async ({ id, keywords, responseText, isActive }: { 
      id: string; 
      keywords?: string[]; 
      responseText?: string; 
      isActive?: boolean; 
    }) => {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (keywords !== undefined) updateData.keywords = keywords;
      if (responseText !== undefined) updateData.response_text = responseText;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabase
        .from('auto_replies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating auto reply:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-replies'] });
      toast({
        title: "تم تحديث الرد الآلي",
        description: "تم تحديث الرد الآلي بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الرد الآلي",
        description: error.message || "حدث خطأ أثناء تحديث الرد الآلي",
        variant: "destructive",
      });
    },
  });

  // حذف رد آلي
  const deleteAutoReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auto_replies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting auto reply:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-replies'] });
      toast({
        title: "تم حذف الرد الآلي",
        description: "تم حذف الرد الآلي بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الرد الآلي",
        description: error.message || "حدث خطأ أثناء حذف الرد الآلي",
        variant: "destructive",
      });
    },
  });

  // البحث عن رد مناسب للرسالة
  const findMatchingReply = (message: string): AutoReply | null => {
    const activeReplies = autoReplies.filter(reply => reply.is_active);
    
    for (const reply of activeReplies) {
      for (const keyword of reply.keywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          return reply;
        }
      }
    }
    
    return null;
  };

  return {
    autoReplies,
    isLoading,
    error,
    addAutoReply,
    updateAutoReply,
    deleteAutoReply,
    findMatchingReply,
    isAddingReply: addAutoReply.isPending,
    isUpdatingReply: updateAutoReply.isPending,
    isDeletingReply: deleteAutoReply.isPending,
  };
};
