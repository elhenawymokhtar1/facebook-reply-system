import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { GeminiAiService, GeminiSettings } from "@/services/geminiAi";
import { useToast } from "@/hooks/use-toast";

export const useGeminiSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // جلب إعدادات Gemini
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['gemini-settings'],
    queryFn: async () => {
      return await GeminiAiService.getGeminiSettings();
    },
  });

  // حفظ إعدادات Gemini
  const saveSettings = useMutation({
    mutationFn: async (newSettings: Partial<GeminiSettings>) => {
      await GeminiAiService.saveGeminiSettings(newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-settings'] });
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
      const testSettings: GeminiSettings = {
        api_key: apiKey,
        model: 'gemini-1.5-flash',
        prompt_template: 'اختبار الاتصال',
        is_enabled: true
      };

      const geminiService = new GeminiAiService(testSettings);
      return await geminiService.generateResponse('مرحبا');
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
      return await GeminiAiService.processIncomingMessage(message, conversationId, senderId);
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
