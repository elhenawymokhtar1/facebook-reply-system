// خدمة تحديث أسماء المستخدمين من Facebook API
import { supabase } from '../integrations/supabase/client';
import { FacebookApiService } from './facebookApi';

export class NameUpdateService {
  private static isRunning = false;
  private static lastUpdate = new Date(0); // آخر تحديث
  private static readonly UPDATE_INTERVAL = 30 * 60 * 1000; // 30 دقيقة

  // تحديث أسماء المستخدمين من Facebook Conversations API
  static async updateUserNamesFromFacebook(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ تحديث الأسماء قيد التشغيل بالفعل');
      return;
    }

    // تحقق من الوقت منذ آخر تحديث
    const timeSinceLastUpdate = Date.now() - this.lastUpdate.getTime();
    if (timeSinceLastUpdate < this.UPDATE_INTERVAL) {
      console.log(`⏰ آخر تحديث كان منذ ${Math.round(timeSinceLastUpdate / 60000)} دقيقة، سيتم التحديث التالي بعد ${Math.round((this.UPDATE_INTERVAL - timeSinceLastUpdate) / 60000)} دقيقة`);
      return;
    }

    this.isRunning = true;
    console.log('🔄 بدء تحديث أسماء المستخدمين من Facebook...');

    try {
      // الحصول على إعدادات الصفحات
      const { data: pages, error: pagesError } = await supabase
        .from('facebook_settings')
        .select('*');

      if (pagesError) {
        console.error('❌ خطأ في جلب إعدادات الصفحات:', pagesError);
        return;
      }

      if (!pages || pages.length === 0) {
        console.log('❌ لا توجد صفحات مربوطة');
        return;
      }

      let totalUpdated = 0;

      for (const page of pages) {
        console.log(`📄 معالجة الصفحة: ${page.page_name}`);
        
        try {
          // الحصول على أسماء المستخدمين من Facebook
          const facebookUserNames = await this.getFacebookUserNames(page.access_token, page.page_id);
          
          if (facebookUserNames.size === 0) {
            console.log(`⚠️ لم يتم العثور على أسماء مستخدمين للصفحة ${page.page_name}`);
            continue;
          }
          
          // جلب جميع المحادثات لتحديث الأسماء
          const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id, customer_facebook_id, customer_name')
            .eq('facebook_page_id', page.page_id)
            .limit(100); // تحديد العدد لتجنب الحمل الزائد

          if (convError) {
            console.error(`❌ خطأ في جلب المحادثات للصفحة ${page.page_id}:`, convError);
            continue;
          }

          if (!conversations || conversations.length === 0) {
            console.log(`✅ لا توجد محادثات تحتاج تحديث للصفحة ${page.page_name}`);
            continue;
          }

          let pageUpdated = 0;

          for (const conversation of conversations) {
            const { id, customer_facebook_id, customer_name } = conversation;
            
            // البحث عن الاسم الحقيقي
            const realName = facebookUserNames.get(customer_facebook_id);
            
            if (realName && realName !== customer_name) {
              try {
                // تحديث الاسم في قاعدة البيانات
                const { error: updateError } = await supabase
                  .from('conversations')
                  .update({ 
                    customer_name: realName,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', id);

                if (updateError) {
                  console.error(`❌ خطأ في تحديث المحادثة ${id}:`, updateError);
                } else {
                  console.log(`✅ تم تحديث: ${customer_name} → ${realName}`);
                  pageUpdated++;
                }
              } catch (error) {
                console.error(`❌ خطأ في تحديث المستخدم ${customer_facebook_id}:`, error);
              }
            }
          }

          totalUpdated += pageUpdated;
          console.log(`📊 الصفحة ${page.page_name}: تم تحديث ${pageUpdated} محادثة`);
          
        } catch (error) {
          console.error(`❌ خطأ في معالجة الصفحة ${page.page_name}:`, error);
        }
      }

      console.log(`🏁 انتهى تحديث الأسماء - تم تحديث ${totalUpdated} محادثة إجمالي`);
      this.lastUpdate = new Date();

    } catch (error) {
      console.error('❌ خطأ عام في تحديث الأسماء:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // الحصول على أسماء المستخدمين من Facebook Conversations API
  private static async getFacebookUserNames(accessToken: string, pageId: string): Promise<Map<string, string>> {
    try {
      const userNames = new Map<string, string>();
      let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${accessToken}&limit=100`;
      let pageCount = 0;
      
      while (nextUrl && pageCount < 5) { // حد أقصى 5 صفحات لتجنب التعليق
        pageCount++;
        
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          console.error(`❌ خطأ في Facebook API: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error('❌ خطأ في Facebook API:', data.error.message);
          break;
        }
        
        // استخراج أسماء المستخدمين
        if (data.data) {
          data.data.forEach((conversation: any) => {
            if (conversation.participants && conversation.participants.data) {
              conversation.participants.data.forEach((participant: any) => {
                // تجاهل الصفحة نفسها
                if (participant.id !== pageId && participant.name) {
                  userNames.set(participant.id, participant.name);
                }
              });
            }
          });
        }
        
        // الانتقال للصفحة التالية
        nextUrl = data.paging?.next || null;
        
        // انتظار قصير لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`✅ تم جلب ${userNames.size} اسم مستخدم من Facebook للصفحة ${pageId}`);
      return userNames;
      
    } catch (error) {
      console.error('❌ خطأ في جلب أسماء المستخدمين:', error);
      return new Map();
    }
  }

  // بدء الخدمة التلقائية
  static startAutoUpdate(): void {
    console.log('🚀 بدء خدمة تحديث الأسماء التلقائية');
    
    // تشغيل فوري
    this.updateUserNamesFromFacebook();
    
    // تشغيل دوري كل 30 دقيقة
    setInterval(() => {
      this.updateUserNamesFromFacebook();
    }, this.UPDATE_INTERVAL);
  }

  // إيقاف الخدمة
  static stopAutoUpdate(): void {
    this.isRunning = false;
    console.log('⏹️ تم إيقاف خدمة تحديث الأسماء التلقائية');
  }
}
