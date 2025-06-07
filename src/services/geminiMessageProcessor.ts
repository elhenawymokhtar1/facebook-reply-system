import { createClient } from '@supabase/supabase-js';
import { GeminiAiServiceSimplified } from './geminiAiSimplified';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * خدمة معالجة الرسائل المحسنة لـ Gemini AI
 * تركز على المعالجة الأساسية مع إدارة أفضل للأخطاء
 */
export class GeminiMessageProcessor {

  /**
   * معالجة رسالة واردة وإنتاج رد ذكي
   */
  static async processIncomingMessage(
    userMessage: string,
    conversationId: string,
    senderId: string
  ): Promise<boolean> {
    try {
      console.log(`🤖 [PROCESSOR] Processing message: "${userMessage}" for sender: ${senderId}`);

      // التحقق من التكرار
      const isDuplicate = await this.checkForDuplicateMessage(conversationId, userMessage);
      if (isDuplicate) {
        console.log('⚠️ Duplicate message detected, skipping processing');
        return false;
      }

      // الحصول على إعدادات Gemini
      console.log('🔧 [PROCESSOR] Getting Gemini settings...');
      const settings = await GeminiAiServiceSimplified.getGeminiSettings();
      if (!settings || !settings.is_enabled || !settings.api_key) {
        console.log('❌ [PROCESSOR] Gemini AI is not enabled or configured');
        return false;
      }
      console.log('✅ [PROCESSOR] Gemini settings loaded successfully');

      // إنشاء خدمة Gemini
      const geminiService = new GeminiAiServiceSimplified(settings);

      // الحصول على سياق المحادثة
      const conversationHistory = await this.getConversationHistory(conversationId);

      // إنتاج الرد
      console.log('🚀 [PROCESSOR] Generating Gemini response...');
      const geminiResponse = await geminiService.generateResponse(userMessage, conversationHistory);
      console.log('📥 [PROCESSOR] Gemini response received:', geminiResponse.success);

      if (!geminiResponse.success || !geminiResponse.response) {
        console.error('❌ [PROCESSOR] Failed to generate Gemini response:', geminiResponse.error);
        return false;
      }

      // تنظيف الرد
      const cleanResponse = this.cleanResponse(geminiResponse.response);

      // إرسال الرد
      const sent = await this.sendResponseToCustomer(conversationId, senderId, cleanResponse);

      if (sent) {
        console.log('✅ Gemini response sent successfully');
        return true;
      } else {
        console.log('❌ Failed to send Gemini response');
        return false;
      }

    } catch (error) {
      console.error('❌ Error processing Gemini message:', error);
      return false;
    }
  }

  /**
   * التحقق من تكرار الرسائل
   */
  private static async checkForDuplicateMessage(conversationId: string, userMessage: string): Promise<boolean> {
    try {
      // إذا كان conversation ID مؤقت، تجاهل فحص التكرار
      if (conversationId.startsWith('temp_')) {
        console.log('⚠️ Temporary conversation ID, skipping duplicate check');
        return false;
      }

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .eq('content', userMessage)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentMessages && recentMessages.length > 0) {
        // فحص إذا كانت هناك رسالة bot حديثة (خلال آخر 10 ثوانٍ)
        const recentBotMessage = recentMessages.find(msg => {
          const messageTime = new Date(msg.created_at).getTime();
          const now = new Date().getTime();
          const timeDiff = now - messageTime;
          return msg.sender_type === 'bot' && timeDiff < 10000;
        });

        return !!recentBotMessage;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking for duplicate messages:', error);
      return false;
    }
  }

  /**
   * الحصول على تاريخ المحادثة
   */
  private static async getConversationHistory(conversationId: string): Promise<string[]> {
    try {
      // إذا كان conversation ID مؤقت، لا يوجد تاريخ
      if (conversationId.startsWith('temp_')) {
        console.log('⚠️ Temporary conversation ID, no history available');
        return [];
      }

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentMessages) return [];

      return recentMessages
        .reverse()
        .map(msg => `${msg.sender_type === 'customer' ? 'العميل' : 'المتجر'}: ${msg.content}`);

    } catch (error) {
      console.error('❌ Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * تنظيف رد Gemini من التعليمات التقنية
   */
  private static cleanResponse(response: string): string {
    let cleanResponse = response;

    // إزالة التعليمات التقنية
    cleanResponse = cleanResponse
      .replace(/\([^)]*هتبعث[\s\S]*/gi, '')
      .replace(/\([^)]*هتبعتي[\s\S]*/gi, '')
      .replace(/\*\*\([^)]*هتبعث[\s\S]*/gi, '')
      .replace(/\*\*\([^)]*هتبعتي[\s\S]*/gi, '')
      .replace(/مثال على التعليق[\s\S]*/gi, '')
      .replace(/بعد إرسال كل الصور[\s\S]*/gi, '')
      .replace(/\* \*\*صورة[\s\S]*/gi, '')
      .replace(/\*\*صورة[\s\S]*/gi, '')
      .replace(/\[هنا[^\]]*\]/gi, '')
      .replace(/\[يجب[^\]]*\]/gi, '')
      .replace(/\[إرفاق[^\]]*\]/gi, '')
      .replace(/\[ضعي[^\]]*\]/gi, '')
      .replace(/\[أضف[^\]]*\]/gi, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // إذا كان النص طويل، اقطعه عند أول جملة كاملة
    if (cleanResponse.length > 200) {
      const sentences = cleanResponse.split(/[.!؟😉😍🥰💖✨🔥💙🖤🤍]/);
      if (sentences.length > 1) {
        cleanResponse = sentences.slice(0, 2).join('') + ' 😍';
      }
    }

    return cleanResponse;
  }

  /**
   * إرسال الرد للعميل
   */
  private static async sendResponseToCustomer(
    conversationId: string,
    senderId: string,
    message: string
  ): Promise<boolean> {
    try {
      // حفظ الرد في قاعدة البيانات (فقط إذا لم يكن conversation ID مؤقت)
      if (!conversationId.startsWith('temp_')) {
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: message,
            sender_type: 'bot',
            is_read: true,
            is_auto_reply: true,
            is_ai_generated: true,
            image_url: null
          });
        console.log('💾 Message saved to database');
      } else {
        console.log('⚠️ Temporary conversation, message not saved to database');
      }

      // إرسال عبر Facebook (إذا كانت الإعدادات متوفرة)
      const facebookSent = await this.sendViaFacebook(conversationId, senderId, message);

      console.log(`📤 Response processed. Facebook sent: ${facebookSent}`);
      return true;

    } catch (error) {
      console.error('❌ Error sending response to customer:', error);
      return false;
    }
  }

  /**
   * إرسال عبر Facebook
   */
  private static async sendViaFacebook(
    conversationId: string,
    senderId: string,
    message: string
  ): Promise<boolean> {
    try {
      // الحصول على إعدادات Facebook
      const facebookSettings = await this.getFacebookSettings(conversationId);
      
      if (!facebookSettings) {
        console.log('⚠️ No Facebook settings found');
        return false;
      }

      // استيراد خدمة Facebook
      const { FacebookApiService } = await import('./facebookApi');
      const facebookService = new FacebookApiService(facebookSettings.access_token);

      // إرسال الرسالة
      await facebookService.sendMessage(
        facebookSettings.access_token,
        senderId,
        message
      );

      console.log('✅ Message sent via Facebook');
      return true;

    } catch (error) {
      console.error('❌ Error sending via Facebook:', error);
      return false;
    }
  }

  /**
   * الحصول على إعدادات Facebook
   */
  private static async getFacebookSettings(conversationId: string): Promise<any> {
    try {
      // محاولة الحصول على page_id من المحادثة
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('facebook_page_id')
        .eq('id', conversationId)
        .single();

      if (conversationData?.facebook_page_id) {
        const { FacebookApiService } = await import('./facebookApi');
        const settings = await FacebookApiService.getPageSettings(conversationData.facebook_page_id);
        if (settings) return settings;
      }

      // إذا لم نجد إعدادات، جرب كل الصفحات المتاحة
      const { data: allPages } = await supabase
        .from('facebook_pages')
        .select('*')
        .eq('is_active', true);

      if (allPages && allPages.length > 0) {
        const { FacebookApiService } = await import('./facebookApi');
        for (const page of allPages) {
          try {
            const settings = await FacebookApiService.getPageSettings(page.page_id);
            if (settings) return settings;
          } catch (error) {
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting Facebook settings:', error);
      return null;
    }
  }
}
