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
      // أولاً: محاولة الحصول على السجل الموجود
      const { data: existingSettings } = await supabase
        .from('gemini_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSettings) {
        // تحديث السجل الموجود
        const { error } = await supabase
          .from('gemini_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        if (error) {
          throw error;
        }
        console.log('✅ Gemini settings updated successfully');
      } else {
        // إنشاء سجل جديد
        const { error } = await supabase
          .from('gemini_settings')
          .insert({
            ...settings,
            updated_at: new Date().toISOString()
          });

        if (error) {
          throw error;
        }
        console.log('✅ Gemini settings created successfully');
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

      // 🧠 نظام سياق ذكي محسن
      const contextData = await this.buildEnhancedContext(conversationId, userMessage);

      let conversationHistory = contextData.recentMessages;

      // إضافة السياق المحسن
      if (contextData.contextSummary) {
        conversationHistory.unshift(contextData.contextSummary);
        console.log('🧠 Enhanced context added:', contextData.contextSummary);
      }

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

      // إرسال الرد عبر Facebook - الحصول على إعدادات الصفحة الصحيحة
      console.log('🔍 About to get Facebook settings...');

      // الحصول على customer_id من المحادثة
      const { data: conversation } = await supabase
        .from('conversations')
        .select('customer_facebook_id')
        .eq('id', conversationId)
        .single();

      let facebookSettings = null;

      // الحصول على إعدادات الصفحة الصحيحة بناءً على المحادثة
      console.log('🔍 Getting correct page settings for conversation...');
      const { FacebookApiService } = await import('./facebookApi');

      // أولاً: محاولة الحصول على page_id من المحادثة
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('facebook_page_id')
        .eq('id', conversationId)
        .single();

      if (conversationData?.facebook_page_id) {
        console.log('🔍 Found page_id from conversation:', conversationData.facebook_page_id);
        facebookSettings = await FacebookApiService.getPageSettings(conversationData.facebook_page_id);
      }

      // إذا لم نجد إعدادات، جرب كل الصفحات المتاحة
      if (!facebookSettings) {
        console.log('🔍 Trying all available pages...');
        const { data: allPages } = await supabase
          .from('facebook_pages')
          .select('*')
          .eq('is_active', true);

        if (allPages && allPages.length > 0) {
          // جرب كل صفحة حتى نجد واحدة تعمل
          for (const page of allPages) {
            try {
              console.log(`🔍 Trying page: ${page.page_name} (${page.page_id})`);
              facebookSettings = await FacebookApiService.getPageSettings(page.page_id);
              if (facebookSettings) {
                console.log(`✅ Found working page: ${page.page_name}`);
                break;
              }
            } catch (error) {
              console.log(`❌ Page ${page.page_name} failed:`, error);
              continue;
            }
          }
        }
      }

      console.log('🔍 Facebook settings result:', !!facebookSettings);
      if (facebookSettings) {
        console.log('🔍 Page settings details:', {
          page_id: facebookSettings.page_id,
          page_name: facebookSettings.page_name,
          tokenPrefix: facebookSettings.access_token ? facebookSettings.access_token.substring(0, 10) + '...' : 'null'
        });
      }

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

        // 🧹 تنظيف شامل ومتقدم للنص من التعليمات التقنية
        let cleanResponse = geminiResponse.response;

        console.log('🔍 Original response before cleaning:', cleanResponse);

        // إزالة كل شيء بعد أول نص تقني
        cleanResponse = cleanResponse
          // إزالة كل شيء بعد أول تعليمة تقنية
          .replace(/\([^)]*هتبعث[\s\S]*/gi, '')
          .replace(/\([^)]*هتبعتي[\s\S]*/gi, '')

          // إزالة النصوص التقنية بين الأقواس
          .replace(/\*\*\([^)]*هتبعث[\s\S]*/gi, '')
          .replace(/\*\*\([^)]*هتبعتي[\s\S]*/gi, '')

          // إزالة كل شيء بعد "مثال على التعليق"
          .replace(/مثال على التعليق[\s\S]*/gi, '')

          // إزالة كل شيء بعد "بعد إرسال كل الصور"
          .replace(/بعد إرسال كل الصور[\s\S]*/gi, '')

          // إزالة التعليمات المفصلة للصور
          .replace(/\* \*\*صورة[\s\S]*/gi, '')
          .replace(/\*\*صورة[\s\S]*/gi, '')

          // إزالة النصوص بين الأقواس المربعة
          .replace(/\[هنا[^\]]*\]/gi, '')
          .replace(/\[يجب[^\]]*\]/gi, '')
          .replace(/\[إرفاق[^\]]*\]/gi, '')
          .replace(/\[ضعي[^\]]*\]/gi, '')
          .replace(/\[أضف[^\]]*\]/gi, '')

          // تنظيف الأسطر الفارغة المتعددة
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        // إذا كان النص لسه طويل، اقطعه عند أول جملة كاملة
        if (cleanResponse.length > 200) {
          // البحث عن أول جملة كاملة تنتهي بعلامة استفهام أو تعجب أو نقطة
          const sentences = cleanResponse.split(/[.!؟😉😍🥰💖✨🔥💙🖤🤍]/);
          if (sentences.length > 1) {
            // أخذ أول جملة أو جملتين
            cleanResponse = sentences.slice(0, 2).join('') + ' 😍';
          }
        }

        console.log('🧹 Cleaned response:', cleanResponse);

        // إرسال النص المنظف
        if (cleanResponse) {
          await facebookService.sendMessage(
            facebookSettings.access_token,
            senderId,
            cleanResponse
          );
        }

        // حفظ الرد في قاعدة البيانات
        // لا نحفظ image_url هنا لأن الصور بتتحفظ منفصلة في detectAndSendImage
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
            image_url: null // الصور بتتحفظ منفصلة
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
      const { data: conversation } = await supabase
        .from('conversations')
        .select('customer_facebook_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        // الحصول على إعدادات الصفحة الصحيحة
        const { FacebookApiService } = await import('./facebookApi');
        let facebookSettings = null;

        // محاولة الحصول على page_id من المحادثة
        const { data: conversationData } = await supabase
          .from('conversations')
          .select('facebook_page_id')
          .eq('id', conversationId)
          .single();

        if (conversationData?.facebook_page_id) {
          facebookSettings = await FacebookApiService.getPageSettings(conversationData.facebook_page_id);
        }

        // إذا لم نجد إعدادات، جرب كل الصفحات المتاحة
        if (!facebookSettings) {
          const { data: allPages } = await supabase
            .from('facebook_pages')
            .select('*')
            .eq('is_active', true);

          if (allPages && allPages.length > 0) {
            for (const page of allPages) {
              try {
                facebookSettings = await FacebookApiService.getPageSettings(page.page_id);
                if (facebookSettings) break;
              } catch (error) {
                continue;
              }
            }
          }
        }

        if (facebookSettings) {
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          await facebookService.sendMessage(
            facebookSettings.access_token,
            conversation.customer_facebook_id,
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
      const { data: conversation } = await supabase
        .from('conversations')
        .select('customer_facebook_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        // الحصول على إعدادات الصفحة الصحيحة
        const { FacebookApiService } = await import('./facebookApi');
        let facebookSettings = await this.getCorrectPageSettings(conversationId);

        if (facebookSettings) {
          const facebookService = new FacebookApiService(facebookSettings.access_token);

          await facebookService.sendMessage(
            facebookSettings.access_token,
            conversation.customer_facebook_id,
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
      // حفظ الرسالة في قاعدة البيانات مع رابط الصورة الصحيح
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: message,
          sender_type: 'bot',
          is_read: true,
          is_auto_reply: true,
          is_ai_generated: false,
          image_url: imageUrl // حفظ رابط الصورة الفعلي
        });

      // إرسال عبر Facebook
      const { data: conversation } = await supabase
        .from('conversations')
        .select('customer_facebook_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        // الحصول على إعدادات الصفحة الصحيحة
        const { FacebookApiService } = await import('./facebookApi');
        let facebookSettings = await this.getCorrectPageSettings(conversationId);

        if (facebookSettings) {
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
              conversation.customer_facebook_id,
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
              conversation.customer_facebook_id,
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

  // 🧠 بناء سياق محسن للمحادثة
  static async buildEnhancedContext(conversationId: string, currentMessage: string) {
    try {
      // الحصول على المزيد من الرسائل (10 بدلاً من 5)
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedMessages = recentMessages
        ?.reverse()
        .map(msg => `${msg.sender_type === 'customer' ? 'العميل' : 'المتجر'}: ${msg.content}`) || [];

      // تحليل معلومات العميل
      const customerInfo = await OrderService.analyzeConversationForOrder(conversationId);

      // تحليل حالة المحادثة
      const conversationState = this.analyzeConversationState(recentMessages, currentMessage);

      // تحليل اهتمامات العميل
      const customerInterests = this.analyzeCustomerInterests(recentMessages);

      // بناء ملخص السياق الذكي
      const contextParts = [];

      // معلومات العميل
      if (customerInfo) {
        const infoSummary = [];
        if (customerInfo.name) infoSummary.push(`الاسم: ${customerInfo.name}`);
        if (customerInfo.phone) infoSummary.push(`الهاتف: ${customerInfo.phone}`);
        if (customerInfo.address) infoSummary.push(`العنوان: ${customerInfo.address}`);
        if (customerInfo.size) infoSummary.push(`المقاس: ${customerInfo.size}`);
        if (customerInfo.color) infoSummary.push(`اللون المطلوب: ${customerInfo.color}`);

        if (infoSummary.length > 0) {
          contextParts.push(`معلومات العميل: ${infoSummary.join(', ')}`);
        }
      }

      // حالة المحادثة
      if (conversationState.mood !== 'neutral') {
        contextParts.push(`مزاج العميل: ${conversationState.mood}`);
      }

      if (conversationState.stage !== 'unknown') {
        contextParts.push(`مرحلة المحادثة: ${conversationState.stage}`);
      }

      // اهتمامات العميل
      if (customerInterests.preferredColors.length > 0) {
        contextParts.push(`الألوان المفضلة: ${customerInterests.preferredColors.join(', ')}`);
      }

      if (customerInterests.inquiredProducts.length > 0) {
        contextParts.push(`المنتجات المستفسر عنها: ${customerInterests.inquiredProducts.join(', ')}`);
      }

      // تحذيرات خاصة
      if (conversationState.warnings.length > 0) {
        contextParts.push(`تحذيرات: ${conversationState.warnings.join(', ')}`);
      }

      const contextSummary = contextParts.length > 0
        ? `🧠 سياق المحادثة: ${contextParts.join(' | ')}`
        : null;

      return {
        recentMessages: formattedMessages,
        contextSummary,
        conversationState,
        customerInterests,
        customerInfo
      };

    } catch (error) {
      console.error('Error building enhanced context:', error);
      return {
        recentMessages: [],
        contextSummary: null,
        conversationState: { mood: 'neutral', stage: 'unknown', warnings: [] },
        customerInterests: { preferredColors: [], inquiredProducts: [] },
        customerInfo: null
      };
    }
  }

  // تحليل حالة المحادثة
  static analyzeConversationState(messages: any[], currentMessage: string) {
    const allText = messages?.map(m => m.content).join(' ') + ' ' + currentMessage;

    // تحليل المزاج
    let mood = 'neutral';
    if (allText.includes('زعلان') || allText.includes('زفت') || allText.includes('مش عايز') || allText.includes('مش كويس')) {
      mood = 'upset';
    } else if (allText.includes('حلو') || allText.includes('جميل') || allText.includes('عجبني') || allText.includes('ممتاز')) {
      mood = 'happy';
    } else if (allText.includes('مش متأكد') || allText.includes('مش عارف') || allText.includes('ممكن')) {
      mood = 'uncertain';
    }

    // تحليل مرحلة المحادثة
    let stage = 'unknown';
    if (allText.includes('عايز اشتري') || allText.includes('عايز اطلب') || allText.includes('هاخد')) {
      stage = 'ready_to_buy';
    } else if (allText.includes('عايز اشوف') || allText.includes('ممكن اشوف') || allText.includes('ابعتي')) {
      stage = 'browsing';
    } else if (allText.includes('اسم') && allText.includes('عنوان') && allText.includes('تليفون')) {
      stage = 'providing_info';
    } else if (allText.includes('تأكيد') || allText.includes('موافق') || allText.includes('اه كده')) {
      stage = 'confirming';
    }

    // تحذيرات
    const warnings = [];
    if (allText.includes('بعت كل حاجه') || allText.includes('قلتلك') || allText.includes('ما بعتلك')) {
      warnings.push('العميل يشعر بالتكرار');
    }
    if (allText.includes('مش فاهم') || allText.includes('ايه ده')) {
      warnings.push('العميل محتاج توضيح');
    }

    return { mood, stage, warnings };
  }

  // تحليل اهتمامات العميل
  static analyzeCustomerInterests(messages: any[]) {
    const allText = messages?.map(m => m.content).join(' ') || '';

    // الألوان المذكورة
    const preferredColors = [];
    const colors = ['أحمر', 'أسود', 'أبيض', 'أزرق', 'جملي', 'بيج', 'وردي', 'بنفسجي'];
    colors.forEach(color => {
      if (allText.includes(color)) {
        preferredColors.push(color);
      }
    });

    // المنتجات المذكورة
    const inquiredProducts = [];
    const products = ['كوتشي', 'حذاء', 'شوز', 'سنيكرز'];
    products.forEach(product => {
      if (allText.includes(product)) {
        inquiredProducts.push(product);
      }
    });

    return { preferredColors, inquiredProducts };
  }

  // 🖼️ نظام إرسال صور متعددة ذكي
  static async detectAndSendImage(geminiResponse: string, userMessage: string, senderId: string, accessToken: string): Promise<boolean> {
    console.log('🔄 Multi-image smart detection system');

    try {
      // الحصول على الألوان من API الموحد
      const response = await fetch('http://localhost:3002/api/colors');
      let colorMap: Record<string, string> = {};

      if (response.ok) {
        const colors = await response.json();
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
          'جملي': 'https://files.easy-orders.net/1739181874715440699.jpg'
        };
        console.log('⚠️ Using fallback colors');
      }

      // 🔍 البحث عن جميع الألوان المذكورة
      const detectedColors: Array<{name: string, url: string, source: string}> = [];

      // 1. البحث في رد Gemini
      for (const [colorName, url] of Object.entries(colorMap)) {
        if (geminiResponse.includes(colorName)) {
          detectedColors.push({
            name: colorName,
            url: url,
            source: 'gemini_response'
          });
          console.log('🎨 Color found in Gemini response:', colorName);
        }
      }

      // 2. البحث في رسالة المستخدم
      for (const [colorName, url] of Object.entries(colorMap)) {
        if (userMessage.includes(colorName)) {
          // تجنب التكرار
          const alreadyDetected = detectedColors.some(c => c.name === colorName);
          if (!alreadyDetected) {
            detectedColors.push({
              name: colorName,
              url: url,
              source: 'user_message'
            });
            console.log('🎨 Color found in user message:', colorName);
          }
        }
      }

      // 3. التعامل مع طلبات خاصة - تحسين دقة الكشف
      const isMultipleRequest = userMessage.includes('كل الألوان') ||
                               userMessage.includes('كل الالوان') ||
                               userMessage.includes('كل اللي عندك') ||
                               userMessage.includes('شوفيني كل حاجه') ||
                               userMessage.includes('كل المتاح') ||
                               userMessage.includes('ابعتي ليا كل') ||
                               userMessage.includes('عايز اشوف كل الالوان') ||  // ✅ أكثر دقة
                               userMessage.includes('عايز اشوف كل الألوان') ||  // ✅ أكثر دقة
                               userMessage.includes('وريني كل الالوان') ||     // ✅ أكثر دقة
                               userMessage.includes('وريني كل الألوان');      // ✅ أكثر دقة

      const isComparisonRequest = userMessage.includes('والاحمر والاسود') ||
                                 userMessage.includes('الأحمر والأزرق') ||
                                 userMessage.includes('عايز اقارن') ||
                                 userMessage.includes('ايه الفرق');

      // 4. إذا طلب كل الألوان
      if (isMultipleRequest) {
        console.log('🌈 Multiple colors requested, sending all available');
        detectedColors.length = 0; // مسح أي ألوان مكتشفة مسبقاً
        for (const [colorName, url] of Object.entries(colorMap)) {
          detectedColors.push({
            name: colorName,
            url: url,
            source: 'all_colors_request'
          });
        }
      }

      // 5. إذا لم يجد ألوان، استخدم السياق أو أعلم العميل
      if (detectedColors.length === 0) {
        if (userMessage.includes('صورة') || userMessage.includes('اشوف') || userMessage.includes('كمان')) {
          // البحث عن أي لون مذكور في رسالة المستخدم حتى لو غير متاح
          const mentionedColors = ['أخضر', 'وردي', 'ذهبي', 'فضي', 'برتقالي', 'بنفسجي'];
          let unavailableColor = null;

          for (const color of mentionedColors) {
            if (userMessage.includes(color)) {
              unavailableColor = color;
              break;
            }
          }

          if (unavailableColor) {
            console.log(`❌ Unavailable color requested: ${unavailableColor}`);
            // لا نرسل صورة، Gemini سيتعامل مع الرد
            return false;
          } else {
            // استخدام fallback فقط إذا لم يطلب لون محدد
            detectedColors.push({
              name: 'أسود',
              url: colorMap['أسود'],
              source: 'context_fallback'
            });
            console.log('🧠 Using context fallback color: أسود');
          }
        }
      }

      // 🚀 إرسال الصور
      if (detectedColors.length > 0) {
        console.log(`📤 Sending ${detectedColors.length} image(s):`, detectedColors.map(c => c.name));

        const { FacebookApiService } = await import('./facebookApi');
        const facebookService = new FacebookApiService(accessToken);

        let successCount = 0;
        const maxImages = 5; // حد أقصى 5 صور لتجنب spam

        // إرسال الصور مع تأخير بسيط بينها
        for (let i = 0; i < Math.min(detectedColors.length, maxImages); i++) {
          const color = detectedColors[i];

          try {
            await facebookService.sendImage(accessToken, senderId, color.url);
            console.log(`✅ Image ${i + 1}/${Math.min(detectedColors.length, maxImages)} sent successfully: ${color.name}`);
            successCount++;

            // حفظ الصورة في قاعدة البيانات
            try {
              // الحصول على conversation_id من senderId
              const { data: conversation } = await supabase
                .from('conversations')
                .select('id')
                .eq('customer_facebook_id', senderId)
                .single();

              if (conversation) {
                await supabase
                  .from('messages')
                  .insert({
                    conversation_id: conversation.id,
                    content: `صورة ${color.name}`,
                    sender_type: 'bot',
                    is_read: true,
                    is_auto_reply: true,
                    is_ai_generated: false,
                    image_url: color.url
                  });
                console.log(`💾 Image message saved for ${color.name}`);
              }
            } catch (dbError) {
              console.error(`❌ Error saving image message for ${color.name}:`, dbError);
            }

            // تأخير بسيط بين الصور (500ms)
            if (i < Math.min(detectedColors.length, maxImages) - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`❌ Error sending image for ${color.name}:`, error);
          }
        }

        // لا نرسل رسالة ملخص إضافية لأن Gemini بيرد رد كافي
        console.log(`📝 ${successCount} images sent successfully, Gemini response covers the summary`);

        // فقط لو Gemini مرد رد، نرسل رسالة ملخص بسيطة
        // لكن في الحالة دي Gemini بيرد رد كافي فمش محتاجين رسالة إضافية

        return successCount > 0;
      }

      console.log('🔍 No colors found in any context');
      return false;
    } catch (error) {
      console.error('❌ Error in multi-image detection:', error);
      return false;
    }
  }

  // دالة مساعدة للحصول على إعدادات الصفحة الصحيحة
  static async getCorrectPageSettings(conversationId: string) {
    try {
      const { FacebookApiService } = await import('./facebookApi');

      // أولاً: محاولة الحصول على page_id من المحادثة
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('facebook_page_id')
        .eq('id', conversationId)
        .single();

      if (conversationData?.facebook_page_id) {
        console.log('🔍 Found page_id from conversation:', conversationData.facebook_page_id);
        const settings = await FacebookApiService.getPageSettings(conversationData.facebook_page_id);
        if (settings) return settings;
      }

      // إذا لم نجد إعدادات، جرب كل الصفحات المتاحة
      console.log('🔍 Trying all available pages...');
      const { data: allPages } = await supabase
        .from('facebook_pages')
        .select('*')
        .eq('is_active', true);

      if (allPages && allPages.length > 0) {
        for (const page of allPages) {
          try {
            console.log(`🔍 Trying page: ${page.page_name} (${page.page_id})`);
            const settings = await FacebookApiService.getPageSettings(page.page_id);
            if (settings) {
              console.log(`✅ Found working page: ${page.page_name}`);
              return settings;
            }
          } catch (error) {
            console.log(`❌ Page ${page.page_name} failed:`, error);
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting correct page settings:', error);
      return null;
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
