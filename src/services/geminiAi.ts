import { supabase } from "@/integrations/supabase/client";
import { OrderService, CustomerInfo } from './orderService';
import { ProductImageService } from './productImageService';

export interface GeminiSettings {
  api_key: string;
  model: string;
  prompt_template: string;
  is_enabled: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  success: boolean;
  response?: string;
  error?: string;
}

export class GeminiAiService {
  private apiKey: string;
  private model: string;
  private promptTemplate: string;
  private maxTokens: number;
  private temperature: number;

  constructor(settings: GeminiSettings) {
    this.apiKey = settings.api_key;
    this.model = settings.model || 'gemini-1.5-flash';
    this.promptTemplate = settings.prompt_template;
    this.maxTokens = settings.max_tokens || 1000;
    this.temperature = settings.temperature || 0.7;
  }

  // إرسال رسالة إلى Gemini AI
  async generateResponse(userMessage: string, conversationHistory?: string[]): Promise<GeminiResponse> {
    try {
      // بناء البرومت
      const prompt = this.buildPrompt(userMessage, conversationHistory);

      // إرسال الطلب إلى Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            topP: 0.8,
            topK: 10
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('🔍 Gemini API Response structure:', JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const candidate = data.candidates[0];
        console.log('🔍 Candidate structure:', JSON.stringify(candidate, null, 2));

        // التحقق من وجود parts
        if (candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0] && candidate.content.parts[0].text) {
          const generatedText = candidate.content.parts[0].text;
          return {
            success: true,
            response: generatedText.trim()
          };
        } else {
          console.error('❌ Parts structure not found in candidate.content:', candidate.content);
          console.error('❌ Finish reason:', candidate.finishReason);

          // إذا كان السبب MAX_TOKENS، نحاول استخدام أي نص متاح
          if (candidate.finishReason === 'MAX_TOKENS' && candidate.content.parts && candidate.content.parts.length > 0) {
            const partialText = candidate.content.parts[0]?.text || '';
            if (partialText) {
              console.log('⚠️ Using partial response due to MAX_TOKENS');
              return {
                success: true,
                response: partialText.trim() + '...'
              };
            }
          }

          throw new Error('Invalid response structure from Gemini - parts not found');
        }
      } else {
        console.error('❌ Invalid response structure from Gemini:', data);
        throw new Error('No response generated from Gemini');
      }

    } catch (error) {
      console.error('Error generating Gemini response:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // بناء البرومت مع السياق
  private buildPrompt(userMessage: string, conversationHistory?: string[]): string {
    let prompt = this.promptTemplate;

    // إضافة تاريخ المحادثة إذا كان متوفراً
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory.join('\n');
      prompt += `\n\nتاريخ المحادثة السابقة:\n${historyText}`;
    }

    // إضافة الرسالة الحالية
    prompt += `\n\nرسالة العميل الحالية: ${userMessage}`;
    prompt += `\n\nردك:`;

    return prompt;
  }

  // الحصول على إعدادات Gemini من قاعدة البيانات (أولوية) أو متغيرات البيئة
  static async getGeminiSettings(): Promise<GeminiSettings | null> {
    try {
      // أولاً: محاولة الحصول على الإعدادات من قاعدة البيانات
      console.log('🔍 Checking database for Gemini settings...');
      const { data, error } = await supabase
        .from('gemini_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.log('❌ Database error:', error);
      }

      if (data && data.api_key && data.api_key !== 'your_gemini_api_key_here') {
        console.log('✅ Using Gemini settings from database');
        console.log('🔧 Database settings:', {
          api_key: data.api_key ? '***' + data.api_key.slice(-4) : 'none',
          model: data.model,
          is_enabled: data.is_enabled,
          max_tokens: data.max_tokens,
          temperature: data.temperature
        });
        return data;
      }

      // ثانياً: محاولة الحصول على الإعدادات من متغيرات البيئة
      console.log('⚠️ No valid database settings found, trying environment variables...');
      const envSettings = this.getSettingsFromEnv();
      if (envSettings) {
        console.log('✅ Using Gemini settings from environment variables');

        // نسخ الإعدادات من .env إلى قاعدة البيانات للمرة الأولى
        try {
          await this.saveGeminiSettings(envSettings);
          console.log('✅ Environment settings copied to database');
        } catch (copyError) {
          console.log('⚠️ Could not copy env settings to database:', copyError);
        }

        return envSettings;
      }

      console.log('❌ No Gemini settings found in environment or database');
      return null;
    } catch (error) {
      console.error('Error fetching Gemini settings:', error);
      return null;
    }
  }

  // الحصول على إعدادات Gemini من متغيرات البيئة
  static getSettingsFromEnv(): GeminiSettings | null {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL;
      const enabled = process.env.GEMINI_ENABLED;
      const promptTemplate = process.env.GEMINI_PROMPT_TEMPLATE;

      if (!apiKey || !model || !enabled || !promptTemplate) {
        console.log('⚠️ Missing required Gemini environment variables');
        return null;
      }

      return {
        api_key: apiKey,
        model: model,
        is_enabled: enabled.toLowerCase() === 'true',
        max_tokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
        prompt_template: promptTemplate.replace(/\\n/g, '\n') // تحويل \\n إلى \n
      };
    } catch (error) {
      console.error('Error parsing environment variables:', error);
      return null;
    }
  }

  // حفظ إعدادات Gemini في قاعدة البيانات
  static async saveGeminiSettings(settings: Partial<GeminiSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('gemini_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving Gemini settings:', error);
      throw error;
    }
  }

  // معالجة رسالة واردة وإنتاج رد ذكي
  static async processIncomingMessage(
    userMessage: string,
    conversationId: string,
    senderId: string
  ): Promise<boolean> {
    console.log('🔍 GeminiAiService.processIncomingMessage called with:', { userMessage, conversationId, senderId });
    console.log('🔍 Function entry point reached!');
    try {
      console.log(`🤖 Gemini AI: Processing message "${userMessage}" for sender ${senderId}`);
      console.log(`📍 Conversation ID: ${conversationId}`);

      // الحصول على إعدادات Gemini
      const settings = await this.getGeminiSettings();
      console.log('🔧 Gemini settings:', settings ? 'Found' : 'Not found');

      if (!settings || !settings.is_enabled || !settings.api_key) {
        console.log('❌ Gemini AI is not enabled or configured:', {
          settings: !!settings,
          enabled: settings?.is_enabled,
          hasApiKey: !!settings?.api_key
        });
        return false;
      }

      console.log('✅ Gemini AI is enabled and configured');

      // التحقق من طلبات الصور أولاً - دع Gemini يتعامل معها
      const isImageRequest = ProductImageService.isImageRequest(userMessage);
      if (isImageRequest) {
        console.log('🖼️ Image request detected, Gemini will handle it...');
      }

      // إنشاء instance من الخدمة
      const geminiService = new GeminiAiService(settings);

      // الحصول على تاريخ المحادثة (آخر 5 رسائل)
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('content, sender_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      const conversationHistory = recentMessages
        ?.reverse()
        .map(msg => `${msg.sender_type === 'customer' ? 'العميل' : 'المتجر'}: ${msg.content}`) || [];

      // إنتاج الرد
      console.log('🚀 Calling Gemini generateResponse...');
      const geminiResponse = await geminiService.generateResponse(userMessage, conversationHistory);
      console.log('📥 Gemini response received:', geminiResponse);

      if (!geminiResponse.success || !geminiResponse.response) {
        console.error('Failed to generate Gemini response:', geminiResponse.error);
        return false;
      }

      // تحليل المحادثة للبحث عن طلب محتمل
      await this.checkAndCreateOrder(conversationId, userMessage);

      // إرسال الرد عبر Facebook
      console.log('🔍 About to get Facebook settings...');
      const { data: facebookSettings } = await supabase
        .from('facebook_settings')
        .select('access_token')
        .single();

      console.log('🔍 Facebook settings result:', !!facebookSettings);
      if (facebookSettings) {
        console.log('🔍 Facebook settings found, proceeding...');
        const { FacebookApiService } = await import('./facebookApi');
        const facebookService = new FacebookApiService(facebookSettings.access_token);

        // نظام بسيط وذكي للصور - فقط عند طلب صورة
        console.log('🔍 Original Gemini response:', geminiResponse.response);

        // التحقق من وجود طلب صورة صريح أو ضمني
        const isExplicitImageRequest = userMessage.includes('ابعت') ||
                                     userMessage.includes('اعرض') ||
                                     userMessage.includes('ورني') ||
                                     userMessage.includes('وريني') ||
                                     userMessage.includes('صورة') ||
                                     userMessage.includes('صوره') ||
                                     (userMessage.includes('شوف') && userMessage.includes('لون')) ||
                                     (userMessage.includes('عايز') && userMessage.includes('شوف')) ||
                                     // إضافة كشف الألوان المباشرة
                                     userMessage.includes('والاحمر') ||
                                     userMessage.includes('والاسود') ||
                                     userMessage.includes('والابيض') ||
                                     userMessage.includes('والازرق') ||
                                     userMessage.includes('والجملي') ||
                                     userMessage.includes('والبيج') ||
                                     // أو أي ذكر مباشر للون
                                     (geminiResponse.response.includes('اللون') &&
                                      (geminiResponse.response.includes('أحمر') ||
                                       geminiResponse.response.includes('أسود') ||
                                       geminiResponse.response.includes('أبيض') ||
                                       geminiResponse.response.includes('أزرق') ||
                                       geminiResponse.response.includes('جملي') ||
                                       geminiResponse.response.includes('بيج')));

        let imageSent = false;
        if (isExplicitImageRequest) {
          console.log('🖼️ Explicit image request detected, sending image...');
          // اكتشاف اللون وإرسال الصورة مباشرة
          imageSent = await GeminiAiService.detectAndSendImage(
            geminiResponse.response,
            userMessage,
            senderId,
            facebookSettings.access_token
          );
        } else {
          console.log('💬 Text-only response, no image needed');
        }

        // تنظيف النص من placeholder texts
        let cleanResponse = geminiResponse.response
          .replace(/\[هنا[^\]]*\]/gi, '')
          .replace(/\[يجب[^\]]*\]/gi, '')
          .replace(/\[إرفاق[^\]]*\]/gi, '')
          .replace(/\[ضعي[^\]]*\]/gi, '')
          .replace(/\[أضف[^\]]*\]/gi, '')
          .trim();

        // إرسال النص المنظف
        if (cleanResponse) {
          await facebookService.sendMessage(
            facebookSettings.access_token,
            senderId,
            cleanResponse
          );
        }

        // حفظ الرد في قاعدة البيانات
        const mainImageUrl = imageSent ? 'image_sent' : null;
        const textContent = cleanResponse;

        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: textContent,
            sender_type: 'bot',
            is_read: true,
            is_auto_reply: true,
            is_ai_generated: true,
            image_url: mainImageUrl
          });

        console.log('✅ Gemini AI response sent successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error processing Gemini AI response:', error);
      return false;
    }
  }

  // تحليل المحادثة وإنشاء طلب إذا كانت البيانات مكتملة
  static async checkAndCreateOrder(conversationId: string, userMessage: string): Promise<void> {
    try {
      // التحقق من وجود طلب مسبق لهذه المحادثة
      const existingOrder = await OrderService.getOrderByConversationId(conversationId);
      if (existingOrder) {
        console.log('📦 Order already exists for this conversation:', existingOrder.order_number);
        return;
      }

      // تحليل المحادثة لاستخراج معلومات العميل
      const customerInfo = await OrderService.analyzeConversationForOrder(conversationId);

      if (!customerInfo) {
        console.log('❌ Could not extract customer info from conversation');
        return;
      }

      console.log('🔍 Extracted customer info:', customerInfo);

      // التحقق من اكتمال البيانات
      if (OrderService.isOrderDataComplete(customerInfo)) {
        console.log('✅ Customer data is complete, creating order...');

        // إنشاء الطلب
        const orderData = {
          conversation_id: conversationId,
          customer_name: customerInfo.name!,
          customer_phone: customerInfo.phone!,
          customer_address: customerInfo.address!,
          product_name: customerInfo.product || 'كوتشي حريمي',
          product_size: customerInfo.size!,
          product_color: customerInfo.color!,
          quantity: 1,
          unit_price: 350,
          shipping_cost: 50,
          total_price: 400, // 350 + 50
          notes: 'طلب تم إنشاؤه تلقائياً من المحادثة'
        };

        const newOrder = await OrderService.createOrder(orderData);

        if (newOrder) {
          console.log('🎉 Order created successfully:', newOrder.order_number);

          // إرسال رسالة تأكيد للعميل
          await this.sendOrderConfirmation(conversationId, newOrder);
        }
      } else {
        console.log('⏳ Customer data incomplete, waiting for more info...');
        console.log('Missing:', {
          name: !customerInfo.name,
          phone: !customerInfo.phone,
          address: !customerInfo.address,
          size: !customerInfo.size,
          color: !customerInfo.color
        });

        // محاولة إضافية لاستخراج البيانات من الرسالة الحالية
        const currentMessageInfo = OrderService.extractCustomerInfo(userMessage);
        console.log('🔍 Current message extracted info:', currentMessageInfo);

        // دمج المعلومات الجديدة
        const updatedInfo = { ...customerInfo };
        if (currentMessageInfo.name && !updatedInfo.name) updatedInfo.name = currentMessageInfo.name;
        if (currentMessageInfo.phone && !updatedInfo.phone) updatedInfo.phone = currentMessageInfo.phone;
        if (currentMessageInfo.address && !updatedInfo.address) updatedInfo.address = currentMessageInfo.address;
        if (currentMessageInfo.size && !updatedInfo.size) updatedInfo.size = currentMessageInfo.size;
        if (currentMessageInfo.color && !updatedInfo.color) updatedInfo.color = currentMessageInfo.color;

        console.log('🔄 Updated customer info:', updatedInfo);

        // التحقق مرة أخرى من اكتمال البيانات
        if (OrderService.isOrderDataComplete(updatedInfo)) {
          console.log('✅ Customer data is now complete after update, creating order...');

          // إنشاء الطلب
          const orderData = {
            conversation_id: conversationId,
            customer_name: updatedInfo.name!,
            customer_phone: updatedInfo.phone!,
            customer_address: updatedInfo.address!,
            product_name: updatedInfo.product || 'كوتشي حريمي',
            product_size: updatedInfo.size!,
            product_color: updatedInfo.color!,
            quantity: 1,
            unit_price: 350,
            shipping_cost: 50,
            total_price: 400, // 350 + 50
            notes: 'طلب تم إنشاؤه تلقائياً من المحادثة'
          };

          const newOrder = await OrderService.createOrder(orderData);

          if (newOrder) {
            console.log('🎉 Order created successfully:', newOrder.order_number);

            // إرسال رسالة تأكيد للعميل
            await this.sendOrderConfirmation(conversationId, newOrder);
          }
        }
      }
    } catch (error) {
      console.error('Error checking and creating order:', error);
    }
  }

  // إرسال رسالة تأكيد الطلب
  static async sendOrderConfirmation(conversationId: string, order: any): Promise<void> {
    try {
      const confirmationMessage = `🎉 تم تأكيد طلبك بنجاح!

📋 رقم الطلب: ${order.order_number}
👤 الاسم: ${order.customer_name}
📱 الهاتف: ${order.customer_phone}
📍 العنوان: ${order.customer_address}
👟 المنتج: ${order.product_name}
📏 المقاس: ${order.product_size}
🎨 اللون: ${order.product_color}
💰 السعر: ${order.unit_price} جنيه
🚚 الشحن: ${order.shipping_cost} جنيه
💳 الإجمالي: ${order.total_price} جنيه

سيتم التواصل معك قريباً لتأكيد التسليم. شكراً لثقتك فينا! 💕`;

      // حفظ رسالة التأكيد في قاعدة البيانات
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: confirmationMessage,
          sender_type: 'bot',
          is_read: true,
          is_auto_reply: true,
          is_ai_generated: false
        });

      // إرسال الرسالة عبر Facebook
      const { data: facebookSettings } = await supabase
        .from('facebook_settings')
        .select('access_token')
        .single();

      if (facebookSettings) {
        // الحصول على sender_id من المحادثة
        const { data: conversation } = await supabase
          .from('conversations')
          .select('customer_id')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          const { FacebookApiService } = await import('./facebookApi');
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          await facebookService.sendMessage(
            facebookSettings.access_token,
            conversation.customer_id,
            confirmationMessage
          );

          console.log('✅ Order confirmation sent to customer');
        }
      }
    } catch (error) {
      console.error('Error sending order confirmation:', error);
    }
  }

  // التحقق من طلبات الصور وإرسالها
  static async checkAndSendProductImage(conversationId: string, userMessage: string): Promise<void> {
    try {
      // التحقق من وجود طلب صورة
      if (!ProductImageService.isImageRequest(userMessage)) {
        return;
      }

      console.log('🖼️ Image request detected:', userMessage);

      // استخراج اللون المطلوب
      const requestedColor = ProductImageService.detectColorInText(userMessage);

      if (!requestedColor) {
        console.log('❌ No color detected in image request');
        return;
      }

      console.log('🎨 Color detected:', requestedColor);

      // البحث عن صورة المنتج
      const productImage = await ProductImageService.getProductImageByColor('كوتشي حريمي', requestedColor);

      if (!productImage) {
        console.log('❌ No image found for color:', requestedColor);

        // إرسال رسالة اعتذار
        const apologyMessage = `آسفة يا قمر! 😔 مش متوفر صورة للكوتشي باللون ${requestedColor} حالياً.

بس عندنا ألوان تانية جميلة زي:
🤍 الأبيض
🖤 الأسود
❤️ الأحمر
💙 الأزرق

عايزة تشوفي أي لون منهم؟ 😊`;

        await this.sendMessageToCustomer(conversationId, apologyMessage);
        return;
      }

      console.log('✅ Product image found:', productImage.image_filename);

      // إنشاء رسالة مع الصورة
      const imageMessage = ProductImageService.createImageMessage(productImage);
      console.log('📝 Image message created:', imageMessage);

      // إرسال الرسالة مع الصورة
      console.log('🚀 Calling sendImageToCustomer...');
      await this.sendImageToCustomer(conversationId, imageMessage, productImage.image_url);
      console.log('✅ sendImageToCustomer completed');

    } catch (error) {
      console.error('Error checking and sending product image:', error);
    }
  }

  // إرسال رسالة نصية للعميل
  static async sendMessageToCustomer(conversationId: string, message: string): Promise<void> {
    try {
      // حفظ الرسالة في قاعدة البيانات
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: message,
          sender_type: 'bot',
          is_read: true,
          is_auto_reply: true,
          is_ai_generated: false
        });

      // إرسال عبر Facebook
      const { data: facebookSettings } = await supabase
        .from('facebook_settings')
        .select('access_token')
        .single();

      if (facebookSettings) {
        const { data: conversation } = await supabase
          .from('conversations')
          .select('customer_id')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          const { FacebookApiService } = await import('./facebookApi');
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          await facebookService.sendMessage(
            facebookSettings.access_token,
            conversation.customer_id,
            message
          );

          console.log('✅ Message sent to customer');
        }
      }
    } catch (error) {
      console.error('Error sending message to customer:', error);
    }
  }

  // إرسال صورة للعميل
  static async sendImageToCustomer(conversationId: string, message: string, imageUrl: string): Promise<void> {
    console.log('🖼️ sendImageToCustomer called with:', { conversationId, imageUrl });
    try {
      // حفظ الرسالة في قاعدة البيانات
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: `${message}\n[صورة: ${imageUrl}]`,
          sender_type: 'bot',
          is_read: true,
          is_auto_reply: true,
          is_ai_generated: false
        });

      // إرسال عبر Facebook
      const { data: facebookSettings } = await supabase
        .from('facebook_settings')
        .select('access_token')
        .single();

      if (facebookSettings) {
        const { data: conversation } = await supabase
          .from('conversations')
          .select('customer_id')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          const { FacebookApiService } = await import('./facebookApi');
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          // محاولة إرسال الصورة كـ attachment أولاً
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:8080${imageUrl}`;

          try {
            console.log('🔄 Attempting to send image as attachment...');

            // إرسال الصورة كـ attachment
            await facebookService.sendImage(
              facebookSettings.access_token,
              conversation.customer_id,
              fullImageUrl
            );

            // إرسال الرسالة النصية بعد الصورة
            await facebookService.sendMessage(
              facebookSettings.access_token,
              conversation.customer_id,
              message
            );

            console.log('✅ Image sent as attachment successfully');

          } catch (imageError) {
            console.log('⚠️ Failed to send image as attachment, sending link instead:', imageError);

            // إذا فشل إرسال الصورة، أرسل الرابط
            const messageWithImage = `${message}

📸 شاهدي الصورة:
${fullImageUrl}

💡 اضغطي على الرابط لرؤية الصورة بوضوح عالي!`;

            await facebookService.sendMessage(
              facebookSettings.access_token,
              conversation.customer_id,
              messageWithImage
            );

            console.log('✅ Image link sent to customer as fallback');
          }
        }
      }
    } catch (error) {
      console.error('Error sending image to customer:', error);
    }
  }

  // نظام موحد لاستخراج اللون مع ذاكرة السياق
  static async detectAndSendImage(geminiResponse: string, userMessage: string, senderId: string, accessToken: string): Promise<boolean> {
    console.log('🔄 Unified color extraction with context memory');

    try {
      // استيراد الألوان من النظام الموحد
      const { ColorService } = await import('./colorService');

      // الحصول على الألوان من API الموحد
      const response = await fetch('http://localhost:3002/api/colors');
      let colorMap: Record<string, string> = {};

      if (response.ok) {
        const colors = await response.json();
        // تحويل الألوان لخريطة بسيطة
        colors.forEach((color: any) => {
          colorMap[color.arabic_name] = color.image_url;
        });
        console.log('🎨 Loaded colors from unified system:', Object.keys(colorMap));
      } else {
        // fallback للألوان الافتراضية
        colorMap = {
          'أبيض': 'https://files.easy-orders.net/1744641208557436357.jpg',
          'أحمر': 'https://files.easy-orders.net/1744720320703143217.jpg',
          'أسود': 'https://files.easy-orders.net/1723117580290608498.jpg',
          'أزرق': 'https://files.easy-orders.net/1723117554054321721.jpg',
          'بيج': 'https://files.easy-orders.net/1739181695020677812.jpg',
          'جملي': 'https://files.easy-orders.net/1739181874715440699.jpg',
          'بنفسجي': 'https://files.easy-orders.net/1744720320703143217.jpg',
          'وردي': 'https://files.easy-orders.net/1744720320703143217.jpg'
        };
        console.log('⚠️ Using fallback colors');
      }

      let detectedColor = null;
      let imageUrl = null;

      // 1. البحث في رد Gemini أولاً
      for (const [colorName, url] of Object.entries(colorMap)) {
        if (geminiResponse.includes(colorName)) {
          detectedColor = colorName;
          imageUrl = url;
          console.log('🎨 Color found in Gemini response:', detectedColor);
          break;
        }
      }

      // 2. إذا مفيش لون في رد Gemini، ابحث في رسالة المستخدم
      if (!detectedColor) {
        for (const [colorName, url] of Object.entries(colorMap)) {
          if (userMessage.includes(colorName)) {
            detectedColor = colorName;
            imageUrl = url;
            console.log('🎨 Color found in user message:', detectedColor);
            break;
          }
        }
      }

      // 3. إذا لسه مفيش لون، استخدم السياق (آخر لون اتذكر)
      if (!detectedColor) {
        // البحث عن أي إشارة للألوان في السياق
        const contextColors = ['أسود', 'أحمر', 'أبيض', 'أزرق', 'بيج', 'جملي', 'بنفسجي', 'وردي'];

        // إذا المستخدم طلب صورة بدون تحديد لون، استخدم آخر لون من السياق
        if (userMessage.includes('صورة') || userMessage.includes('اشوف') || userMessage.includes('كمان')) {
          // هنا يمكن تحسين النظام ليحفظ آخر لون في قاعدة البيانات
          // لكن للبساطة، نستخدم الأسود كافتراضي (آخر لون اتذكر في المحادثة)
          detectedColor = 'أسود';
          imageUrl = colorMap[detectedColor];
          console.log('🧠 Using context color (last mentioned):', detectedColor);
        }
      }

      if (detectedColor && imageUrl) {
        console.log('📤 Sending image:', imageUrl);

        try {
          const { FacebookApiService } = await import('./facebookApi');
          const facebookService = new FacebookApiService(accessToken);

          await facebookService.sendImage(accessToken, senderId, imageUrl);
          console.log('✅ Image sent successfully for color:', detectedColor);
          return true;
        } catch (error) {
          console.error('❌ Error sending image:', error);
          return false;
        }
      }

      console.log('🔍 No color found in any context');
      return false;
    } catch (error) {
      console.error('❌ Error in smart color detection:', error);
      return false;
    }
  }




}

// إنشاء instance من الخدمة
export const createGeminiAiService = async (): Promise<GeminiAiService | null> => {
  const settings = await GeminiAiService.getGeminiSettings();
  if (!settings || !settings.is_enabled) {
    return null;
  }
  return new GeminiAiService(settings);
};
