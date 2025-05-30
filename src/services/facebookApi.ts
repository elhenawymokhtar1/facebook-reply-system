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
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message },
          }),
        }
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
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // إرسال صورة إلى مستخدم
  async sendImage(pageAccessToken: string, recipientId: string, imageUrl: string): Promise<any> {
    try {
      console.log('🔄 Attempting to send image as URL attachment:', imageUrl);

      // محاولة إرسال الصورة كـ URL attachment أولاً
      try {
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
                    is_reusable: false
                  }
                }
              }
            }),
          }
        );

        const responseText = await response.text();
        console.log('📤 Facebook API response:', response.status, responseText);

        if (response.ok) {
          const data = JSON.parse(responseText);
          if (!data.error) {
            console.log('✅ Image sent successfully as URL attachment');
            return data;
          }
        }

        // إذا فشل إرسال الصورة كـ URL، جرب تحميل الصورة وإرسالها كـ file
        console.log('⚠️ URL attachment failed, trying file upload...');
        throw new Error('URL attachment failed');

      } catch (urlError) {
        console.log('🔄 Attempting to download and upload image as file...');

        // تحميل الصورة
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

        // إنشاء FormData لرفع الصورة
        const formData = new FormData();
        formData.append('recipient', JSON.stringify({ id: recipientId }));
        formData.append('message', JSON.stringify({
          attachment: {
            type: 'image',
            payload: {
              is_reusable: false
            }
          }
        }));
        formData.append('filedata', imageBlob, 'image.jpg');

        // إرسال الصورة كـ file upload
        const uploadResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const uploadResponseText = await uploadResponse.text();
        console.log('📤 Facebook file upload response:', uploadResponse.status, uploadResponseText);

        if (!uploadResponse.ok) {
          throw new Error(`Facebook file upload Error: ${uploadResponse.status} - ${uploadResponseText}`);
        }

        const uploadData = JSON.parse(uploadResponseText);

        if (uploadData.error) {
          throw new Error(uploadData.error.message);
        }

        console.log('✅ Image sent successfully as file upload');
        return uploadData;
      }
    } catch (error) {
      console.error('❌ Error sending image:', error);
      throw error;
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
}

// إنشاء instance من الخدمة
export const createFacebookApiService = (accessToken: string) => {
  return new FacebookApiService(accessToken);
};
