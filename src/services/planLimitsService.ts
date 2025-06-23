/**
 * 🚫 خدمة التحقق من حدود الخطة
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface PlanLimits {
  max_users: number;
  max_messages: number;
  max_images: number;
  max_products: number;
  features: string[];
}

export interface UsageLimits {
  users_count: number;
  messages_count: number;
  images_count: number;
  products_count: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  percentage: number;
}

export class PlanLimitsService {
  /**
   * 🔍 الحصول على حدود الخطة للشركة
   */
  static async getCompanyLimits(companyId: string): Promise<{
    success: boolean;
    limits?: PlanLimits;
    usage?: UsageLimits;
    subscription_status?: string;
  }> {
    try {
      console.log(`🔍 [LIMITS] جلب حدود الخطة للشركة ${companyId}`);

      // جلب بيانات الاشتراك والخطة
      const { data: subscription, error: subError } = await supabase
        .from('company_subscriptions')
        .select(`
          status,
          plan:subscription_plans(
            max_users,
            max_messages,
            max_images,
            max_products,
            features
          )
        `)
        .eq('company_id', companyId)
        .single();

      if (subError || !subscription) {
        console.error('❌ [LIMITS] لا يوجد اشتراك للشركة:', subError);
        return { success: false };
      }

      // جلب الاستخدام الحالي
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('resource_type, usage_count')
        .eq('company_id', companyId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const usageData: UsageLimits = {
        users_count: 0,
        messages_count: 0,
        images_count: 0,
        products_count: 0
      };

      if (usage) {
        usage.forEach(item => {
          switch (item.resource_type) {
            case 'users':
              usageData.users_count += item.usage_count;
              break;
            case 'messages':
              usageData.messages_count += item.usage_count;
              break;
            case 'images':
              usageData.images_count += item.usage_count;
              break;
            case 'products':
              usageData.products_count += item.usage_count;
              break;
          }
        });
      }

      // عدد المستخدمين الحالي
      const { count: usersCount } = await supabase
        .from('company_users')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true);

      usageData.users_count = usersCount || 0;

      return {
        success: true,
        limits: subscription.plan,
        usage: usageData,
        subscription_status: subscription.status
      };
    } catch (error) {
      console.error('❌ [LIMITS] خطأ في جلب حدود الخطة:', error);
      return { success: false };
    }
  }

  /**
   * ✅ التحقق من إمكانية استخدام مورد معين
   */
  static async checkResourceLimit(
    companyId: string, 
    resourceType: 'users' | 'messages' | 'images' | 'products',
    requestedAmount: number = 1
  ): Promise<LimitCheckResult> {
    try {
      const limitsData = await this.getCompanyLimits(companyId);
      
      if (!limitsData.success || !limitsData.limits || !limitsData.usage) {
        return {
          allowed: false,
          reason: 'لا يمكن تحديد حدود الخطة',
          current: 0,
          limit: 0,
          percentage: 0
        };
      }

      // التحقق من حالة الاشتراك
      if (limitsData.subscription_status !== 'active') {
        return {
          allowed: false,
          reason: 'الاشتراك غير نشط',
          current: 0,
          limit: 0,
          percentage: 0
        };
      }

      const limits = limitsData.limits;
      const usage = limitsData.usage;

      let current: number;
      let limit: number;

      switch (resourceType) {
        case 'users':
          current = usage.users_count;
          limit = limits.max_users;
          break;
        case 'messages':
          current = usage.messages_count;
          limit = limits.max_messages;
          break;
        case 'images':
          current = usage.images_count;
          limit = limits.max_images;
          break;
        case 'products':
          current = usage.products_count;
          limit = limits.max_products;
          break;
        default:
          return {
            allowed: false,
            reason: 'نوع مورد غير صحيح',
            current: 0,
            limit: 0,
            percentage: 0
          };
      }

      // إذا كان الحد غير محدود (-1)
      if (limit === -1) {
        return {
          allowed: true,
          current,
          limit,
          percentage: 0
        };
      }

      const newTotal = current + requestedAmount;
      const percentage = (current / limit) * 100;

      if (newTotal > limit) {
        return {
          allowed: false,
          reason: `تجاوز الحد الأقصى المسموح (${limit})`,
          current,
          limit,
          percentage
        };
      }

      return {
        allowed: true,
        current,
        limit,
        percentage
      };
    } catch (error) {
      console.error('❌ [LIMITS] خطأ في التحقق من حدود المورد:', error);
      return {
        allowed: false,
        reason: 'خطأ في التحقق من الحدود',
        current: 0,
        limit: 0,
        percentage: 0
      };
    }
  }

  /**
   * 🚨 التحقق من الاقتراب من الحدود
   */
  static async getUsageWarnings(companyId: string): Promise<{
    success: boolean;
    warnings: Array<{
      resource: string;
      current: number;
      limit: number;
      percentage: number;
      level: 'warning' | 'critical';
      message: string;
    }>;
  }> {
    try {
      const limitsData = await this.getCompanyLimits(companyId);
      
      if (!limitsData.success || !limitsData.limits || !limitsData.usage) {
        return { success: false, warnings: [] };
      }

      const limits = limitsData.limits;
      const usage = limitsData.usage;
      const warnings: any[] = [];

      const resources = [
        { type: 'users', current: usage.users_count, limit: limits.max_users, name: 'المستخدمين' },
        { type: 'messages', current: usage.messages_count, limit: limits.max_messages, name: 'الرسائل' },
        { type: 'images', current: usage.images_count, limit: limits.max_images, name: 'الصور' },
        { type: 'products', current: usage.products_count, limit: limits.max_products, name: 'المنتجات' }
      ];

      resources.forEach(resource => {
        if (resource.limit === -1) return; // غير محدود

        const percentage = (resource.current / resource.limit) * 100;

        if (percentage >= 90) {
          warnings.push({
            resource: resource.type,
            current: resource.current,
            limit: resource.limit,
            percentage,
            level: 'critical',
            message: `اقتربت من الحد الأقصى لـ${resource.name} (${resource.current}/${resource.limit})`
          });
        } else if (percentage >= 75) {
          warnings.push({
            resource: resource.type,
            current: resource.current,
            limit: resource.limit,
            percentage,
            level: 'warning',
            message: `استخدمت ${Math.round(percentage)}% من حد ${resource.name}`
          });
        }
      });

      return { success: true, warnings };
    } catch (error) {
      console.error('❌ [LIMITS] خطأ في جلب تحذيرات الاستخدام:', error);
      return { success: false, warnings: [] };
    }
  }

  /**
   * 🔒 التحقق من توفر ميزة معينة
   */
  static async checkFeatureAccess(companyId: string, feature: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    try {
      const limitsData = await this.getCompanyLimits(companyId);
      
      if (!limitsData.success || !limitsData.limits) {
        return {
          allowed: false,
          reason: 'لا يمكن تحديد ميزات الخطة'
        };
      }

      // التحقق من حالة الاشتراك
      if (limitsData.subscription_status !== 'active') {
        return {
          allowed: false,
          reason: 'الاشتراك غير نشط'
        };
      }

      const hasFeature = limitsData.limits.features.includes(feature);

      return {
        allowed: hasFeature,
        reason: hasFeature ? undefined : 'هذه الميزة غير متاحة في خطتك الحالية'
      };
    } catch (error) {
      console.error('❌ [LIMITS] خطأ في التحقق من الميزة:', error);
      return {
        allowed: false,
        reason: 'خطأ في التحقق من الميزة'
      };
    }
  }

  /**
   * 📊 تسجيل استخدام مورد
   */
  static async recordUsage(
    companyId: string,
    resourceType: 'users' | 'messages' | 'images' | 'products',
    amount: number = 1
  ): Promise<boolean> {
    try {
      // التحقق من الحدود أولاً
      const limitCheck = await this.checkResourceLimit(companyId, resourceType, amount);
      
      if (!limitCheck.allowed) {
        console.warn(`🚫 [LIMITS] تم منع استخدام ${resourceType}: ${limitCheck.reason}`);
        return false;
      }

      // تسجيل الاستخدام
      const { error } = await supabase
        .from('usage_tracking')
        .insert({
          company_id: companyId,
          resource_type: resourceType,
          usage_count: amount,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ [LIMITS] تم تسجيل استخدام ${resourceType}: ${amount}`);
      return true;
    } catch (error) {
      console.error('❌ [LIMITS] خطأ في تسجيل الاستخدام:', error);
      return false;
    }
  }
}
