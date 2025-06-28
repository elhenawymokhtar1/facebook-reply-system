import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";

// إزالة الاستيرادات الخاطئة - استخدام SimpleGeminiService فقط
interface GeminiSettings {
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_enabled: boolean;
}

export const useGeminiSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { company } = useCurrentCompany();

  // جلب إعدادات Gemini مع فلترة حسب الشركة
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['gemini-settings', company?.id],
    queryFn: async () => {
      const url = company?.id
        ? `http://localhost:3002/api/gemini/settings?company_id=${company.id}`
        : 'http://localhost:3002/api/gemini/settings';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Gemini settings');
      }
      return await response.json();
    },
    enabled: !!company, // تأكد من وجود معلومات الشركة
  });

  // حفظ إعدادات Gemini مع ربطها بالشركة
  const saveSettings = useMutation({
    mutationFn: async (newSettings: Partial<GeminiSettings>) => {
      const settingsWithCompany = {
        ...newSettings,
        company_id: company?.id || null
      };

      const response = await fetch('http://localhost:3002/api/gemini/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsWithCompany)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-settings', company?.id] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات Gemini AI بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات Gemini AI",
        variant: "destructive",
      });
      console.error('Error saving Gemini settings:', error);
    },
  });

  // اختبار الاتصال مع Gemini
  const testConnection = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch('http://localhost:3002/api/gemini/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test connection');
      }

      return await response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "نجح الاتصال",
          description: "تم الاتصال مع Gemini AI بنجاح",
        });
      } else {
        toast({
          title: "فشل الاتصال",
          description: result.error || "فشل في الاتصال مع Gemini AI",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في اختبار الاتصال مع Gemini AI",
        variant: "destructive",
      });
      console.error('Error testing Gemini connection:', error);
    },
  });

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    testConnection,
    isSaving: saveSettings.isPending,
    isTesting: testConnection.isPending
  };
};

// Hook لإرسال رسالة إلى Gemini
export const useGeminiChat = () => {
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async ({
      message,
      conversationId,
      senderId
    }: {
      message: string;
      conversationId: string;
      senderId: string;
    }) => {
      // استخدام النظام الجديد البسيط
      const { SimpleGeminiService } = await import('@/services/simpleGeminiService');
      return await SimpleGeminiService.processMessage(message, conversationId, senderId);
    },
    onSuccess: (success) => {
      if (success) {
        toast({
          title: "تم الإرسال",
          description: "تم إرسال رد Gemini AI بنجاح",
        });
      } else {
        toast({
          title: "فشل الإرسال",
          description: "فشل في إرسال رد Gemini AI",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال رد Gemini AI",
        variant: "destructive",
      });
      console.error('Error sending Gemini message:', error);
    },
  });

  return {
    sendMessage,
    isLoading: sendMessage.isPending
  };
};
