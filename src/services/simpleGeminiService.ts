import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * خدمة Gemini AI البسيطة والذكية
 * تركز على الوظائف الأساسية مع النظام الذكي للصور
 */
export class SimpleGeminiService {

  /**
   * معالجة رسالة العميل وإنتاج رد ذكي
   */
  static async processMessage(
    userMessage: string,
    conversationId: string,
    senderId: string,
    pageId?: string
  ): Promise<boolean> {
    try {
      console.log(`🤖 [SIMPLE GEMINI] Processing: "${userMessage}"`);

      // الحصول على إعدادات Gemini
      const settings = await this.getGeminiSettings();
      if (!settings || !settings.is_enabled) {
        console.log('❌ Gemini AI is not enabled');
        return false;
      }

      // إنتاج الرد الذكي
      const response = await this.generateSmartResponse(userMessage, conversationId, settings);
      if (!response) {
        console.log('❌ Failed to generate response');
        return false;
      }

      // تم إزالة نظام الصور المعقد - سيتم استبداله بنظام موحد لاحقاً
      console.log(`📝 [SIMPLE GEMINI] Text response only: "${response}"`);

      // تنظيف الرد وإرساله
      const cleanResponse = this.cleanResponse(response);
      const sent = await this.sendResponse(conversationId, senderId, cleanResponse);

      console.log(`✅ [SIMPLE GEMINI] Message processed successfully`);
      return sent;

    } catch (error) {
      console.error('❌ [SIMPLE GEMINI] Error:', error);
      return false;
    }
  }

  /**
   * إنتاج رد ذكي من Gemini
   */
  private static async generateSmartResponse(
    userMessage: string,
    conversationId: string,
    settings: any
  ): Promise<string | null> {
    try {
      // بناء البرومت الذكي
      const prompt = await this.buildSmartPrompt(userMessage, conversationId);

      // استدعاء Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              topP: 0.8,
              topK: 10
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data = await response.json();
      return this.extractTextFromResponse(data);

    } catch (error) {
      console.error('❌ Error generating smart response:', error);
      return null;
    }
  }

  /**
   * بناء البرومت الذكي مع الحل المختلط
   */
  private static async buildSmartPrompt(userMessage: string, conversationId: string): Promise<string> {
    // الحصول على البيانات الأساسية
    const productsInfo = await this.getBasicProductsInfo();
    const conversationHistory = await this.getConversationHistory(conversationId);

    let prompt = `أنت مساعد ذكي لمتجر سوان شوب للأحذية النسائية.

📦 معلومات المتجر:
${productsInfo}

🎯 مهمتك:
1. الرد بطريقة ودودة ومهذبة
2. تقديم معلومات عامة عن المتجر
3. مساعدة العملاء والإجابة على استفساراتهم
4. توجيه العملاء للتواصل المباشر للاستفسارات التفصيلية

📞 معلومات التواصل:
- رقم الواتساب: 01032792040
- نعمل على تقديم أفضل خدمة للعملاء

💡 نصائح للرد:
- كن مفيداً وودوداً
- اشرح أنواع الأحذية المتوفرة بشكل عام
- وجه العملاء للتواصل المباشر للتفاصيل والأسعار
- لا تذكر منتجات أو أسعار محددة

`;

    // إضافة تاريخ المحادثة
    if (conversationHistory.length > 0) {
      prompt += `\n📝 تاريخ المحادثة:\n${conversationHistory.join('\n')}\n`;
    }

    prompt += `\n💬 رسالة العميل: ${userMessage}\n\nردك:`;

    return prompt;
  }

  /**
   * الحصول على معلومات المنتجات الأساسية
   */
  private static async getBasicProductsInfo(): Promise<string> {
    // لا توجد منتجات محددة - النظام يعمل بدون كتالوج منتجات
    return `نحن متجر للأحذية النسائية العصرية.

🛍️ نقدم مجموعة متنوعة من الأحذية:
- أحذية رياضية مريحة
- أحذية كلاسيكية أنيقة
- أحذية كاجوال للاستخدام اليومي
- أحذية رسمية للمناسبات

📞 للاستفسار عن المنتجات المتوفرة والأسعار، يرجى التواصل معنا مباشرة.
💬 سنكون سعداء لمساعدتك في اختيار الحذاء المناسب!`;
  }

  /**
   * الحصول على تاريخ المحادثة
   */
  private static async getConversationHistory(conversationId: string): Promise<string[]> {
    try {
      if (conversationId.startsWith('temp_')) return [];

      const { data: messages } = await supabase
        .from('messages')
        .select('content, sender_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!messages) return [];

      return messages
        .reverse()
        .map(msg => {
          const sender = msg.sender_type === 'customer' ? 'العميل' : 'المتجر';
          return `${sender}: ${msg.content}`;
        });

    } catch (error) {
      console.error('❌ Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * تنظيف الرد من الإشارات التقنية
   */
  private static cleanResponse(response: string): string {
    return response
      .replace(/\[SEND_IMAGE:[^\]]*\]/gi, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * استخراج النص من استجابة Gemini
   */
  private static extractTextFromResponse(data: any): string | null {
    try {
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      return null;
    } catch (error) {
      console.error('❌ Error extracting text from response:', error);
      return null;
    }
  }

  /**
   * إرسال الرد للعميل
   */
  private static async sendResponse(
    conversationId: string,
    senderId: string,
    message: string,
    imageUrl?: string
  ): Promise<boolean> {
    try {
      // حفظ في قاعدة البيانات
      if (!conversationId.startsWith('temp_')) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: message,
          sender_type: 'bot',
          is_read: true,
          is_auto_reply: true,
          is_ai_generated: true,
          image_url: imageUrl || null
        });
      }

      // إرسال عبر Facebook
      return await this.sendViaFacebook(conversationId, senderId, message);

    } catch (error) {
      console.error('❌ Error sending response:', error);
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
      const { FacebookApiService } = await import('./facebookApi');

      const facebookSettings = await this.getFacebookSettings();
      if (!facebookSettings) {
        console.log('⚠️ No Facebook settings available');
        return false;
      }

      const facebookService = new FacebookApiService(facebookSettings.access_token);
      await facebookService.sendMessage(facebookSettings.access_token, senderId, message);

      console.log('✅ Message sent via Facebook');
      return true;

    } catch (error) {
      console.error('❌ Error sending via Facebook:', error);
      return false;
    }
  }

  /**
   * الحصول على إعدادات Gemini
   */
  private static async getGeminiSettings(): Promise<any> {
    try {
      const { data: settings } = await supabase
        .from('gemini_settings')
        .select('*')
        .limit(1)
        .single();

      return settings;
    } catch (error) {
      console.error('❌ Error getting Gemini settings:', error);
      return null;
    }
  }

  /**
   * الحصول على إعدادات Facebook
   */
  private static async getFacebookSettings(): Promise<any> {
    try {
      const { data: settings } = await supabase
        .from('facebook_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      return settings && settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error('❌ Error getting Facebook settings:', error);
      return null;
    }
  }
}
