import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FacebookApiService, createFacebookApiService, FacebookPage } from '@/services/facebookApi';
import { useToast } from '@/hooks/use-toast';

export const useFacebookApi = () => {
  const [accessToken, setAccessToken] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // تحميل إعدادات Facebook المحفوظة
  const { data: savedSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['facebook-settings'],
    queryFn: FacebookApiService.getFacebookSettings,
  });

  useEffect(() => {
    if (savedSettings) {
      setAccessToken(savedSettings.access_token);
      setIsConnected(true);
    }
  }, [savedSettings]);

  // الحصول على صفحات Facebook
  const { data: pages = [], isLoading: isLoadingPages, error: pagesError } = useQuery({
    queryKey: ['facebook-pages', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const service = createFacebookApiService(accessToken);
      return service.getPages();
    },
    enabled: !!accessToken,
  });

  // ربط صفحة Facebook
  const connectPage = useMutation({
    mutationFn: async ({ pageId, pageAccessToken, pageName }: {
      pageId: string;
      pageAccessToken: string;
      pageName: string;
    }) => {
      await FacebookApiService.saveFacebookSettings(pageId, pageAccessToken, pageName);
      return { pageId, pageAccessToken, pageName };
    },
    onSuccess: (data) => {
      setIsConnected(true);
      queryClient.invalidateQueries({ queryKey: ['facebook-settings'] });
      toast({
        title: "تم ربط الصفحة بنجاح",
        description: `تم ربط صفحة ${data.pageName} بنجاح`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في ربط الصفحة",
        description: error.message || "حدث خطأ أثناء ربط الصفحة",
        variant: "destructive",
      });
    },
  });

  // إرسال رسالة
  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, message }: { recipientId: string; message: string }) => {
      if (!savedSettings) {
        throw new Error('لم يتم ربط صفحة Facebook');
      }

      const service = createFacebookApiService(savedSettings.access_token);
      return service.sendMessage(savedSettings.access_token, recipientId, message);
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال الرسالة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  // اختبار الاتصال
  const testConnection = useMutation({
    mutationFn: async (token: string) => {
      const service = createFacebookApiService(token);

      // أولاً، نتحقق من نوع الـ token
      const tokenInfo = await service.getTokenInfo();
      const pages = await service.getPages();

      return { pages, tokenInfo, token };
    },
    onSuccess: ({ pages, tokenInfo, token }) => {
      // حفظ الـ token الذي تم اختباره بنجاح
      setAccessToken(token);
      setIsConnected(true);

      const tokenType = tokenInfo.type === 'page' ? 'صفحة' : 'مستخدم';

      toast({
        title: "تم الاتصال بنجاح",
        description: `نوع الرمز: ${tokenType} - تم العثور على ${pages.length} صفحة`,
      });

      // إعادة تحميل الصفحات
      queryClient.invalidateQueries({ queryKey: ['facebook-pages'] });
    },
    onError: (error: any) => {
      console.error('Connection test error:', error);

      let errorMessage = "تأكد من صحة الرمز المميز";

      if (error.message.includes('Invalid OAuth access token')) {
        errorMessage = "الرمز المميز غير صحيح أو منتهي الصلاحية";
      } else if (error.message.includes('Facebook API Error: 400')) {
        errorMessage = "خطأ في طلب Facebook API - تحقق من الرمز المميز";
      } else if (error.message.includes('Facebook API Error: 403')) {
        errorMessage = "ليس لديك صلاحية للوصول - تحقق من إعدادات التطبيق";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "خطأ في الاتصال",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // قطع الاتصال
  const disconnect = useMutation({
    mutationFn: async () => {
      // حذف الإعدادات من قاعدة البيانات
      // يمكن إضافة هذه الوظيفة لاحقاً
      setAccessToken('');
      setIsConnected(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-settings'] });
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال مع Facebook بنجاح",
      });
    },
  });

  // إعادة تعيين للربط الجديد
  const resetForNewConnection = () => {
    setAccessToken('');
    setIsConnected(false);
  };

  return {
    // الحالة
    accessToken,
    isConnected,
    isLoadingSettings,
    savedSettings,

    // الصفحات
    pages,
    isLoadingPages,
    pagesError,

    // العمليات
    setAccessToken,
    testConnection,
    connectPage,
    sendMessage,
    disconnect,
    resetForNewConnection,

    // حالة التحميل
    isTestingConnection: testConnection.isPending,
    isConnectingPage: connectPage.isPending,
    isSendingMessage: sendMessage.isPending,
  };
};
