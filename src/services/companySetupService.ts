/**
 * خدمة إعداد الشركات الجديدة تلقائياً
 * تضمن أن كل شركة جديدة تحصل على إعدادات Gemini مخصصة
 */

import { supabase } from '@/integrations/supabase/client';

export class CompanySetupService {
  
  /**
   * إعداد شامل للشركة الجديدة
   */
  static async setupNewCompany(companyId: string, companyName: string): Promise<boolean> {
    try {
      console.log(`🏢 [SETUP] إعداد شركة جديدة: ${companyName}`);
      
      // 1. إنشاء متجر للشركة إذا لم يكن موجود
      await this.createCompanyStore(companyId, companyName);
      
      // 2. إنشاء إعدادات Gemini مخصصة
      await this.createCustomGeminiSettings(companyId, companyName);
      
      console.log(`✅ [SETUP] تم إعداد الشركة ${companyName} بنجاح`);
      return true;
      
    } catch (error) {
      console.error(`❌ [SETUP] خطأ في إعداد الشركة ${companyName}:`, error);
      return false;
    }
  }

  /**
   * إنشاء متجر للشركة
   */
  private static async createCompanyStore(companyId: string, companyName: string): Promise<void> {
    try {
      // التحقق من وجود متجر
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('company_id', companyId)
        .single();

      if (existingStore) {
        console.log(`🏪 [SETUP] المتجر موجود بالفعل للشركة: ${companyName}`);
        return;
      }

      // إنشاء متجر جديد
      const storeName = `متجر ${companyName}`;
      
      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          company_id: companyId,
          name: storeName,
          description: `متجر إلكتروني لشركة ${companyName}`,
          is_active: true
        });

      if (storeError) {
        throw new Error(`خطأ في إنشاء المتجر: ${storeError.message}`);
      }

      console.log(`✅ [SETUP] تم إنشاء المتجر: ${storeName}`);
      
    } catch (error) {
      console.error(`❌ [SETUP] خطأ في إنشاء المتجر:`, error);
      throw error;
    }
  }

  /**
   * إنشاء إعدادات Gemini مخصصة للشركة
   */
  private static async createCustomGeminiSettings(companyId: string, companyName: string): Promise<void> {
    try {
      // التحقق من وجود إعدادات Gemini
      const { data: existingSettings } = await supabase
        .from('gemini_settings')
        .select('id')
        .eq('company_id', companyId)
        .single();

      if (existingSettings) {
        console.log(`🤖 [SETUP] إعدادات Gemini موجودة بالفعل للشركة: ${companyName}`);
        // تحديث الإعدادات الموجودة بالبرومت المخصص
        await this.updateExistingGeminiSettings(companyId, companyName);
        return;
      }

      // الحصول على اسم المتجر
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('company_id', companyId)
        .single();

      const storeName = store?.name || `متجر ${companyName}`;

      // إنشاء البرومت المخصص
      const customPrompt = this.generateCustomPrompt(storeName);
      const customProductsPrompt = this.generateCustomProductsPrompt(storeName);

      // إنشاء إعدادات Gemini جديدة
      const { error: geminiError } = await supabase
        .from('gemini_settings')
        .insert({
          company_id: companyId,
          api_key: '', // سيحتاج المستخدم لإضافة مفتاح API الخاص به
          model: 'gemini-1.5-flash',
          personality_prompt: customPrompt,
          products_prompt: customProductsPrompt,
          temperature: 0.7,
          max_tokens: 300,
          is_enabled: false, // معطل حتى يضيف المستخدم API key
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (geminiError) {
        throw new Error(`خطأ في إنشاء إعدادات Gemini: ${geminiError.message}`);
      }

      console.log(`✅ [SETUP] تم إنشاء إعدادات Gemini مخصصة للشركة: ${companyName}`);
      
    } catch (error) {
      console.error(`❌ [SETUP] خطأ في إنشاء إعدادات Gemini:`, error);
      throw error;
    }
  }

  /**
   * تحديث إعدادات Gemini الموجودة
   */
  private static async updateExistingGeminiSettings(companyId: string, companyName: string): Promise<void> {
    try {
      // الحصول على اسم المتجر
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('company_id', companyId)
        .single();

      const storeName = store?.name || `متجر ${companyName}`;

      // إنشاء البرومت المخصص
      const customPrompt = this.generateCustomPrompt(storeName);
      const customProductsPrompt = this.generateCustomProductsPrompt(storeName);

      // تحديث الإعدادات
      const { error: updateError } = await supabase
        .from('gemini_settings')
        .update({
          personality_prompt: customPrompt,
          products_prompt: customProductsPrompt,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);

      if (updateError) {
        throw new Error(`خطأ في تحديث إعدادات Gemini: ${updateError.message}`);
      }

      console.log(`✅ [SETUP] تم تحديث إعدادات Gemini للشركة: ${companyName}`);
      
    } catch (error) {
      console.error(`❌ [SETUP] خطأ في تحديث إعدادات Gemini:`, error);
      throw error;
    }
  }

  /**
   * توليد برومت مخصص للشركة
   */
  private static generateCustomPrompt(storeName: string): string {
    return `أنت مساعدة ذكية ومهذبة لـ"${storeName}". 

🎯 مهمتك:
- مساعدة العملاء في اختيار المنتجات المناسبة
- تقديم معلومات دقيقة عن المنتجات والأسعار
- إرشاد العملاء خلال عملية الطلب
- الرد بطريقة ودودة ومهنية

💬 أسلوب التواصل:
- استخدمي اللهجة المصرية الودودة
- كوني مفيدة ومباشرة
- اسألي عن التفاصيل المطلوبة لإكمال الطلب

🛍️ عند السؤال عن المنتجات:
- اعرضي المنتجات المتوفرة في "${storeName}"
- اذكري الأسعار والألوان والمقاسات المتاحة
- ساعدي العميل في اختيار المنتج المناسب

📦 لإكمال الطلب تحتاجين:
- اسم العميل الكامل
- رقم الهاتف
- العنوان بالتفصيل
- اسم المنتج
- اللون والمقاس المطلوب

🎨 إرسال الصور:
عندما يطلب العميل صورة منتج، استخدمي هذا الأمر:
[SEND_IMAGE: اسم المنتج الدقيق]

💡 نصائح مهمة:
- لا تخترعي منتجات غير موجودة
- استخدمي المعلومات الحقيقية من قاعدة البيانات
- كوني صادقة بخصوص التوفر والأسعار
- ساعدي العميل في اتخاذ القرار الصحيح

كوني مساعدة مثالية لـ"${storeName}"! 💖`;
  }

  /**
   * توليد برومت المنتجات المخصص
   */
  private static generateCustomProductsPrompt(storeName: string): string {
    return `🛍️ منتجات "${storeName}":

عندما يسأل العميل عن المنتجات، استخدمي المعلومات الحقيقية من قاعدة البيانات.

📸 لإرسال صور المنتجات:
استخدمي الأمر: [SEND_IMAGE: اسم المنتج]

🎯 تذكري:
- اعرضي فقط منتجات "${storeName}"
- استخدمي الأسعار الحقيقية
- اذكري الألوان والمقاسات المتاحة فعلياً
- ساعدي العميل في اختيار المنتج المناسب

كوني مساعدة مثالية وأرسلي الصور عند الطلب! 💖`;
  }

  /**
   * إصلاح جميع الشركات الموجودة
   */
  static async fixAllExistingCompanies(): Promise<void> {
    try {
      console.log('🔧 [SETUP] إصلاح جميع الشركات الموجودة...');
      
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name');

      if (error) {
        throw new Error(`خطأ في جلب الشركات: ${error.message}`);
      }

      if (!companies || companies.length === 0) {
        console.log('📭 [SETUP] لا توجد شركات للإصلاح');
        return;
      }

      console.log(`📊 [SETUP] عدد الشركات للإصلاح: ${companies.length}`);

      for (const company of companies) {
        await this.setupNewCompany(company.id, company.name);
      }

      console.log('✅ [SETUP] تم إصلاح جميع الشركات بنجاح');
      
    } catch (error) {
      console.error('❌ [SETUP] خطأ في إصلاح الشركات:', error);
      throw error;
    }
  }
}
