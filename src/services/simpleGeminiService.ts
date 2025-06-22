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

  // متغير لتتبع الرسائل المعالجة حديثاً
  private static recentlyProcessed = new Set<string>();

  // نظام Queue للرسائل المتتالية
  private static processingQueue = new Map<string, Promise<boolean>>();

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
      // إنشاء مفتاح فريد للمرسل (لضمان الترتيب)
      const senderKey = `${senderId}-${conversationId}`;
      const recentKey = `${senderId}-${userMessage}`;

      // فحص التكرار
      if (this.recentlyProcessed.has(recentKey)) {
        console.log('⚠️ [SIMPLE GEMINI] Duplicate message detected, skipping...');
        return true; // نعتبرها نجحت لتجنب الأخطاء
      }

      // إضافة للمعالجة الحديثة
      this.recentlyProcessed.add(recentKey);

      // إزالة بعد 30 ثانية لتجنب تراكم الذاكرة
      setTimeout(() => {
        this.recentlyProcessed.delete(recentKey);
      }, 30000);

      // فحص إذا كان هناك معالجة جارية لنفس المرسل
      if (this.processingQueue.has(senderKey)) {
        console.log('⏳ [SIMPLE GEMINI] Waiting for previous message to complete...');
        await this.processingQueue.get(senderKey);
      }

      // إنشاء promise للمعالجة الحالية
      const processingPromise = this.processMessageInternal(userMessage, conversationId, senderId, pageId);
      this.processingQueue.set(senderKey, processingPromise);

      // معالجة الرسالة
      const result = await processingPromise;

      // إزالة من Queue بعد الانتهاء
      this.processingQueue.delete(senderKey);

      return result;

    } catch (error) {
      console.error('❌ [SIMPLE GEMINI] Error:', error);
      return false;
    }
  }

  /**
   * المعالجة الداخلية للرسالة
   */
  private static async processMessageInternal(
    userMessage: string,
    conversationId: string,
    senderId: string,
    pageId?: string
  ): Promise<boolean> {
    try {

      console.log(`🤖 [SIMPLE GEMINI] Processing: "${userMessage}"`);

      // كتابة لوج مفصل لملف
      try {
        const fs = await import('fs');
        const logEntry = `\n${new Date().toISOString()} - Processing message: "${userMessage}" for conversation: ${conversationId}\n`;
        fs.appendFileSync('gemini-debug.log', logEntry);
      } catch (err) {
        console.error('Error writing to debug log:', err);
      }

      // حفظ رسالة المستخدم أولاً (للمحادثات المؤقتة والاختبار)
      if (conversationId.startsWith('temp_') || conversationId.startsWith('test-')) {
        console.log(`💾 [SIMPLE GEMINI] Saving user message to test_messages with conversation_id: "${conversationId}"`);
        await supabase.from('test_messages').insert({
          conversation_id: conversationId,
          content: userMessage,
          sender_type: 'user'
        });
      }

      // الحصول على إعدادات Gemini
      const settings = await this.getGeminiSettings();
      if (!settings || !settings.is_enabled) {
        console.log('❌ Gemini AI is not enabled');

        // كتابة لوج
        try {
          const fs = await import('fs');
          fs.appendFileSync('gemini-debug.log', `${new Date().toISOString()} - Gemini disabled or no settings\n`);
        } catch (err) {}

        return false;
      }

      // كتابة لوج
      try {
        const fs = await import('fs');
        fs.appendFileSync('gemini-debug.log', `${new Date().toISOString()} - Gemini settings loaded successfully\n`);
      } catch (err) {}

      // إنتاج الرد الذكي
      const response = await this.generateSmartResponse(userMessage, conversationId, settings);
      if (!response) {
        console.log('❌ Failed to generate response');
        return false;
      }

      // تم إزالة نظام الصور المعقد - سيتم استبداله بنظام موحد لاحقاً
      console.log(`📝 [SIMPLE GEMINI] Text response only: "${response}"`);

      // تنظيف الرد ومعالجة الأوامر وإرساله
      console.log(`🔍 [SIMPLE GEMINI] Raw response before cleaning: "${response}"`);
      console.log(`🔍 [SIMPLE GEMINI] Checking for SEND_IMAGE commands in response...`);

      // فحص مباشر لأوامر الصور
      const imageCommandRegex = /\[SEND_IMAGE:\s*([^\]]+)\]/gi;
      const imageMatches = [...response.matchAll(imageCommandRegex)];
      console.log(`🔍 [SIMPLE GEMINI] Found ${imageMatches.length} SEND_IMAGE commands:`, imageMatches.map(m => m[0]));

      // إزالة منطق الكلمات المفتاحية - الاعتماد على Gemini فقط

      const cleanResponse = await this.cleanResponse(response, conversationId);
      console.log(`🧹 [SIMPLE GEMINI] Clean response after processing: "${cleanResponse}"`);
      const sent = await this.sendResponse(conversationId, senderId, cleanResponse);

      console.log(`✅ [SIMPLE GEMINI] Message processed successfully`);
      return sent;

    } catch (error) {
      console.error('❌ [SIMPLE GEMINI] Error in processMessageInternal:', error);
      return false;
    }
  }

  /**
   * إنتاج رد ذكي من Gemini باستخدام النظام الهجين
   */
  private static async generateSmartResponse(
    userMessage: string,
    conversationId: string,
    settings: any
  ): Promise<string | null> {
    try {
      // بناء البرومت الهجين الذكي
      const prompt = await this.buildHybridPrompt(userMessage, conversationId, settings);

      // استدعاء Gemini API مع إعدادات محسنة
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: settings.temperature || 0.5,
              maxOutputTokens: Math.min(settings.max_tokens || 300, 300), // محدود للكفاءة
              topP: 0.9,
              topK: 20
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
   * بناء البرومت الهجين الذكي - النظام الجديد (مؤقت مع البرومت الموجود)
   */
  private static async buildHybridPrompt(userMessage: string, conversationId: string, settings: any): Promise<string> {
    // البرومت الأساسي - استخدام personality_prompt الذي يحتوي على قواعد الصور
    const basePrompt = settings.personality_prompt || settings.prompt_template || 'أنت مساعد ودود لمتجر سوان شوب.';

    // فحص إذا كان السؤال متعلق بالمنتجات
    const conversationHistory = await this.getConversationHistory(conversationId, userMessage);
    const isProductRelated = this.isProductRelated(userMessage, conversationHistory);

    let prompt = basePrompt;

    if (isProductRelated) {
      console.log('🛍️ [HYBRID] Product-related question detected, adding products info');

      // إضافة قواعد إرسال الصور من products_prompt
      console.log(`🔍 [HYBRID] Checking products_prompt:`, settings.products_prompt ? 'EXISTS' : 'NULL');
      if (settings.products_prompt) {
        prompt += `\n\n${settings.products_prompt}`;
        console.log(`✅ [HYBRID] Added products_prompt with image rules`);
      } else {
        console.log(`⚠️ [HYBRID] No products_prompt found, using personality_prompt only`);
        console.log(`🔍 [HYBRID] Settings object:`, JSON.stringify(settings, null, 2));
      }

      // إضافة المنتجات الفعلية من قاعدة البيانات مع ذكاء في الاختيار
      const productsInfo = await this.getBasicProductsInfo(userMessage);
      prompt += `\n\nالمنتجات المتوفرة حالياً:\n${productsInfo}`;

      // إضافة معلومات تفصيلية للمنتجات المطلوبة
      const specificProductInfo = await this.getRelevantProductInfo(userMessage);
      if (specificProductInfo) {
        prompt += `\n\nمعلومات تفصيلية:\n${specificProductInfo}`;
      }
    } else {
      console.log('💬 [HYBRID] General question, using base prompt only');
    }

    // إضافة تاريخ المحادثة (مختصر) - استبعاد الرسالة الحالية
    console.log(`🔍 [HYBRID] Looking for conversation history with conversation_id: "${conversationId}"`);
    console.log(`📜 [HYBRID] Conversation history (${conversationHistory.length} messages):`, conversationHistory);

    // إضافة log مفصل لفهم المشكلة
    if (conversationHistory.length === 0) {
      console.log(`⚠️ [HYBRID] No conversation history found! Checking database directly...`);
      // فحص مباشر لقاعدة البيانات
      const { data: directCheck } = await supabase
        .from('test_messages')
        .select('content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      console.log(`🔍 [HYBRID] Direct database check found ${directCheck?.length || 0} messages:`, directCheck);
    }

    if (conversationHistory.length > 0) {
      prompt += `\n\nتاريخ المحادثة الكامل:\n${conversationHistory.join('\n')}`;
      prompt += `\n\nملاحظة: هذا ليس أول تفاعل مع العميل، لا تكرر الترحيب إلا إذا كان ضرورياً.`;

      // تحليل السياق للطلبات
      const recentContext = conversationHistory.join(' ');
      if (recentContext.includes('عايز') || recentContext.includes('اطلب') || recentContext.includes('هاخد')) {
        prompt += `\n\nسياق الطلب: العميل في عملية طلب، تابع معه بذكاء وحدد ما يحتاجه لإكمال الطلب.`;
      }
    } else {
      prompt += `\n\nملاحظة: هذا أول تفاعل مع العميل، يمكنك الترحيب به.`;
    }

    // إضافة منطق ذكي للطلبات
    if (this.isOrderRequest(userMessage) || this.isOrderInProgress(conversationHistory)) {
      // تحليل البيانات المجمعة من المحادثة
      const orderData = this.extractOrderDataFromHistory(conversationHistory);

      prompt += `\n\nتعليمات خاصة للطلبات:
- إذا طلب العميل شراء منتج، اجمع البيانات التالية بالترتيب:
  1. نوع المنتج ولونه
  2. المقاس المطلوب (أرقام مثل 38، 39، 40، إلخ)
  3. اسم العميل الكامل
  4. رقم الهاتف
  5. العنوان بالتفصيل

البيانات المجمعة حتى الآن:
- المنتج: ${orderData.product || 'حذاء كاجوال جلد طبيعي'}
- اللون: ${orderData.color || 'لم يحدد بعد'}
- المقاس: ${orderData.size || 'لم يحدد بعد'}
- اسم العميل: ${orderData.customerName || 'لم يحدد بعد'}
- رقم الهاتف: ${orderData.phone || 'لم يحدد بعد'}
- العنوان: ${orderData.address || 'لم يحدد بعد'}

- انتبه: لا تسأل عن البيانات المجمعة مرة أخرى
- انتبه: الأرقام بعد ذكر المنتج واللون تعني المقاس وليس الكمية
- فقط عندما تحصل على كل البيانات، استخدم: [CREATE_ORDER: اسم المنتج - 1 - اسم العميل - رقم الهاتف - العنوان - المقاس - اللون]
- لا تنشئ طلب بدون بيانات كاملة`;
    }

    prompt += `\n\nرسالة العميل: ${userMessage}\nردك (بإيجاز):`;

    // طباعة إحصائيات للمراقبة
    const estimatedTokens = Math.ceil(prompt.length / 4);
    console.log(`📊 [HYBRID] Estimated tokens: ${estimatedTokens}, Product-related: ${isProductRelated}`);

    // طباعة الـ prompt الكامل للتحقق من قواعد الصور
    console.log(`🔍 [HYBRID] Full prompt being sent to Gemini:`);
    console.log(`=====================================`);
    console.log(prompt);
    console.log(`=====================================`);

    return prompt;
  }



  /**
   * فحص إذا كان السؤال متعلق بالمنتجات
   */
  private static isProductRelated(message: string, conversationHistory?: string[]): boolean {
    const productKeywords = [
      // أسئلة عامة عن المنتجات
      'منتجات', 'اشوف', 'عايزة', 'عايز', 'اشتري', 'شراء', 'طلب', 'سلة',

      // أسئلة عن الأسعار والتفاصيل
      'سعر', 'كام', 'فلوس', 'جنيه', 'تفاصيل', 'مواصفات', 'معلومات',

      // أنواع المنتجات
      'كوتشي', 'حذاء', 'فستان', 'بلوزة', 'شنطة', 'حقيبة', 'ساعة',

      // خصائص المنتجات
      'متوفر', 'مخزون', 'ألوان', 'مقاسات', 'تشكيلة', 'عرض', 'خصم', 'تخفيض',

      // أسئلة مباشرة عن المنتج المعروض
      'ده', 'دي', 'اللي في الصورة', 'المعروض', 'الإعلان',

      // كلمات الطلب والشراء
      'هاخد', 'هاخده', 'تمام هاخد', 'عايز اعمل طلب', 'اطلب', 'احجز'
    ];

    const lowerMessage = message.toLowerCase();

    // فحص مباشر للكلمات المفتاحية
    if (productKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }

    // فحص السياق - إذا كان هناك طلب جاري
    if (conversationHistory && conversationHistory.length > 0) {
      const recentContext = conversationHistory.join(' ').toLowerCase();
      const orderContext = [
        'عايز اطلب', 'عايزة اطلب', 'اعمل طلب', 'حذاء', 'لون', 'مقاس',
        'أسود', 'بني', 'كحلي', 'بيج', 'ألوان', 'مقاسات'
      ];

      if (orderContext.some(context => recentContext.includes(context))) {
        console.log(`🔍 [PRODUCT] Order context detected in conversation history`);

        // إذا كان السياق يشير لطلب، فحتى الأرقام تعتبر متعلقة بالمنتج (مقاسات)
        if (/^\d+$/.test(message.trim())) {
          console.log(`🔍 [PRODUCT] Number "${message}" detected as size in order context`);
          return true;
        }

        // أو إذا كانت رسالة تأكيد
        if (['تمام', 'حاضر', 'موافق', 'اوكي', 'ok', 'لا'].some(word => lowerMessage.includes(word))) {
          console.log(`🔍 [PRODUCT] Confirmation word "${message}" detected in order context`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * الحصول على معلومات المنتجات مع دعم المنتج الافتراضي
   */
  private static async getBasicProductsInfo(userMessage?: string): Promise<string> {
    try {
      // أولاً: تحديد إذا كان العميل يقصد المنتج الافتراضي
      const isDefaultProductQuery = this.isDefaultProductQuery(userMessage);

      if (isDefaultProductQuery) {
        return await this.getDefaultProductInfo();
      }

      // ثانياً: تحديد نوع المنتجات المطلوبة حسب رسالة العميل
      let categoryFilter = '';
      let searchTerm = '';

      if (userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // إذا ذكر نوع منتج محدد
        if (lowerMessage.includes('حذاء رياضي') || lowerMessage.includes('كوتشي رياضي')) {
          categoryFilter = 'أحذية';
          searchTerm = 'رياضي';
        }
        else if (lowerMessage.includes('حذاء') || lowerMessage.includes('كوتشي')) {
          categoryFilter = 'أحذية';
        }
        else if (lowerMessage.includes('فستان') || lowerMessage.includes('ملابس')) {
          categoryFilter = 'ملابس';
        }
        else if (lowerMessage.includes('شنطة') || lowerMessage.includes('حقيبة')) {
          categoryFilter = 'حقائب';
        }
      }

      // بناء الاستعلام
      let query = supabase
        .from('ecommerce_products')
        .select('*')
        .eq('status', 'active');

      if (categoryFilter) {
        query = query.ilike('category', `%${categoryFilter}%`);
        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }
        query = query.limit(5);
      } else {
        query = query.order('featured', { ascending: false }).limit(8);
      }

      const { data: products } = await query;

      // إذا كان هناك منتج واحد فقط، اعتبره الافتراضي
      if (products && products.length === 1 && !categoryFilter) {
        const product = products[0];
        const price = product.sale_price || product.price;
        const originalPrice = product.sale_price ?
          ` (بدلاً من ${product.price} ج)` : '';
        const discount = product.sale_price ?
          Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;

        let info = `🌟 **${product.name}** (المنتج الوحيد المتوفر)\n\n`;
        info += `💰 السعر: ${price} ج${originalPrice}\n`;
        if (discount > 0) {
          info += `🎯 خصم ${discount}% لفترة محدودة!\n`;
        }
        info += `📦 ${product.stock_quantity > 0 ?
          `متوفر (${product.stock_quantity} قطعة)` : 'نفد المخزون'}\n`;

        if (product.short_description) {
          info += `\n📝 ${product.short_description}\n`;
        }

        info += `\n🛒 للطلب: اطلب الآن وسنحتاج اسمك ورقم هاتفك والعنوان والمقاس واللون\n`;
        info += `📞 أو تواصل معنا: 01032792040`;

        return info;
      }

      if (products && products.length > 0) {
        let info = '';

        // عرض قائمة المنتجات (إزالة المتغير غير المعرف featuredOnly)
        info = `🛍️ ${categoryFilter ? `منتجات ${categoryFilter}` : 'منتجاتنا المتوفرة'}:\n\n`;

        products.forEach((product, index) => {
          const price = product.sale_price || product.price;
          const originalPrice = product.sale_price ? ` (بدلاً من ${product.price} ج)` : '';
          const stock = product.stock_quantity > 0 ? `✅ متوفر` : '❌ نفد المخزون';
          const featured = product.featured ? '⭐ ' : '';

          info += `${index + 1}. ${featured}${product.name}\n`;
          info += `   💰 ${price} ج${originalPrice}\n`;
          info += `   📦 ${stock}\n\n`;
        });

        info += `🌐 المتجر الكامل: /shop\n`;
        info += `🛒 للطلب المباشر اذكري اسم المنتج!`;

        return info;
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    }

    // البيانات الافتراضية إذا لم توجد منتجات
    return `🛍️ مرحباً بك في متجر سوان شوب!

نحن متجر إلكتروني متخصص في:
- 👠 الأحذية العصرية
- 👗 الملابس الأنيقة
- 👜 الحقائب والإكسسوارات

🌐 تصفح منتجاتنا على: /shop
📞 للاستفسار: 01032792040`;
  }

  /**
   * الحصول على تاريخ المحادثة (استبعاد الرسالة الحالية)
   */
  private static async getConversationHistory(conversationId: string, currentMessage?: string): Promise<string[]> {
    try {
      if (conversationId.startsWith('temp_') || conversationId.startsWith('test-')) {
        // للمحادثات المؤقتة والاختبار، استخدم test_messages
        console.log(`🔍 [HISTORY] Fetching from test_messages for conversation: ${conversationId}`);
        const { data: messages } = await supabase
          .from('test_messages')
          .select('content, sender_type')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
; // قراءة كل الرسائل بدون حد أقصى

        console.log(`📊 [HISTORY] Found ${messages?.length || 0} messages in test_messages`);
        if (!messages) return [];

        // استبعاد الرسالة الحالية فقط (آخر رسالة بنفس المحتوى)
        let filteredMessages = messages;
        if (currentMessage) {
          // البحث عن آخر رسالة بنفس المحتوى وحذفها فقط
          const lastIndex = messages.map(m => m.content).lastIndexOf(currentMessage);
          if (lastIndex !== -1) {
            filteredMessages = messages.filter((_, index) => index !== lastIndex);
          }
        }

        console.log(`🔍 [HISTORY] After filtering: ${filteredMessages.length} messages remaining`);

        return filteredMessages
          // قراءة كل الرسائل بدون تحديد
          .map(msg => {
            const sender = msg.sender_type === 'user' ? 'العميل' : 'المتجر';
            return `${sender}: ${msg.content}`;
          });
      }

      // للمحادثات الحقيقية
      const { data: messages } = await supabase
        .from('messages')
        .select('content, sender_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
; // قراءة كل الرسائل بدون حد أقصى

      if (!messages) return [];

      // استبعاد الرسالة الحالية إذا كانت موجودة
      const filteredMessages = currentMessage
        ? messages.filter(msg => msg.content !== currentMessage)
        : messages;

      return filteredMessages
        // قراءة كل الرسائل بدون تحديد
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
   * جلب معلومات المنتجات ذات الصلة بالرسالة
   */
  private static async getRelevantProductInfo(userMessage: string): Promise<string> {
    try {
      // البحث عن أسماء المنتجات في الرسالة
      const productKeywords = ['حذاء كاجوال جلد طبيعي', 'حذاء كاجوال', 'كاجوال', 'جلد طبيعي'];

      for (const keyword of productKeywords) {
        if (userMessage.includes(keyword)) {
          console.log(`🔍 [GEMINI] وجدت منتج مطلوب: ${keyword}`);
          const productInfo = await this.getProductInfo(keyword);
          if (productInfo) {
            return productInfo;
          }
        }
      }

      return '';
    } catch (error) {
      console.error('❌ [GEMINI] خطأ في جلب معلومات المنتجات ذات الصلة:', error);
      return '';
    }
  }

  /**
   * جلب معلومات المنتج الديناميكية من قاعدة البيانات
   */
  private static async getProductInfo(productName: string): Promise<string> {
    try {
      console.log(`🔍 [GEMINI] جلب معلومات المنتج: "${productName}"`);

      // البحث عن المنتج
      const { data: product, error: productError } = await supabase
        .from('ecommerce_products')
        .select('id, name, description, price, category')
        .ilike('name', `%${productName}%`)
        .single();

      if (productError || !product) {
        console.log(`⚠️ [GEMINI] لم يتم العثور على المنتج: ${productName}`);
        return '';
      }

      // جلب الألوان والمقاسات المتاحة فعلياً
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('color, size, price')
        .eq('product_id', product.id);

      if (variantsError || !variants || variants.length === 0) {
        console.log(`⚠️ [GEMINI] لا توجد متغيرات في جدول product_variants للمنتج: ${productName}`);
        console.log(`🔍 [GEMINI] محاولة استخراج المعلومات من وصف المنتج...`);

        // محاولة استخراج المعلومات من وصف المنتج
        const description = product.description || '';

        // استخراج الألوان من الوصف
        const colorsMatch = description.match(/متوفر بالألوان:\s*([^📏\n]+)/);
        const sizesMatch = description.match(/متوفر بالمقاسات:\s*([^\n]+)/);

        let dynamicInfo = `${product.name}\n${description}\n\n`;

        if (colorsMatch) {
          const colors = colorsMatch[1].split(',').map(c => c.trim()).filter(c => c);
          dynamicInfo += `🎨 الألوان المتاحة: ${colors.join(', ')}\n`;
          console.log(`✅ [GEMINI] استخرجت ${colors.length} لون من الوصف: ${colors.join(', ')}`);
        }

        if (sizesMatch) {
          const sizes = sizesMatch[1].split(',').map(s => s.trim()).filter(s => s);
          dynamicInfo += `📏 المقاسات المتاحة: ${sizes.join(', ')}\n`;
          console.log(`✅ [GEMINI] استخرجت ${sizes.length} مقاس من الوصف: ${sizes.join(', ')}`);
        }

        dynamicInfo += `💰 السعر: ${product.price} جنيه\n`;

        console.log(`✅ [GEMINI] تم بناء معلومات المنتج من الوصف`);
        return dynamicInfo;
      }

      // استخراج الألوان والمقاسات الفريدة
      const uniqueColors = [...new Set(variants.map(v => v.color))];
      const uniqueSizes = [...new Set(variants.map(v => v.size))].sort((a, b) => parseInt(a) - parseInt(b));
      const prices = [...new Set(variants.map(v => v.price))];

      // بناء معلومات ديناميكية
      let dynamicInfo = `${product.name}\n`;
      dynamicInfo += `${product.description}\n\n`;
      dynamicInfo += `🎨 الألوان المتاحة: ${uniqueColors.join(', ')}\n`;
      dynamicInfo += `📏 المقاسات المتاحة: ${uniqueSizes.join(', ')}\n`;

      if (prices.length === 1) {
        dynamicInfo += `💰 السعر: ${prices[0]} جنيه\n`;
      } else {
        dynamicInfo += `💰 الأسعار: من ${Math.min(...prices)} إلى ${Math.max(...prices)} جنيه\n`;
      }

      console.log(`✅ [GEMINI] تم جلب معلومات المنتج بنجاح`);
      return dynamicInfo;

    } catch (error) {
      console.error('❌ [GEMINI] خطأ في جلب معلومات المنتج:', error);
      return '';
    }
  }

  /**
   * البحث عن صور المنتجات في قاعدة البيانات
   */
  private static async findProductImages(searchQuery: string): Promise<string[]> {
    try {
      console.log(`🔍 [GEMINI] البحث عن صور المنتجات: "${searchQuery}"`);

      // أولاً: تحديد المنتج المطلوب - بحث مبسط ومباشر
      let targetProduct = null;

      // البحث الذكي حسب الكلمات المفتاحية
      console.log(`🔍 [GEMINI] البحث الذكي في المنتجات المتوفرة...`);

      const { data: allProducts, error: searchError } = await supabase
        .from('ecommerce_products')
        .select('id, name, category')
        .limit(10);

      if (!searchError && allProducts && allProducts.length > 0) {
        console.log(`📦 [GEMINI] المنتجات المتوفرة:`, allProducts.map(p => p.name));

        // البحث الذكي بالكلمات المفتاحية مع نظام نقاط
        const searchTerms = searchQuery.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        console.log(`🔍 [GEMINI] البحث عن: "${searchTerms}"`);

        for (const product of allProducts) {
          const productText = `${product.name} ${product.category}`.toLowerCase();
          let score = 0;

          // نقاط التطابق المباشر
          if (productText.includes(searchTerms)) {
            score += 100; // تطابق كامل
          }

          // نقاط الكلمات المفتاحية الرئيسية
          if (searchTerms.includes('حذاء') && productText.includes('حذاء')) {
            score += 50;
          }
          if (searchTerms.includes('فستان') && productText.includes('فستان')) {
            score += 50;
          }
          if (searchTerms.includes('حقيبة') && productText.includes('حقيبة')) {
            score += 50;
          }
          if (searchTerms.includes('تيشيرت') && productText.includes('تيشيرت')) {
            score += 50;
          }
          if (searchTerms.includes('كوتشي') && productText.includes('كوتشي')) {
            score += 50;
          }

          // نقاط الألوان
          const colors = ['أحمر', 'أسود', 'أبيض', 'أزرق', 'أخضر', 'بني', 'رمادي', 'بيج'];
          colors.forEach(color => {
            if (searchTerms.includes(color) && productText.includes(color)) {
              score += 30;
            }
          });

          // نقاط الفئات
          if (searchTerms.includes('رياضي') && productText.includes('رياضي')) {
            score += 25;
          }
          if (searchTerms.includes('كاجوال') && productText.includes('كاجوال')) {
            score += 25;
          }
          if (searchTerms.includes('كلاسيكي') && productText.includes('كلاسيكي')) {
            score += 25;
          }

          console.log(`📊 [GEMINI] ${product.name}: ${score} نقطة`);

          if (score > bestScore) {
            bestScore = score;
            bestMatch = product;
          }
        }

        if (bestMatch && bestScore > 0) {
          targetProduct = bestMatch;
          console.log(`🎯 [GEMINI] أفضل تطابق: ${bestMatch.name} (${bestScore} نقطة)`);
        }
      }

      // إذا لم نجد، جرب البحث العام
      if (!targetProduct) {
        console.log(`🔍 [GEMINI] البحث العام في جميع المنتجات...`);

        const { data: products, error } = await supabase
          .from('ecommerce_products')
          .select('id, name')
          .limit(5);

        console.log(`🔍 [GEMINI] جميع المنتجات المتوفرة:`, products);

        if (!error && products && products.length > 0) {
          // خذ أول منتج متوفر
          targetProduct = products[0];
          console.log(`✅ [GEMINI] استخدام أول منتج متوفر: ${targetProduct.name}`);
        }
      }



      // ثانياً: جلب صور المنتج المحدد
      let variants = [];
      let variantsError = null;

      if (targetProduct) {
        console.log(`🎯 [GEMINI] جلب صور المنتج المحدد: ${targetProduct.name}`);

        // جلب جميع متغيرات هذا المنتج فقط
        const { data: productVariants, error: productError } = await supabase
          .from('product_variants')
          .select('image_url, color, size, sku')
          .eq('product_id', targetProduct.id)
          .not('image_url', 'is', null)
          .order('color, size');

        console.log(`🔍 [GEMINI] نتيجة البحث في product_variants:`, {
          productVariants,
          productError,
          productId: targetProduct.id
        });

        if (productVariants && productVariants.length > 0) {
          variants = productVariants;

          const uniqueColors = [...new Set(variants.map(v => v.color))];
          console.log(`✅ [GEMINI] وجدت ${variants.length} متغير للمنتج "${targetProduct.name}"`);
          console.log(`🎨 [GEMINI] الألوان المتوفرة: ${uniqueColors.join(', ')}`);

          // تصفية حسب اللون المطلوب
          const searchLower = searchQuery.toLowerCase();
          const colorKeywords = ['أحمر', 'أسود', 'أبيض', 'بني', 'أزرق', 'أزرق داكن', 'أخضر', 'رمادي', 'بيج', 'وردي', 'بنفسجي'];
          const foundColors = colorKeywords.filter(color => searchLower.includes(color.toLowerCase()));

          if (foundColors.length > 0) {
            console.log(`🎨 [GEMINI] تصفية حسب الألوان المطلوبة: ${foundColors.join(', ')}`);

            const filteredVariants = variants.filter(variant => {
              const variantColor = variant.color.toLowerCase();
              return foundColors.some(color =>
                variantColor.includes(color.toLowerCase()) ||
                color.toLowerCase().includes(variantColor)
              );
            });

            if (filteredVariants.length > 0) {
              variants = filteredVariants;
              console.log(`✅ [GEMINI] بعد التصفية: ${variants.length} متغير`);
            } else {
              console.log(`⚠️ [GEMINI] لا توجد متغيرات بالألوان المطلوبة`);
              console.log(`🎨 [GEMINI] الألوان المتوفرة: ${uniqueColors.join(', ')}`);
              console.log(`💡 [GEMINI] سأستخدم صورة المنتج الأساسية بدلاً من ذلك`);

              // استخدم صورة المنتج الأساسية إذا لم توجد ألوان مطابقة
              const { data: productData, error: productImageError } = await supabase
                .from('ecommerce_products')
                .select('image_url, name')
                .eq('id', targetProduct.id)
                .single();

              if (!productImageError && productData?.image_url) {
                variants = [{
                  image_url: productData.image_url,
                  color: 'الأساسي',
                  size: '',
                  sku: 'main-product'
                }];
                console.log(`✅ [GEMINI] استخدام صورة المنتج الأساسية`);
              } else {
                // إذا لم توجد صورة أساسية، استخدم أول متغير متوفر
                variants = variants.slice(0, 1);
                console.log(`⚠️ [GEMINI] استخدام أول متغير متوفر`);
              }
            }
          } else {
            console.log(`🎨 [GEMINI] لم يتم تحديد لون معين، سأعرض أفضل 3 متغيرات`);
            // أخذ أول 3 متغيرات فقط لتجنب الإرسال المفرط
            variants = variants.slice(0, 3);
          }
        } else {
          console.log(`⚠️ [GEMINI] لا توجد متغيرات للمنتج "${targetProduct.name}" - استخدم صورة المنتج الأساسية`);

          // جلب صورة المنتج الأساسية
          const { data: productData, error: productImageError } = await supabase
            .from('ecommerce_products')
            .select('image_url, name')
            .eq('id', targetProduct.id)
            .single();

          if (!productImageError && productData?.image_url) {
            console.log(`✅ [GEMINI] وجدت صورة المنتج الأساسية: ${productData.name}`);
            variants = [{
              image_url: productData.image_url,
              color: 'الأساسي',
              size: '',
              sku: 'main-product'
            }];
          } else {
            // جرب البحث العام في جميع المتغيرات
            const { data: allVariants, error: allError } = await supabase
              .from('product_variants')
              .select('image_url, color, size, sku')
              .not('image_url', 'is', null)
              .limit(6);

            console.log(`🔍 [GEMINI] البحث العام في جميع المتغيرات:`, { allVariants, allError });

            if (allVariants && allVariants.length > 0) {
              variants = allVariants;
              console.log(`✅ [GEMINI] البحث العام - وجدت ${variants.length} صورة`);
            }
          }
        }

        variantsError = productError;
      } else {
        console.log(`❌ [GEMINI] لم أجد أي منتج - البحث العام في جميع الصور`);

        // البحث العام في جميع الصور
        const { data: allVariants, error: allError } = await supabase
          .from('product_variants')
          .select('image_url, color, size, sku')
          .not('image_url', 'is', null)
          .limit(6);

        console.log(`🔍 [GEMINI] البحث العام النهائي:`, { allVariants, allError });

        variants = allVariants || [];
        variantsError = allError;
        console.log(`✅ [GEMINI] البحث العام النهائي - وجدت ${variants.length} صورة`);
      }

      if (variantsError) {
        console.error('❌ [GEMINI] خطأ في البحث في جدول product_variants:', variantsError);
      }

      // جمع جميع الصور وإزالة المكررات
      const imageUrls: string[] = [];
      const seenUrls = new Set<string>();

      // إضافة صور المتغيرات
      if (variants && variants.length > 0) {
        variants.forEach(variant => {
          if (variant.image_url && !seenUrls.has(variant.image_url)) {
            imageUrls.push(variant.image_url);
            seenUrls.add(variant.image_url);
            console.log(`📸 [GEMINI] وجدت صورة متغير: ${variant.color} ${variant.size}`);
          }
        });
      }

      // تحديد عدد الصور المرسلة (حد أقصى 3 صور)
      const limitedImages = imageUrls.slice(0, 3);

      console.log(`✅ [GEMINI] تم العثور على ${imageUrls.length} صورة`);
      console.log(`📤 [GEMINI] سيتم إرسال: ${limitedImages.length} صورة`);

      return limitedImages;

    } catch (error) {
      console.error('❌ [GEMINI] خطأ في البحث عن الصور:', error);
      return [];
    }
  }

  /**
   * إرسال صور المنتجات للعميل
   */
  private static async sendProductImages(conversationId: string, imageUrls: string[], productName: string): Promise<boolean> {
    try {
      console.log(`📤 [GEMINI] إرسال ${imageUrls.length} صورة للمحادثة: ${conversationId}`);

      // فحص إذا كانت محادثة تجريبية
      if (conversationId.startsWith('temp_') || conversationId.startsWith('test-')) {
        console.log(`🧪 [GEMINI] محادثة تجريبية - حفظ الصور في test_messages`);

        // حفظ الصور كرسائل منفصلة في test_messages
        let successCount = 0;
        for (const imageUrl of imageUrls) {
          try {
            await supabase.from('test_messages').insert({
              conversation_id: conversationId,
              content: `📸 صورة ${productName}: ${imageUrl}`,
              sender_type: 'bot'
            });
            successCount++;
            console.log(`✅ [GEMINI] تم حفظ صورة في test_messages`);
          } catch (error) {
            console.error('❌ [GEMINI] خطأ في حفظ صورة:', error);
          }
        }

        console.log(`📊 [GEMINI] تم حفظ ${successCount}/${imageUrls.length} صورة في test_messages`);
        return successCount > 0;
      }

      // للمحادثات الحقيقية - الكود الأصلي
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('customer_facebook_id, facebook_page_id, customer_name')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        console.error('❌ [GEMINI] خطأ في جلب معلومات المحادثة:', convError);
        return false;
      }

      // الحصول على إعدادات Facebook
      const { data: facebookSettings, error: fbError } = await supabase
        .from('facebook_settings')
        .select('access_token')
        .eq('page_id', conversation.facebook_page_id)
        .single();

      if (fbError || !facebookSettings) {
        console.error('❌ [GEMINI] خطأ في جلب إعدادات Facebook:', fbError);
        return false;
      }

      // إرسال كل صورة عبر Facebook
      let successCount = 0;
      for (const imageUrl of imageUrls) {
        try {
          console.log(`📸 [GEMINI] إرسال صورة: ${imageUrl.substring(0, 50)}...`);

          const response = await fetch('/api/facebook/send-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: facebookSettings.access_token,
              recipient_id: conversation.customer_facebook_id,
              image_url: imageUrl
            })
          });

          if (response.ok) {
            successCount++;
            console.log(`✅ [GEMINI] تم إرسال الصورة بنجاح`);
          } else {
            console.error(`❌ [GEMINI] فشل في إرسال الصورة:`, response.status);
          }

          // تأخير قصير بين الصور لتجنب Rate Limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error('❌ [GEMINI] خطأ في إرسال صورة واحدة:', error);
        }
      }

      console.log(`📊 [GEMINI] تم إرسال ${successCount}/${imageUrls.length} صورة بنجاح`);
      return successCount > 0;

    } catch (error) {
      console.error('❌ [GEMINI] خطأ في إرسال الصور:', error);
      return false;
    }
  }

  /**
   * معالجة أوامر إرسال الصور
   */
  private static async processImageCommands(response: string, conversationId: string): Promise<string> {
    try {
      console.log(`🔍 [GEMINI] Processing image commands in response: "${response.substring(0, 200)}..."`);

      // البحث عن أوامر إرسال الصور
      const imageCommandRegex = /\[SEND_IMAGE:\s*([^\]]+)\]/gi;
      const matches = [...response.matchAll(imageCommandRegex)];

      console.log(`🔍 [GEMINI] Found ${matches.length} image command matches`);

      if (matches.length === 0) {
        console.log(`⚠️ [GEMINI] No image commands found in response`);
        return response;
      }

      console.log(`📸 [GEMINI] وجدت ${matches.length} أمر إرسال صورة`);

      for (const match of matches) {
        const fullCommand = match[0];
        const searchQuery = match[1].trim();

        console.log(`🔍 [GEMINI] معالجة أمر: ${fullCommand}`);

        // البحث عن الصور
        const imageUrls = await this.findProductImages(searchQuery);

        if (imageUrls.length > 0) {
          // إرسال الصور
          const success = await this.sendProductImages(conversationId, imageUrls, searchQuery);

          if (success) {
            // استبدال الأمر برسالة نجاح
            response = response.replace(fullCommand, `✅ تم إرسال صور ${searchQuery}`);
          } else {
            // استبدال الأمر برسالة فشل
            response = response.replace(fullCommand, `❌ فشل في إرسال صور ${searchQuery}`);
          }
        } else {
          // لا توجد صور
          response = response.replace(fullCommand, `⚠️ لا توجد صور متاحة لـ ${searchQuery}`);
        }
      }

      return response;

    } catch (error) {
      console.error('❌ [GEMINI] خطأ في معالجة أوامر الصور:', error);
      return response.replace(/\[SEND_IMAGE:[^\]]*\]/gi, '❌ خطأ في إرسال الصورة');
    }
  }

  /**
   * تنظيف الرد من الإشارات التقنية ومعالجة الأوامر
   */
  private static async cleanResponse(response: string, conversationId: string): Promise<string> {
    // معالجة أوامر إضافة للسلة
    response = this.processCartCommands(response);

    // معالجة أوامر الطلب المباشر
    response = await this.processDirectOrderCommands(response, conversationId);

    // معالجة أوامر إرسال الصور
    response = await this.processImageCommands(response, conversationId);

    return response
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * معالجة أوامر إضافة للسلة
   */
  private static processCartCommands(response: string): string {
    const cartRegex = /\[ADD_TO_CART:\s*([^\]]+)\]/gi;
    return response.replace(cartRegex, (match, productName) => {
      console.log(`🛒 [CART] Processing add to cart: ${productName}`);
      // هنا يمكن إضافة منطق إضافة للسلة تلقائياً
      return `✅ تم إضافة "${productName}" للسلة`;
    });
  }

  /**
   * معالجة أوامر الطلب المباشر
   */
  private static async processDirectOrderCommands(response: string, conversationId: string): Promise<string> {
    const orderRegex = /\[CREATE_ORDER:\s*([^\]]+)\]/gi;
    let processedResponse = response;

    const matches = [...response.matchAll(orderRegex)];

    for (const match of matches) {
      const orderDetails = match[1];
      console.log(`📦 [ORDER] Processing direct order: ${orderDetails}`);

      try {
        // إنشاء الطلب الحقيقي
        const orderResult = await this.createDirectOrder(orderDetails, conversationId);

        if (orderResult.success) {
          const replacement = `🎉 تم إنشاء طلبك بنجاح!
📋 رقم الطلب: ${orderResult.orderNumber}
📞 سيتم التواصل معك خلال ساعة لتأكيد الطلب
💰 المبلغ الإجمالي: ${orderResult.total} جنيه`;

          processedResponse = processedResponse.replace(match[0], replacement);
        } else {
          const replacement = `❌ عذراً، حدث خطأ في إنشاء الطلب. يرجى التواصل معنا على 01032792040`;
          processedResponse = processedResponse.replace(match[0], replacement);
        }
      } catch (error) {
        console.error('❌ Error creating direct order:', error);
        const replacement = `❌ عذراً، حدث خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى`;
        processedResponse = processedResponse.replace(match[0], replacement);
      }
    }

    return processedResponse;
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

  // متغير لتتبع الردود المرسلة حديثاً
  private static recentlySent = new Set<string>();

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
      // إنشاء مفتاح فريد للرد
      const responseKey = `${conversationId}-${senderId}-${message.substring(0, 50)}`;

      // فحص التكرار
      if (this.recentlySent.has(responseKey)) {
        console.log('⚠️ [SIMPLE GEMINI] Duplicate response detected, skipping send...');
        return true;
      }

      // إضافة للردود الحديثة
      this.recentlySent.add(responseKey);

      // إزالة بعد 60 ثانية
      setTimeout(() => {
        this.recentlySent.delete(responseKey);
      }, 60000);

      console.log(`📤 [SIMPLE GEMINI] Sending response: "${message.substring(0, 100)}..."`);

      // حفظ في قاعدة البيانات
      if (conversationId.startsWith('temp_') || conversationId.startsWith('test-')) {
        // محادثة مؤقتة أو اختبار - استخدم جدول test_messages مباشرة
        console.log(`💾 [SIMPLE GEMINI] Saving bot response to test_messages with conversation_id: "${conversationId}"`);
        await supabase.from('test_messages').insert({
          conversation_id: conversationId,
          content: message,
          sender_type: 'bot'
        });
      } else {
        // محادثة حقيقية - تحقق من النوع
        const { data: conversation } = await supabase
          .from('conversations')
          .select('facebook_page_id')
          .eq('id', conversationId)
          .single();

        if (conversation?.facebook_page_id === 'test-page') {
          // محادثة اختبار - استخدم جدول test_messages
          console.log('💾 [SIMPLE GEMINI] Saving to test_messages for test conversation');
          await supabase.from('test_messages').insert({
            conversation_id: conversationId,
            content: message,
            sender_type: 'bot'
          });
        } else {
          // محادثة حقيقية - استخدم جدول messages العادي
          console.log('💾 [SIMPLE GEMINI] Saving to messages for real conversation');
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
      }

      // إرسال عبر Facebook (فقط للمحادثات الحقيقية)
      if (senderId !== 'test-user') {
        return await this.sendViaFacebook(conversationId, senderId, message);
      }

      return true;

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

  /**
   * إنشاء طلب مباشر من تفاصيل النص
   */
  private static async createDirectOrder(orderDetails: string, conversationId: string): Promise<any> {
    try {
      // تحليل تفاصيل الطلب
      const orderInfo = this.parseOrderDetails(orderDetails);

      // فحص البيانات المطلوبة
      if (!orderInfo.customerName || !orderInfo.customerPhone) {
        console.log(`⚠️ [ORDER] Missing required customer data: name="${orderInfo.customerName}", phone="${orderInfo.customerPhone}"`);
        return {
          success: false,
          error: 'Missing customer information',
          message: 'يرجى تقديم اسمك ورقم هاتفك لإتمام الطلب'
        };
      }

      // جلب معلومات العميل من المحادثة (كبديل)
      const customerInfo = await this.getCustomerInfo(conversationId);

      // البحث عن المنتج في قاعدة البيانات
      const product = await this.findProductByName(orderInfo.productName);

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // إنشاء رقم طلب فريد
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // حساب المبلغ الإجمالي
      const quantity = orderInfo.quantity || 1;
      const unitPrice = product.sale_price || product.price;
      const subtotal = unitPrice * quantity;
      const shippingCost = 30; // رسوم الشحن الثابتة
      const total = subtotal + shippingCost;

      // الحصول على معرف المتجر الافتراضي
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      const storeId = stores && stores.length > 0 ? stores[0].id : null;

      // إنشاء الطلب في قاعدة البيانات
      const { data: order, error: orderError } = await supabase
        .from('ecommerce_orders')
        .insert({
          store_id: storeId,
          order_number: orderNumber,
          customer_name: customerInfo.name || orderInfo.customerName || 'عميل جديد',
          customer_phone: customerInfo.phone || orderInfo.customerPhone || '',
          customer_address: orderInfo.customerAddress || '',
          product_name: product.name,
          product_size: orderInfo.size || '',
          product_color: orderInfo.color || '',
          quantity: quantity,
          unit_price: unitPrice,
          total_amount: total,
          subtotal: subtotal,
          shipping_amount: shippingCost,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'cash_on_delivery',
          notes: `طلب مباشر من الذكاء الاصطناعي`,
          currency: 'EGP'
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error creating order:', orderError);
        return { success: false, error: orderError.message };
      }

      // إضافة تفاصيل المنتج للطلب
      const { error: itemError } = await supabase
        .from('ecommerce_order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          price: unitPrice,
          total: subtotal
        });

      if (itemError) {
        console.error('❌ Error creating order item:', itemError);
        // حذف الطلب إذا فشل إضافة المنتج
        await supabase.from('ecommerce_orders').delete().eq('id', order.id);
        return { success: false, error: itemError.message };
      }

      // تحديث المخزون
      if (product.stock_quantity > 0) {
        await supabase
          .from('ecommerce_products')
          .update({
            stock_quantity: Math.max(0, product.stock_quantity - quantity),
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
      }

      console.log(`✅ [ORDER] Created successfully: ${orderNumber}`);

      return {
        success: true,
        orderNumber: orderNumber,
        orderId: order.id,
        total: total,
        product: product.name,
        quantity: quantity
      };

    } catch (error) {
      console.error('❌ Error in createDirectOrder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * تحليل تفاصيل الطلب من النص
   * التنسيق المتوقع: اسم المنتج - الكمية - اسم العميل - رقم الهاتف - العنوان - المقاس - اللون
   */
  private static parseOrderDetails(orderDetails: string): any {
    console.log(`🔍 [ORDER] Parsing order details: "${orderDetails}"`);

    const details = {
      productName: '',
      quantity: 1,
      color: '',
      size: '',
      customerName: '',
      customerPhone: '',
      customerAddress: ''
    };

    // تقسيم النص بالشرطة
    const parts = orderDetails.split(' - ').map(part => part.trim());
    console.log(`📝 [ORDER] Split parts:`, parts);

    // استخراج البيانات بالترتيب
    if (parts.length >= 1) details.productName = parts[0];
    if (parts.length >= 2 && parts[1]) details.quantity = parseInt(parts[1]) || 1;
    if (parts.length >= 3 && parts[2]) details.customerName = parts[2];
    if (parts.length >= 4 && parts[3]) details.customerPhone = parts[3];
    if (parts.length >= 5 && parts[4]) details.customerAddress = parts[4];
    if (parts.length >= 6 && parts[5]) details.size = parts[5];
    if (parts.length >= 7 && parts[6]) details.color = parts[6];

    // استخراج الكمية
    const quantityMatch = orderDetails.match(/(\d+)\s*(قطعة|حبة|عدد)/i);
    if (quantityMatch) {
      details.quantity = parseInt(quantityMatch[1]);
    }

    // استخراج اللون
    const colorMatch = orderDetails.match(/(أحمر|أبيض|أسود|أزرق|أخضر|أصفر|بني|رمادي|وردي|بنفسجي)/i);
    if (colorMatch) {
      details.color = colorMatch[1];
    }

    // استخراج المقاس
    const sizeMatch = orderDetails.match(/مقاس\s*(\d+|S|M|L|XL|XXL)/i);
    if (sizeMatch) {
      details.size = sizeMatch[1];
    }

    return details;
  }

  /**
   * جلب معلومات العميل من المحادثة
   */
  private static async getCustomerInfo(conversationId: string): Promise<any> {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('customer_name, customer_phone')
        .eq('id', conversationId)
        .single();

      return {
        name: conversation?.customer_name || '',
        phone: conversation?.customer_phone || ''
      };
    } catch (error) {
      console.error('❌ Error getting customer info:', error);
      return { name: '', phone: '' };
    }
  }

  /**
   * البحث عن منتج بالاسم
   */
  private static async findProductByName(productName: string): Promise<any> {
    try {
      // البحث بالاسم الدقيق أولاً
      let { data: product } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('status', 'active')
        .ilike('name', `%${productName}%`)
        .limit(1)
        .single();

      // إذا لم يجد، ابحث في الوصف
      if (!product) {
        const { data: products } = await supabase
          .from('ecommerce_products')
          .select('*')
          .eq('status', 'active')
          .or(`name.ilike.%${productName}%,short_description.ilike.%${productName}%`)
          .limit(1);

        product = products && products.length > 0 ? products[0] : null;
      }

      return product;
    } catch (error) {
      console.error('❌ Error finding product:', error);
      return null;
    }
  }

  /**
   * فحص إذا كان العميل يريد تقديم طلب شراء
   */
  private static isOrderRequest(message: string): boolean {
    const orderKeywords = [
      'عايز اطلب', 'عايزة اطلب', 'اريد اطلب', 'اريد اشتري', 'عايز اشتري', 'عايزة اشتري',
      'اطلب', 'اشتري', 'احجز', 'اريد', 'عايز', 'عايزة', 'ممكن اطلب', 'ممكن اشتري',
      'عايز اعمل طلب', 'عايزة اعمل طلب', 'هاخد', 'هاخده'
    ];

    const lowerMessage = message.toLowerCase();
    return orderKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * فحص إذا كان هناك طلب جاري في المحادثة
   */
  private static isOrderInProgress(conversationHistory: string[]): boolean {
    const orderIndicators = [
      'عايز اطلب', 'عايزة اطلب', 'اعمل طلب', 'هاخد', 'المقاس', 'اللون',
      'الاسم', 'رقم الهاتف', 'العنوان', 'تمام هاخد'
    ];

    const recentMessages = conversationHistory.join(' ').toLowerCase();
    return orderIndicators.some(indicator => recentMessages.includes(indicator));
  }

  /**
   * استخراج بيانات الطلب من تاريخ المحادثة
   */
  private static extractOrderDataFromHistory(conversationHistory: string[]): any {
    const orderData = {
      product: '',
      color: '',
      size: '',
      customerName: '',
      phone: '',
      address: ''
    };

    const allMessages = conversationHistory.join(' ').toLowerCase();

    // استخراج اللون
    const colors = ['أسود', 'اسود', 'بني', 'كحلي', 'بيج', 'أبيض', 'ابيض'];
    for (const color of colors) {
      if (allMessages.includes(color.toLowerCase())) {
        orderData.color = color;
        break;
      }
    }

    // استخراج المقاس (أرقام من 35 إلى 50)
    const sizeMatch = allMessages.match(/\b(3[5-9]|4[0-9]|50)\b/);
    if (sizeMatch) {
      orderData.size = sizeMatch[1];
    }

    // استخراج المنتج (افتراضي)
    if (allMessages.includes('حذاء') || allMessages.includes('كوتشي')) {
      orderData.product = 'حذاء كاجوال جلد طبيعي';
    }

    return orderData;
  }

  /**
   * فحص إذا كان العميل يقصد المنتج الافتراضي
   */
  private static isDefaultProductQuery(message?: string): boolean {
    if (!message) return false;

    const lowerMessage = message.toLowerCase();

    // كلمات تدل على المنتج الافتراضي
    const defaultProductKeywords = [
      'سعر', 'كام', 'تفاصيل', 'ايه سعره', 'بكام',
      'ده', 'دي', 'المنتج ده', 'الحذاء ده',
      'اللي في الصورة', 'المعروض', 'الإعلان',
      'متوفر', 'موجود', 'اطلبه', 'عايزه', 'اشتريه'
    ];

    // إذا كان السؤال عام بدون تحديد نوع منتج
    const hasDefaultKeyword = defaultProductKeywords.some(keyword =>
      lowerMessage.includes(keyword)
    );

    // إذا لم يذكر نوع منتج محدد (مثل رياضي، فستان، إلخ)
    const hasSpecificType = lowerMessage.includes('رياضي') ||
                           lowerMessage.includes('فستان') ||
                           lowerMessage.includes('شنطة') ||
                           lowerMessage.includes('حقيبة');

    return hasDefaultKeyword && !hasSpecificType;
  }

  /**
   * الحصول على معلومات المنتج الافتراضي
   */
  private static async getDefaultProductInfo(): Promise<string> {
    try {
      // البحث عن المنتج الافتراضي في قاعدة البيانات
      const { data: defaultProduct } = await supabase
        .from('ecommerce_products')
        .select('*')
        .ilike('name', '%حذاء كاجوال جلد طبيعي%')
        .eq('status', 'active')
        .single();

      if (defaultProduct) {
        // عرض المنتج من قاعدة البيانات
        const price = defaultProduct.sale_price || defaultProduct.price;
        const originalPrice = defaultProduct.sale_price ?
          ` (بدلاً من ${defaultProduct.price} ج)` : '';
        const discount = defaultProduct.sale_price ?
          Math.round(((defaultProduct.price - defaultProduct.sale_price) / defaultProduct.price) * 100) : 0;

        let info = `🌟 **${defaultProduct.name}**\n\n`;
        info += `💰 السعر: ${price} ج${originalPrice}\n`;
        if (discount > 0) {
          info += `🎯 خصم ${discount}% لفترة محدودة!\n`;
        }
        info += `📦 ${defaultProduct.stock_quantity > 0 ?
          `متوفر (${defaultProduct.stock_quantity} قطعة)` : 'نفد المخزون'}\n`;

        // استخراج الألوان والمقاسات من الوصف
        const description = defaultProduct.description || '';
        const colorsMatch = description.match(/متوفر بالألوان:\s*([^📏\n]+)/);
        const sizesMatch = description.match(/متوفر بالمقاسات:\s*([^\n]+)/);

        if (colorsMatch) {
          const colors = colorsMatch[1].split(',').map(c => c.trim()).filter(c => c);
          info += `🎨 الألوان المتاحة: ${colors.join(', ')}\n`;
          console.log(`✅ [DEFAULT PRODUCT] استخرجت ${colors.length} لون: ${colors.join(', ')}`);
        }

        if (sizesMatch) {
          const sizes = sizesMatch[1].split(',').map(s => s.trim()).filter(s => s);
          info += `📏 المقاسات المتاحة: ${sizes.join(', ')}\n`;
          console.log(`✅ [DEFAULT PRODUCT] استخرجت ${sizes.length} مقاس: ${sizes.join(', ')}`);
        }

        if (defaultProduct.short_description) {
          info += `\n📝 ${defaultProduct.short_description}\n`;
        }

        info += `\n🛒 للطلب: اطلب الآن وسنحتاج اسمك ورقم هاتفك والعنوان والمقاس واللون\n`;
        info += `📞 أو تواصل معنا: 01032792040`;

        return info;
      }
    } catch (error) {
      console.error('❌ Error fetching default product:', error);
    }

    // إذا لم يوجد في قاعدة البيانات، استخدم البيانات من البرومت
    return `🌟 **حذاء كاجوال جلد طبيعي**

💰 السعر: 250 ج (بدلاً من 350 ج)
🎯 خصم 30% لفترة محدودة!
📦 متوفر (50 قطعة)
🎨 الألوان: أسود، بني، كحلي
📏 المقاسات: 38-44

✨ المميزات:
- جلد طبيعي 100%
- مريح للاستخدام اليومي
- تصميم عصري وأنيق

🛒 للطلب: اطلب الآن وسنحتاج اسمك ورقم هاتفك والعنوان والمقاس واللون
📞 أو تواصل معنا: 01032792040`;
  }
}
