import { supabase } from "@/integrations/supabase/client";

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookMessage {
  id: string;
  message: string;
  from: {
    id: string;
    name: string;
  };
  created_time: string;
}

export class FacebookApiService {
  private accessToken: string;
  private static userNameCache = new Map<string, { name: string; timestamp: number }>();
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 دقيقة

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // الحصول على صفحات الفيسبوك المتاحة
  async getPages(): Promise<FacebookPage[]> {
    try {
      // أولاً، نحاول التحقق من نوع الـ token
      const tokenInfo = await this.getTokenInfo();

      if (tokenInfo.type === 'page') {
        // إذا كان Page Token، نحصل على معلومات الصفحة مباشرة
        const pageInfo = await this.getPageInfoFromPageToken();
        return pageInfo ? [pageInfo] : [];
      } else {
        // إذا كان User Token، نحصل على جميع الصفحات
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`
        );

        if (!response.ok) {
          throw new Error(`Facebook API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        return data.data || [];
      }
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      throw error;
    }
  }

  // الحصول على معلومات الـ token
  async getTokenInfo(): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // التحقق من نوع الـ token
      // إذا كان هناك category، فهو Page Token
      if (data.category || data.id) {
        // نتحقق إذا كان يمكن الوصول لـ accounts (User Token) أم لا (Page Token)
        try {
          const accountsResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`
          );
          const accountsData = await accountsResponse.json();

          if (accountsData.error && accountsData.error.code === 100) {
            // خطأ 100 يعني أنه Page Token
            return { type: 'page', data };
          } else {
            // إذا لم يكن هناك خطأ، فهو User Token
            return { type: 'user', data };
          }
        } catch (error) {
          // في حالة خطأ في الشبكة، نفترض أنه Page Token
          return { type: 'page', data };
        }
      } else {
        return { type: 'user', data };
      }
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  // الحصول على معلومات الصفحة من Page Token
  async getPageInfoFromPageToken(): Promise<FacebookPage | null> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,category&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        id: data.id,
        name: data.name,
        access_token: this.accessToken
      };
    } catch (error) {
      console.error('Error getting page info from page token:', error);
      return null;
    }
  }

  // الحصول على معلومات صفحة محددة
  async getPageInfo(pageId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,id,access_token&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data;
    } catch (error) {
      console.error('Error fetching page info:', error);
      throw error;
    }
  }

  // إرسال رسالة إلى مستخدم
  async sendMessage(pageAccessToken: string, recipientId: string, message: string): Promise<any> {
    try {
      console.log('🔍 Sending message with details:', {
        recipientId,
        messageLength: message.length,
        tokenPrefix: pageAccessToken ? pageAccessToken.substring(0, 10) + '...' : 'null'
      });

      // استخدام Facebook Graph API مباشرة
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Facebook API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          recipientId,
          tokenPrefix: pageAccessToken ? pageAccessToken.substring(0, 10) + '...' : 'null'
        });
        throw new Error(`Facebook API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('❌ Facebook API Response Error:', data.error);
        throw new Error(data.error.message);
      }

      console.log('✅ Message sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // 🎯 خدمة إرسال الصور المبسطة - طريقة واحدة فقط
  async sendImage(pageAccessToken: string, recipientId: string, imageUrl: string, productInfo?: {
    name?: string;
    color?: string;
    price?: number;
    description?: string;
  }): Promise<any> {
    try {
      console.log('🖼️ [SIMPLE IMAGE SERVICE] Sending image:', {
        imageUrl: imageUrl.substring(0, 50) + '...',
        recipientId,
        hasProductInfo: !!productInfo
      });

      // إرسال الصورة مباشرة عبر URL
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  url: imageUrl,
                  is_reusable: true
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      console.log('✅ [SIMPLE IMAGE SERVICE] Image sent successfully');

      // إرسال معلومات المنتج كرسالة نصية إضافية إذا توفرت
      if (productInfo && (productInfo.name || productInfo.color || productInfo.price)) {
        await this.sendProductInfo(pageAccessToken, recipientId, productInfo);
      }

      return data;

    } catch (error) {
      console.error('❌ [SIMPLE IMAGE SERVICE] Failed to send image:', error);
      throw error;
    }
  }

  // إرسال معلومات المنتج كرسالة نصية
  private async sendProductInfo(pageAccessToken: string, recipientId: string, productInfo: {
    name?: string;
    color?: string;
    price?: number;
    description?: string;
  }): Promise<void> {
    try {
      let infoMessage = '';

      if (productInfo.name) infoMessage += `📦 المنتج: ${productInfo.name}\n`;
      if (productInfo.color) infoMessage += `🎨 اللون: ${productInfo.color}\n`;
      if (productInfo.price) infoMessage += `💰 السعر: ${productInfo.price} جنيه\n`;
      if (productInfo.description) infoMessage += `📝 الوصف: ${productInfo.description}\n`;

      if (infoMessage) {
        infoMessage += '\n💬 عايزة تعرفي تفاصيل أكتر؟ قوليلي! 😊';
        await this.sendMessage(pageAccessToken, recipientId, infoMessage);
        console.log('✅ Product info sent successfully');
      }
    } catch (error) {
      console.log('⚠️ Failed to send product info:', error);
    }
  }

  // الحصول على معلومات المستخدم من Conversations API
  async getUserInfo(userId: string, pageAccessToken: string): Promise<{ id: string; name: string } | null> {
    try {
      // فحص الـ cache أولاً
      const cached = FacebookApiService.userNameCache.get(userId);
      if (cached && (Date.now() - cached.timestamp) < FacebookApiService.CACHE_DURATION) {
        console.log(`📋 استخدام الاسم المحفوظ مؤقت<|im_start|>: ${cached.name} للمستخدم ${userId}`);
        return {
          id: userId,
          name: cached.name
        };
      }
      // أولاً جرب الطريقة المباشرة
      const directResponse = await fetch(
        `https://graph.facebook.com/v18.0/${userId}?fields=id,name&access_token=${pageAccessToken}`
      );

      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData.name && !directData.error) {
          // حفظ في الـ cache
          FacebookApiService.userNameCache.set(userId, {
            name: directData.name,
            timestamp: Date.now()
          });

          return {
            id: directData.id,
            name: directData.name
          };
        }
      }

      // إذا فشلت الطريقة المباشرة، استخدم Conversations API
      console.log(`🔄 جاري البحث عن المستخدم ${userId} في المحادثات...`);

      // البحث في عدة صفحات للعثور على المستخدم
      let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${pageAccessToken}&limit=100`;
      let pageCount = 0;
      const maxPages = 5; // حد أقصى 5 صفحات للبحث السريع

      while (nextUrl && pageCount < maxPages) {
        pageCount++;

        const conversationsResponse = await fetch(nextUrl);

        if (!conversationsResponse.ok) {
          console.error(`Facebook Conversations API Error: ${conversationsResponse.status}`);
          break;
        }

        const conversationsData = await conversationsResponse.json();

        if (conversationsData.error) {
          console.error('Facebook Conversations API Error:', conversationsData.error.message);
          break;
        }

        // البحث عن المستخدم في المحادثات
        if (conversationsData.data) {
          for (const conversation of conversationsData.data) {
            if (conversation.participants && conversation.participants.data) {
              for (const participant of conversation.participants.data) {
                if (participant.id === userId && participant.name) {
                  console.log(`✅ تم العثور على الاسم: ${participant.name} للمستخدم ${userId} في الصفحة ${pageCount}`);

                  // حفظ في الـ cache
                  FacebookApiService.userNameCache.set(userId, {
                    name: participant.name,
                    timestamp: Date.now()
                  });

                  return {
                    id: participant.id,
                    name: participant.name
                  };
                }
              }
            }
          }
        }

        // الانتقال للصفحة التالية
        nextUrl = conversationsData.paging?.next || null;

        // انتظار قصير لتجنب rate limiting
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // محاولة أخيرة: البحث في المحادثات الحديثة جداً (آخر 24 ساعة)
      console.log(`🔄 محاولة أخيرة: البحث في المحادثات الحديثة للمستخدم ${userId}...`);

      try {
        const recentResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/conversations?fields=participants,updated_time&access_token=${pageAccessToken}&limit=50`
        );

        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          if (recentData.data) {
            for (const conversation of recentData.data) {
              // فحص المحادثات المحدثة في آخر 24 ساعة
              const updatedTime = new Date(conversation.updated_time);
              if (updatedTime > oneDayAgo && conversation.participants && conversation.participants.data) {
                for (const participant of conversation.participants.data) {
                  if (participant.id === userId && participant.name) {
                    console.log(`✅ تم العثور على الاسم في المحادثات الحديثة: ${participant.name} للمستخدم ${userId}`);

                    // حفظ في الـ cache
                    FacebookApiService.userNameCache.set(userId, {
                      name: participant.name,
                      timestamp: Date.now()
                    });

                    return {
                      id: participant.id,
                      name: participant.name
                    };
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('⚠️ فشل في البحث في المحادثات الحديثة:', error);
      }

      console.log(`⚠️ لم يتم العثور على اسم للمستخدم ${userId} في جميع المحاولات`);
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  // الحصول على رسائل الصفحة
  async getPageMessages(pageId: string, pageAccessToken: string): Promise<FacebookMessage[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/conversations?fields=messages{message,from,created_time}&access_token=${pageAccessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // استخراج الرسائل من المحادثات
      const messages: FacebookMessage[] = [];
      if (data.data) {
        data.data.forEach((conversation: any) => {
          if (conversation.messages && conversation.messages.data) {
            messages.push(...conversation.messages.data);
          }
        });
      }

      return messages;
    } catch (error) {
      console.error('Error fetching page messages:', error);
      throw error;
    }
  }

  // حفظ إعدادات Facebook في قاعدة البيانات
  static async saveFacebookSettings(pageId: string, accessToken: string, pageName?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('facebook_settings')
        .upsert({
          page_id: pageId,
          access_token: accessToken,
          page_name: pageName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_id'
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving Facebook settings:', error);
      throw error;
    }
  }

  // الحصول على إعدادات Facebook من قاعدة البيانات
  static async getFacebookSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('facebook_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching Facebook settings:', error);
      throw error;
    }
  }

  // الحصول على جميع الصفحات المربوطة من قاعدة البيانات
  static async getAllConnectedPages(): Promise<any[]> {
    try {
      const response = await fetch('/api/facebook/settings');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // إضافة معلومات إضافية لكل صفحة
      const pagesWithStatus = (data || []).map(page => ({
        ...page,
        has_access_token: !!page.access_token,
        has_backup_token: !!page.backup_access_token,
        can_reactivate: !page.access_token && !!page.backup_access_token
      }));

      return pagesWithStatus;
    } catch (error) {
      console.error('Error fetching connected pages:', error);
      throw error;
    }
  }

  // الحصول على إعدادات صفحة محددة
  static async getPageSettings(pageId: string): Promise<any> {
    try {
      console.log('🔍 FacebookApi: جلب إعدادات الصفحة للمعرف:', pageId);

      const { data, error } = await supabase
        .from('facebook_settings')
        .select('*')
        .eq('page_id', pageId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ FacebookApi: خطأ في جلب إعدادات الصفحة:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ FacebookApi: لم يتم العثور على إعدادات للصفحة:', pageId);
      } else {
        console.log('✅ FacebookApi: تم العثور على إعدادات الصفحة:', {
          page_id: data.page_id,
          page_name: data.page_name,
          has_access_token: !!data.access_token
        });
      }

      return data;
    } catch (error) {
      console.error('❌ FacebookApi: خطأ في جلب إعدادات الصفحة:', error);
      throw error;
    }
  }

  // الحصول على جميع الصفحات (alias للتوافق)
  static async getAllPages(): Promise<any[]> {
    return this.getAllConnectedPages();
  }

  // قطع الاتصال مع صفحة محددة (إيقاف مؤقت)
  static async disconnectPage(pageId: string): Promise<void> {
    try {
      console.log('🔌 قطع الاتصال مع الصفحة:', pageId);

      const response = await fetch(`/api/facebook/disconnect/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ تم قطع الاتصال بنجاح:', result.message);
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال:', error);
      throw error;
    }
  }

  // حذف صفحة نهائياً
  static async deletePage(pageId: string): Promise<void> {
    try {
      console.log('🗑️ حذف الصفحة نهائياً:', pageId);

      const response = await fetch(`/api/facebook/delete/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ تم حذف الصفحة بنجاح:', result.message);
    } catch (error) {
      console.error('❌ خطأ في حذف الصفحة:', error);
      throw error;
    }
  }

  // إعادة تفعيل صفحة
  static async reactivatePage(pageId: string): Promise<void> {
    try {
      console.log('🔄 إعادة تفعيل الصفحة:', pageId);

      const response = await fetch(`/api/facebook/reactivate/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ تم إعادة التفعيل بنجاح:', result.message);
    } catch (error) {
      console.error('❌ خطأ في إعادة التفعيل:', error);
      throw error;
    }
  }
}

// إنشاء instance من الخدمة
export const createFacebookApiService = (accessToken: string) => {
  return new FacebookApiService(accessToken);
};
