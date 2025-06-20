import { supabase } from "@/integrations/supabase/client";
import { SimpleGeminiService } from "./simpleGeminiService";

interface WhatsAppAISettings {
  is_enabled: boolean;
  use_existing_prompt: boolean;
  custom_prompt: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  can_access_orders: boolean;
  can_access_products: boolean;
  auto_reply_enabled: boolean;
}

interface OrderInfo {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  productName?: string;
  size?: string;
  color?: string;
  quantity?: number;
}

export class WhatsAppAIService {
  private static settings: WhatsAppAISettings | null = null;

  /**
   * تحميل إعدادات WhatsApp AI
   */
  static async loadSettings(): Promise<WhatsAppAISettings> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_ai_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // إنشاء إعدادات افتراضية
        const defaultSettings: WhatsAppAISettings = {
          is_enabled: false,
          use_existing_prompt: true,
          custom_prompt: '',
          api_key: '',
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          max_tokens: 1000,
          can_access_orders: true,
          can_access_products: true,
          auto_reply_enabled: true
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('whatsapp_ai_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        
        this.settings = newSettings;
        return newSettings;
      }

      this.settings = data;
      return data;
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في تحميل الإعدادات:', error);
      throw error;
    }
  }

  /**
   * حفظ إعدادات WhatsApp AI
   */
  static async saveSettings(settings: WhatsAppAISettings): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_ai_settings')
        .upsert(settings);

      if (error) throw error;

      this.settings = settings;
      console.log('✅ [WhatsApp AI] تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في حفظ الإعدادات:', error);
      throw error;
    }
  }

  /**
   * معالجة رسالة WhatsApp بالذكاء الاصطناعي
   */
  static async processMessage(
    phoneNumber: string,
    messageText: string,
    contactName?: string
  ): Promise<string | null> {
    try {
      console.log(`🤖 [WhatsApp AI] معالجة رسالة من ${phoneNumber}: ${messageText}`);

      // تحميل الإعدادات إذا لم تكن محملة
      if (!this.settings) {
        await this.loadSettings();
      }

      if (!this.settings?.is_enabled || !this.settings?.auto_reply_enabled) {
        console.log('🔇 [WhatsApp AI] الذكاء الاصطناعي معطل');
        return null;
      }

      if (!this.settings.api_key) {
        console.log('❌ [WhatsApp AI] API Key غير موجود');
        return null;
      }

      let response: string;

      if (this.settings.use_existing_prompt) {
        // استخدام النظام الموجود مع تخصيصات WhatsApp
        response = await this.useExistingSystem(phoneNumber, messageText, contactName);
      } else {
        // استخدام البرومت المخصص
        response = await this.useCustomPrompt(phoneNumber, messageText, contactName);
      }

      if (response) {
        // حفظ الرد في قاعدة البيانات
        await this.saveAIResponse(phoneNumber, messageText, response);
      }

      return response;
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في معالجة الرسالة:', error);
      return null;
    }
  }

  /**
   * استخدام النظام الموجود مع تخصيصات WhatsApp
   */
  private static async useExistingSystem(
    phoneNumber: string,
    messageText: string,
    contactName?: string
  ): Promise<string> {
    try {
      console.log('🔄 [WhatsApp AI] استخدام النظام الموجود...');

      // الحصول على إعدادات Gemini الأساسية
      const { data: geminiSettings } = await supabase
        .from('gemini_settings')
        .select('*')
        .eq('is_enabled', true)
        .single();

      if (!geminiSettings) {
        console.log('❌ [WhatsApp AI] إعدادات Gemini غير موجودة');
        return 'عذراً، النظام غير متاح حالياً';
      }

      // بناء البرومت باستخدام إعدادات Gemini الموجودة
      let prompt = geminiSettings.personality_prompt || '';

      if (geminiSettings.products_prompt) {
        prompt += '\n\n' + geminiSettings.products_prompt;
      }

      // إضافة معلومات العميل
      prompt += `\n\nمعلومات العميل:`;
      prompt += `\n- رقم الهاتف: ${phoneNumber}`;
      if (contactName) {
        prompt += `\n- الاسم: ${contactName}`;
      }

      // إضافة الرسالة
      prompt += `\n\nرسالة العميل: ${messageText}`;
      prompt += `\n\nردك:`;

      console.log('🤖 [WhatsApp AI] إرسال طلب إلى Gemini...');

      // استدعاء Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiSettings.model}:generateContent?key=${geminiSettings.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: parseFloat(geminiSettings.temperature) || 0.5,
            maxOutputTokens: geminiSettings.max_tokens || 300,
          }
        })
      });

      if (!response.ok) {
        console.error('❌ [WhatsApp AI] Gemini API خطأ:', response.status);
        return 'عذراً، حدث خطأ تقني في النظام';
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        console.log('❌ [WhatsApp AI] لا يوجد رد من Gemini');
        return 'عذراً، لم أتمكن من إنتاج رد مناسب';
      }

      console.log('✅ [WhatsApp AI] تم الحصول على رد من Gemini');

      // معالجة الأوامر الخاصة
      return await this.processSpecialCommands(aiResponse, phoneNumber, messageText);

    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في استخدام النظام الموجود:', error);
      return 'عذراً، حدث خطأ في معالجة رسالتك';
    }
  }

  /**
   * استخدام البرومت المخصص
   */
  private static async useCustomPrompt(
    phoneNumber: string,
    messageText: string,
    contactName?: string
  ): Promise<string> {
    if (!this.settings) throw new Error('الإعدادات غير محملة');

    let prompt = this.settings.custom_prompt;

    // إضافة معلومات السياق
    prompt += `\n\nمعلومات العميل:`;
    prompt += `\n- رقم الهاتف: ${phoneNumber}`;
    if (contactName) {
      prompt += `\n- الاسم: ${contactName}`;
    }

    // إضافة معلومات المنتجات إذا كان مسموح
    if (this.settings.can_access_products) {
      const productsInfo = await this.getProductsInfo(messageText);
      if (productsInfo) {
        prompt += `\n\nالمنتجات المتوفرة:\n${productsInfo}`;
      }
    }

    // إضافة معلومات الطلبات إذا كان مسموح
    if (this.settings.can_access_orders) {
      const ordersInfo = await this.getCustomerOrders(phoneNumber);
      if (ordersInfo) {
        prompt += `\n\nطلبات العميل السابقة:\n${ordersInfo}`;
      }
    }

    prompt += `\n\nرسالة العميل: ${messageText}`;
    prompt += `\n\nردك:`;

    // استدعاء Gemini API مباشرة
    const response = await this.callGeminiAPI(prompt);
    
    // معالجة الأوامر الخاصة في الرد
    return await this.processSpecialCommands(response, phoneNumber, messageText);
  }

  /**
   * استدعاء Gemini API مباشرة
   */
  private static async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.settings) throw new Error('الإعدادات غير محملة');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${this.settings.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: this.settings.temperature,
            maxOutputTokens: this.settings.max_tokens,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من الرد';
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في Gemini API:', error);
      return 'عذراً، حدث خطأ تقني';
    }
  }

  /**
   * الحصول على معلومات المنتجات
   */
  private static async getProductsInfo(messageText: string): Promise<string | null> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('name, price, description, stock_quantity')
        .gt('stock_quantity', 0)
        .limit(10);

      if (error || !products || products.length === 0) {
        return null;
      }

      return products.map(product => 
        `- ${product.name}: ${product.price} جنيه (متوفر: ${product.stock_quantity})`
      ).join('\n');
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في جلب المنتجات:', error);
      return null;
    }
  }

  /**
   * الحصول على طلبات العميل
   */
  private static async getCustomerOrders(phoneNumber: string): Promise<string | null> {
    try {
      const { data: orders, error } = await supabase
        .from('ecommerce_orders')
        .select('order_number, product_name, status, created_at')
        .eq('customer_phone', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !orders || orders.length === 0) {
        return null;
      }

      return orders.map(order => 
        `- طلب #${order.order_number}: ${order.product_name} (${order.status})`
      ).join('\n');
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في جلب الطلبات:', error);
      return null;
    }
  }

  /**
   * معالجة الأوامر الخاصة في الرد
   */
  private static async processSpecialCommands(
    response: string,
    phoneNumber: string,
    originalMessage: string
  ): Promise<string> {
    // البحث عن أمر إنشاء طلب
    const createOrderMatch = response.match(/\[CREATE_ORDER:\s*(.+?)\]/);
    if (createOrderMatch && this.settings?.can_access_orders) {
      try {
        const orderInfo = this.extractOrderInfo(originalMessage);
        if (this.isOrderInfoComplete(orderInfo)) {
          const orderNumber = await this.createOrder(orderInfo, phoneNumber);
          if (orderNumber) {
            response = response.replace(createOrderMatch[0], 
              `تم إنشاء طلبك بنجاح! رقم الطلب: ${orderNumber}`);
          }
        }
      } catch (error) {
        console.error('❌ [WhatsApp AI] خطأ في إنشاء الطلب:', error);
      }
    }

    return response;
  }

  /**
   * استخراج معلومات الطلب من الرسالة
   */
  private static extractOrderInfo(messageText: string): OrderInfo {
    // منطق استخراج البيانات (مبسط)
    return {
      customerName: this.extractName(messageText),
      customerPhone: this.extractPhone(messageText),
      customerAddress: this.extractAddress(messageText),
      productName: this.extractProduct(messageText),
      size: this.extractSize(messageText),
      color: this.extractColor(messageText),
      quantity: this.extractQuantity(messageText)
    };
  }

  private static extractName(text: string): string | undefined {
    const nameMatch = text.match(/اسم[يي]?\s*:?\s*([^\n\r,]+)/i);
    return nameMatch?.[1]?.trim();
  }

  private static extractPhone(text: string): string | undefined {
    const phoneMatch = text.match(/(?:رقم|هاتف|موبايل|تليفون)\s*:?\s*([0-9+\s-]+)/i);
    return phoneMatch?.[1]?.replace(/\s/g, '');
  }

  private static extractAddress(text: string): string | undefined {
    const addressMatch = text.match(/(?:عنوان|العنوان)\s*:?\s*([^\n\r]+)/i);
    return addressMatch?.[1]?.trim();
  }

  private static extractProduct(text: string): string | undefined {
    const productMatch = text.match(/(?:منتج|المنتج|حذاء|شنطة)\s*:?\s*([^\n\r,]+)/i);
    return productMatch?.[1]?.trim();
  }

  private static extractSize(text: string): string | undefined {
    const sizeMatch = text.match(/(?:مقاس|المقاس|size)\s*:?\s*([0-9]+)/i);
    return sizeMatch?.[1];
  }

  private static extractColor(text: string): string | undefined {
    const colorMatch = text.match(/(?:لون|اللون|color)\s*:?\s*([^\n\r,]+)/i);
    return colorMatch?.[1]?.trim();
  }

  private static extractQuantity(text: string): number {
    const quantityMatch = text.match(/(?:كمية|الكمية|عدد|quantity)\s*:?\s*([0-9]+)/i);
    return quantityMatch ? parseInt(quantityMatch[1]) : 1;
  }

  /**
   * فحص اكتمال معلومات الطلب
   */
  private static isOrderInfoComplete(orderInfo: OrderInfo): boolean {
    return !!(
      orderInfo.customerName &&
      orderInfo.customerPhone &&
      orderInfo.customerAddress &&
      orderInfo.productName
    );
  }

  /**
   * إنشاء طلب جديد
   */
  private static async createOrder(orderInfo: OrderInfo, phoneNumber: string): Promise<string | null> {
    try {
      const orderNumber = `WA${Date.now()}`;
      
      const { data, error } = await supabase
        .from('ecommerce_orders')
        .insert({
          order_number: orderNumber,
          customer_name: orderInfo.customerName,
          customer_phone: orderInfo.customerPhone || phoneNumber,
          customer_address: orderInfo.customerAddress,
          product_name: orderInfo.productName,
          product_size: orderInfo.size || '',
          product_color: orderInfo.color || '',
          quantity: orderInfo.quantity || 1,
          unit_price: 0, // سيتم تحديثه لاحقاً
          total_amount: 0,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'cash_on_delivery',
          notes: 'طلب من WhatsApp AI',
          currency: 'EGP'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ [WhatsApp AI] تم إنشاء طلب جديد: ${orderNumber}`);
      return orderNumber;
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في إنشاء الطلب:', error);
      return null;
    }
  }

  /**
   * حفظ رد الذكاء الاصطناعي
   */
  private static async saveAIResponse(
    phoneNumber: string,
    originalMessage: string,
    response: string
  ): Promise<void> {
    try {
      await supabase
        .from('whatsapp_messages')
        .insert({
          message_id: `ai_response_${Date.now()}`,
          phone_number: phoneNumber,
          contact_name: '',
          message_text: response,
          message_type: 'outgoing',
          timestamp: new Date().toISOString(),
          is_ai_generated: true
        });
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في حفظ الرد:', error);
    }
  }

  /**
   * اختبار الذكاء الاصطناعي
   */
  static async testAI(message: string, settings: WhatsAppAISettings): Promise<boolean> {
    try {
      // حفظ الإعدادات مؤقتاً
      const originalSettings = this.settings;
      this.settings = settings;

      const response = await this.useCustomPrompt('test', message, 'مستخدم تجريبي');

      // استعادة الإعدادات الأصلية
      this.settings = originalSettings;

      return !!response && response.length > 0;
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في اختبار الذكاء الاصطناعي:', error);
      return false;
    }
  }

  /**
   * إعادة تحميل الإعدادات
   */
  static async reloadSettings(): Promise<void> {
    try {
      console.log('🔄 [WhatsApp AI] إعادة تحميل الإعدادات...');
      this.settings = null;
      await this.loadSettings();
      console.log('✅ [WhatsApp AI] تم إعادة تحميل الإعدادات بنجاح');
    } catch (error) {
      console.error('❌ [WhatsApp AI] خطأ في إعادة تحميل الإعدادات:', error);
      throw error;
    }
  }
}
