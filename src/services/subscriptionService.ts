/**
 * 🏢 خدمة إدارة الاشتراكات للشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import { supabase } from '../integrations/supabase/client';
import bcrypt from 'bcryptjs';

// 📋 أنواع البيانات
export interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  monthly_price: number;
  yearly_price: number;
  max_products: number;
  max_messages_per_month: number;
  max_images: number;
  max_active_conversations: number;
  max_users: number;
  features: Record<string, any>;
  display_order: number;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

export interface UsageStats {
  messages_sent: number;
  images_sent: number;
  products_count: number;
  active_conversations: number;
  api_calls: number;
  storage_used: number;
}

/**
 * 🏢 فئة خدمة الاشتراكات
 */
export class SubscriptionService {
  
  /**
   * 📋 الحصول على جميع خطط الاشتراك
   */
  static async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      console.log('🔄 Loading subscription plans...');

      // بيانات تجريبية للخطط
      const mockPlans: SubscriptionPlan[] = [
        {
          id: 'starter',
          name: 'Starter',
          name_ar: 'المبتدئ',
          description: 'Perfect for small businesses starting with automation',
          description_ar: 'مثالي للشركات الصغيرة التي تبدأ بالأتمتة',
          monthly_price: 0,
          yearly_price: 0,
          max_products: 10,
          max_messages_per_month: 100,
          max_images: 50,
          max_active_conversations: 5,
          max_users: 1,
          features: {
            ai_responses: false,
            image_sending: true,
            basic_analytics: true,
            api_access: false,
            priority_support: false,
            unlimited: false
          },
          display_order: 1
        },
        {
          id: 'basic',
          name: 'Basic',
          name_ar: 'الأساسي',
          description: 'Great for growing businesses with moderate automation needs',
          description_ar: 'رائع للشركات النامية مع احتياجات أتمتة متوسطة',
          monthly_price: 29,
          yearly_price: 290,
          max_products: 50,
          max_messages_per_month: 1000,
          max_images: 200,
          max_active_conversations: 25,
          max_users: 3,
          features: {
            ai_responses: true,
            image_sending: true,
            basic_analytics: true,
            api_access: false,
            priority_support: false,
            unlimited: false
          },
          display_order: 2
        },
        {
          id: 'professional',
          name: 'Professional',
          name_ar: 'المحترف',
          description: 'Advanced features for established businesses',
          description_ar: 'ميزات متقدمة للشركات الراسخة',
          monthly_price: 79,
          yearly_price: 790,
          max_products: 200,
          max_messages_per_month: 5000,
          max_images: 1000,
          max_active_conversations: 100,
          max_users: 10,
          features: {
            ai_responses: true,
            image_sending: true,
            basic_analytics: true,
            api_access: true,
            priority_support: true,
            unlimited: false
          },
          display_order: 3
        },
        {
          id: 'business',
          name: 'Business',
          name_ar: 'الأعمال',
          description: 'Unlimited everything for large enterprises',
          description_ar: 'كل شيء غير محدود للمؤسسات الكبيرة',
          monthly_price: 199,
          yearly_price: 1990,
          max_products: -1,
          max_messages_per_month: -1,
          max_images: -1,
          max_active_conversations: -1,
          max_users: -1,
          features: {
            ai_responses: true,
            image_sending: true,
            basic_analytics: true,
            api_access: true,
            priority_support: true,
            unlimited: true
          },
          display_order: 4
        }
      ];

      console.log('✅ Mock plans loaded:', mockPlans.length);
      return mockPlans;

    } catch (error) {
      console.error('❌ خطأ في جلب خطط الاشتراك:', error);
      throw new Error('فشل في جلب خطط الاشتراك');
    }
  }

  /**
   * 📋 الحصول على خطة اشتراك محددة
   */
  static async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ خطأ في جلب الخطة:', error);
      return null;
    }
  }

  /**
   * 🏢 الحصول على بيانات الشركة
   */
  static async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, email, phone, website, address, city, country, status, is_verified, created_at, last_login_at')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات الشركة:', error);
      return null;
    }
  }

  /**
   * 🏢 تسجيل شركة جديدة
   */
  static async registerCompany(companyData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
  }): Promise<{ company: Company; success: boolean; message: string }> {
    try {
      // التحقق من عدم وجود الإيميل
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('email', companyData.email)
        .single();

      if (existingCompany) {
        return {
          company: null as any,
          success: false,
          message: 'هذا الإيميل مسجل بالفعل'
        };
      }

      // تشفير كلمة المرور
      const passwordHash = await bcrypt.hash(companyData.password, 12);

      // إنشاء الشركة
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          email: companyData.email,
          password_hash: passwordHash,
          phone: companyData.phone,
          website: companyData.website,
          address: companyData.address,
          city: companyData.city,
          country: companyData.country || 'Egypt',
          verification_token: this.generateVerificationToken()
        })
        .select()
        .single();

      if (error) throw error;

      // إنشاء اشتراك مجاني (Starter Plan)
      await this.createFreeSubscription(company.id);

      // إعداد الشركة الجديدة تلقائياً (Gemini + Store)
      try {
        const { CompanySetupService } = await import('./companySetupService');
        await CompanySetupService.setupNewCompany(company.id, company.name);
        console.log(`✅ [SUBSCRIPTION] تم إعداد الشركة الجديدة تلقائياً: ${company.name}`);
      } catch (setupError) {
        console.error(`⚠️ [SUBSCRIPTION] خطأ في الإعداد التلقائي للشركة ${company.name}:`, setupError);
        // لا نوقف العملية، فقط نسجل الخطأ
      }

      return {
        company,
        success: true,
        message: 'تم تسجيل الشركة بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في تسجيل الشركة:', error);
      return {
        company: null as any,
        success: false,
        message: 'فشل في تسجيل الشركة'
      };
    }
  }

  /**
   * 🔐 تسجيل دخول الشركة
   */
  static async loginCompany(email: string, password: string): Promise<{
    company: Company | null;
    success: boolean;
    message: string;
  }> {
    try {
      // البحث عن الشركة
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (error || !company) {
        return {
          company: null,
          success: false,
          message: 'بيانات الدخول غير صحيحة'
        };
      }

      // التحقق من كلمة المرور
      const isValidPassword = await bcrypt.compare(password, company.password_hash);
      if (!isValidPassword) {
        return {
          company: null,
          success: false,
          message: 'بيانات الدخول غير صحيحة'
        };
      }

      // تحديث وقت آخر دخول
      await supabase
        .from('companies')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', company.id);

      // إزالة كلمة المرور من النتيجة
      delete company.password_hash;

      return {
        company,
        success: true,
        message: 'تم تسجيل الدخول بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      return {
        company: null,
        success: false,
        message: 'فشل في تسجيل الدخول'
      };
    }
  }

  /**
   * 📊 الحصول على اشتراك الشركة الحالي
   */
  static async getCompanySubscription(companyId: string): Promise<CompanySubscription | null> {
    try {
      const { data, error } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ خطأ في جلب اشتراك الشركة:', error);
      return null;
    }
  }

  /**
   * 📈 الحصول على إحصائيات استخدام الشركة
   */
  static async getCompanyUsage(companyId: string): Promise<UsageStats> {
    try {
      // الحصول على الاستخدام الحالي للشهر
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('company_id', companyId)
        .gte('period_start', startOfMonth.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // إنشاء سجل استخدام جديد إذا لم يوجد
        return {
          messages_sent: 0,
          images_sent: 0,
          products_count: 0,
          active_conversations: 0,
          api_calls: 0,
          storage_used: 0
        };
      }

      return {
        messages_sent: data.messages_sent || 0,
        images_sent: data.images_sent || 0,
        products_count: data.products_count || 0,
        active_conversations: data.active_conversations || 0,
        api_calls: data.api_calls || 0,
        storage_used: data.storage_used || 0
      };
    } catch (error) {
      console.error('❌ خطأ في جلب إحصائيات الاستخدام:', error);
      return {
        messages_sent: 0,
        images_sent: 0,
        products_count: 0,
        active_conversations: 0,
        api_calls: 0,
        storage_used: 0
      };
    }
  }

  /**
   * 🆓 إنشاء اشتراك مجاني للشركة الجديدة
   */
  private static async createFreeSubscription(companyId: string): Promise<void> {
    try {
      // الحصول على الخطة المجانية
      const { data: starterPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Starter')
        .single();

      if (!starterPlan) throw new Error('الخطة المجانية غير موجودة');

      // إنشاء الاشتراك
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10); // اشتراك مجاني لمدة 10 سنوات

      await supabase
        .from('company_subscriptions')
        .insert({
          company_id: companyId,
          plan_id: starterPlan.id,
          billing_cycle: 'yearly',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          amount: 0,
          currency: 'USD',
          status: 'active',
          auto_renew: false
        });
    } catch (error) {
      console.error('❌ خطأ في إنشاء الاشتراك المجاني:', error);
      throw error;
    }
  }

  /**
   * 🔑 توليد رمز التحقق
   */
  private static generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * ✅ التحقق من حدود الاستخدام
   */
  static async checkUsageLimits(companyId: string, type: 'messages' | 'images' | 'products'): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> {
    try {
      const subscription = await this.getCompanySubscription(companyId);
      const usage = await this.getCompanyUsage(companyId);

      if (!subscription || !subscription.plan) {
        return { allowed: false, current: 0, limit: 0, percentage: 100 };
      }

      let current = 0;
      let limit = 0;

      switch (type) {
        case 'messages':
          current = usage.messages_sent;
          limit = subscription.plan.max_messages_per_month;
          break;
        case 'images':
          current = usage.images_sent;
          limit = subscription.plan.max_images;
          break;
        case 'products':
          current = usage.products_count;
          limit = subscription.plan.max_products;
          break;
      }

      // -1 يعني غير محدود
      if (limit === -1) {
        return { allowed: true, current, limit: -1, percentage: 0 };
      }

      const percentage = limit > 0 ? (current / limit) * 100 : 100;
      const allowed = current < limit;

      return { allowed, current, limit, percentage };
    } catch (error) {
      console.error('❌ خطأ في فحص حدود الاستخدام:', error);
      return { allowed: false, current: 0, limit: 0, percentage: 100 };
    }
  }
}
