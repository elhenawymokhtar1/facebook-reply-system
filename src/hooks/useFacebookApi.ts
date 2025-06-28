import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FacebookApiService, createFacebookApiService, FacebookPage } from '@/services/facebookApi';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { filterPagesByCompany, getCompanyPages } from '@/utils/companyPageMapping';

export const useFacebookApi = () => {
  const [accessToken, setAccessToken] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { company, isNewCompany } = useCurrentCompany();

  // تحميل إعدادات Facebook المحفوظة
  const { data: savedSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['facebook-settings'],
    queryFn: FacebookApiService.getFacebookSettings,
  });

  // تحميل جميع الصفحات المربوطة للشركة الحالية
  const { data: allConnectedPages = [], isLoading: isLoadingConnectedPages } = useQuery({
    queryKey: ['connected-pages', company?.id],
    queryFn: async () => {
      try {
        // جلب الصفحات مع فلترة company_id
        return await FacebookApiService.getAllConnectedPages(company?.id);
      } catch (error) {
        console.error('خطأ في جلب الصفحات:', error);
        return [];
      }
    },
    enabled: !!company?.id, // تشغيل الاستعلام فقط عند وجود company_id
  });

  // الصفحات المربوطة (مفلترة بالفعل من الخادم)
  const connectedPages = React.useMemo(() => {
    console.log('📊 الصفحات المربوطة للشركة:', allConnectedPages?.length || 0);
    console.log('🏢 الشركة الحالية:', company?.id, company?.name);

    // إرجاع الصفحات كما هي (مفلترة بالفعل من الخادم)
    return allConnectedPages || [];
  }, [allConnectedPages, company?.id, company?.name]);

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
      console.log('🔍 جلب صفحات Facebook...');
      console.log('🔑 Access Token:', accessToken ? 'موجود' : 'غير موجود');

      if (!accessToken) {
        console.log('❌ لا يوجد Access Token - لا يمكن جلب الصفحات');
        return [];
      }

      const service = createFacebookApiService(accessToken);
      const pages = await service.getPages();
      console.log('✅ تم جلب الصفحات:', pages?.length || 0);

      return pages;
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
      console.log('🔗 بدء ربط الصفحة:', { pageId, pageName, companyId: company?.id });

      // حفظ الصفحة مع ربطها بالشركة الحالية
      await FacebookApiService.saveFacebookSettings(pageId, pageAccessToken, pageName, company?.id);

      console.log('✅ تم ربط الصفحة بنجاح');
      return { pageId, pageAccessToken, pageName };
    },
    onSuccess: (data) => {
      setIsConnected(true);
      queryClient.invalidateQueries({ queryKey: ['facebook-settings'] });
      queryClient.invalidateQueries({ queryKey: ['connected-pages'] });
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

  // قطع الاتصال مع صفحة محددة
  const disconnectPage = useMutation({
    mutationFn: async (pageId: string) => {
      await FacebookApiService.disconnectPage(pageId);
      return pageId;
    },
    onSuccess: (pageId) => {
      queryClient.invalidateQueries({ queryKey: ['connected-pages'] });
      queryClient.invalidateQueries({ queryKey: ['facebook-settings'] });
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال مع الصفحة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في قطع الاتصال",
        description: error.message || "حدث خطأ أثناء قطع الاتصال",
        variant: "destructive",
      });
    },
  });

  // حذف صفحة نهائياً
  const deletePage = useMutation({
    mutationFn: async (pageId: string) => {
      await FacebookApiService.deletePage(pageId);
      return pageId;
    },
    onSuccess: (pageId) => {
      queryClient.invalidateQueries({ queryKey: ['connected-pages'] });
      queryClient.invalidateQueries({ queryKey: ['facebook-settings'] });
      toast({
        title: "تم حذف الصفحة",
        description: "تم حذف الصفحة نهائياً من النظام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الصفحة",
        description: error.message || "حدث خطأ أثناء حذف الصفحة",
        variant: "destructive",
      });
    },
  });

  // إعادة تفعيل صفحة
  const reactivatePage = useMutation({
    mutationFn: async (pageId: string) => {
      await FacebookApiService.reactivatePage(pageId);
      return pageId;
    },
    onSuccess: (pageId) => {
      queryClient.invalidateQueries({ queryKey: ['connected-pages'] });
      queryClient.invalidateQueries({ queryKey: ['facebook-settings'] });
      toast({
        title: "تم إعادة التفعيل",
        description: "تم إعادة تفعيل الصفحة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إعادة التفعيل",
        description: error.message || "حدث خطأ أثناء إعادة التفعيل",
        variant: "destructive",
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
    connectedPages,
    isLoadingConnectedPages,

    // العمليات
    setAccessToken,
    testConnection,
    connectPage,
    sendMessage,
    disconnect,
    disconnectPage,
    deletePage,
    reactivatePage,
    resetForNewConnection,

    // حالة التحميل
    isTestingConnection: testConnection.isPending,
    isConnectingPage: connectPage.isPending,
    isSendingMessage: sendMessage.isPending,
    isDisconnectingPage: disconnectPage.isPending,
    isDeletingPage: deletePage.isPending,
    isReactivatingPage: reactivatePage.isPending,
  };
};
