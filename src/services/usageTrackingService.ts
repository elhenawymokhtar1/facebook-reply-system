/**
 * 📊 خدمة تتبع استخدام الشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UsageRecord {
  id?: string;
  company_id: string;
  resource_type: 'messages' | 'images' | 'products' | 'api_calls';
  resource_count: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsageSummary {
  company_id: string;
  current_period: {
    messages: number;
    images: number;
    products: number;
    api_calls: number;
  };
  limits: {
    messages: number;
    images: number;
    products: number;
  };
  usage_percentage: {
    messages: number;
    images: number;
    products: number;
  };
  period_start: string;
  period_end: string;
}

export class UsageTrackingService {
  /**
   * 📈 تسجيل استخدام مورد معين
   */
  static async recordUsage(
    companyId: string,
    resourceType: 'messages' | 'images' | 'products' | 'api_calls',
    count: number = 1
  ): Promise<boolean> {
    try {
      console.log(`📊 [USAGE] تسجيل استخدام ${resourceType}: ${count} للشركة ${companyId}`);
      
      const today = new Date().toISOString().split('T')[0];
      
      // التحقق من وجود سجل لليوم الحالي
      const { data: existingRecord, error: selectError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('company_id', companyId)
        .eq('resource_type', resourceType)
        .eq('date', today)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }
      
      if (existingRecord) {
        // تحديث السجل الموجود
        const { error: updateError } = await supabase
          .from('usage_tracking')
          .update({
            resource_count: existingRecord.resource_count + count,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
        
        if (updateError) throw updateError;
      } else {
        // إنشاء سجل جديد
        const { error: insertError } = await supabase
          .from('usage_tracking')
          .insert({
            company_id: companyId,
            resource_type: resourceType,
            resource_count: count,
            date: today
          });
        
        if (insertError) throw insertError;
      }
      
      console.log(`✅ [USAGE] تم تسجيل الاستخدام بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ [USAGE] خطأ في تسجيل الاستخدام:', error);
      return false;
    }
  }

  /**
   * 📊 الحصول على ملخص استخدام الشركة للفترة الحالية
   */
  static async getCompanyUsageSummary(companyId: string): Promise<UsageSummary | null> {
    try {
      console.log(`📊 [USAGE] جلب ملخص الاستخدام للشركة ${companyId}`);
      
      // تحديد بداية ونهاية الشهر الحالي
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = periodStart.toISOString().split('T')[0];
      const endDate = periodEnd.toISOString().split('T')[0];
      
      // جلب بيانات الاستخدام للفترة الحالية
      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('resource_type, resource_count')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (usageError) throw usageError;
      
      // جلب حدود الاشتراك
      const { data: subscription, error: subError } = await supabase
        .from('company_subscriptions')
        .select(`
          plan:subscription_plans(
            max_messages_per_month,
            max_images,
            max_products
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single();
      
      if (subError) throw subError;
      
      // تجميع بيانات الاستخدام
      const usage = {
        messages: 0,
        images: 0,
        products: 0,
        api_calls: 0
      };
      
      usageData?.forEach(record => {
        if (record.resource_type in usage) {
          usage[record.resource_type] += record.resource_count;
        }
      });
      
      // حساب الحدود
      const limits = {
        messages: subscription?.plan?.max_messages_per_month || 0,
        images: subscription?.plan?.max_images || 0,
        products: subscription?.plan?.max_products || 0
      };
      
      // حساب نسب الاستخدام
      const usage_percentage = {
        messages: limits.messages > 0 ? Math.round((usage.messages / limits.messages) * 100) : 0,
        images: limits.images > 0 ? Math.round((usage.images / limits.images) * 100) : 0,
        products: limits.products > 0 ? Math.round((usage.products / limits.products) * 100) : 0
      };
      
      const summary: UsageSummary = {
        company_id: companyId,
        current_period: usage,
        limits,
        usage_percentage,
        period_start: startDate,
        period_end: endDate
      };
      
      console.log(`✅ [USAGE] تم جلب ملخص الاستخدام بنجاح`);
      return summary;
    } catch (error) {
      console.error('❌ [USAGE] خطأ في جلب ملخص الاستخدام:', error);
      return null;
    }
  }

  /**
   * 🚫 التحقق من تجاوز حدود الاستخدام
   */
  static async checkUsageLimits(
    companyId: string,
    resourceType: 'messages' | 'images' | 'products'
  ): Promise<{ allowed: boolean; current: number; limit: number; percentage: number }> {
    try {
      const summary = await this.getCompanyUsageSummary(companyId);
      
      if (!summary) {
        return { allowed: false, current: 0, limit: 0, percentage: 0 };
      }
      
      const current = summary.current_period[resourceType];
      const limit = summary.limits[resourceType];
      const percentage = summary.usage_percentage[resourceType];
      
      // السماح بالاستخدام إذا كان أقل من 100% أو إذا كان الحد غير محدود (-1)
      const allowed = limit === -1 || current < limit;
      
      return {
        allowed,
        current,
        limit,
        percentage
      };
    } catch (error) {
      console.error('❌ [USAGE] خطأ في التحقق من حدود الاستخدام:', error);
      return { allowed: false, current: 0, limit: 0, percentage: 0 };
    }
  }

  /**
   * 📈 الحصول على إحصائيات الاستخدام اليومية
   */
  static async getDailyUsageStats(
    companyId: string,
    days: number = 30
  ): Promise<Array<{ date: string; messages: number; images: number; products: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const { data: usageData, error } = await supabase
        .from('usage_tracking')
        .select('date, resource_type, resource_count')
        .eq('company_id', companyId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // تجميع البيانات حسب التاريخ
      const dailyStats: { [date: string]: { messages: number; images: number; products: number } } = {};
      
      usageData?.forEach(record => {
        if (!dailyStats[record.date]) {
          dailyStats[record.date] = { messages: 0, images: 0, products: 0 };
        }
        
        if (record.resource_type in dailyStats[record.date]) {
          dailyStats[record.date][record.resource_type] += record.resource_count;
        }
      });
      
      // تحويل إلى مصفوفة مرتبة
      const result = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      }));
      
      return result;
    } catch (error) {
      console.error('❌ [USAGE] خطأ في جلب الإحصائيات اليومية:', error);
      return [];
    }
  }

  /**
   * 🔄 إعادة تعيين استخدام الشهر (للاختبار)
   */
  static async resetMonthlyUsage(companyId: string): Promise<boolean> {
    try {
      console.log(`🔄 [USAGE] إعادة تعيين استخدام الشهر للشركة ${companyId}`);
      
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = periodStart.toISOString().split('T')[0];
      const endDate = periodEnd.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('usage_tracking')
        .delete()
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      console.log(`✅ [USAGE] تم إعادة تعيين الاستخدام بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ [USAGE] خطأ في إعادة تعيين الاستخدام:', error);
      return false;
    }
  }

  /**
   * ⚠️ إرسال تنبيهات عند اقتراب الحدود
   */
  static async checkAndSendUsageAlerts(companyId: string): Promise<void> {
    try {
      const summary = await this.getCompanyUsageSummary(companyId);
      if (!summary) return;
      
      const alerts = [];
      
      // التحقق من تجاوز 80% من الحد
      Object.entries(summary.usage_percentage).forEach(([resource, percentage]) => {
        if (percentage >= 80 && percentage < 100) {
          alerts.push({
            type: 'warning',
            resource,
            percentage,
            message: `تم استخدام ${percentage}% من حد ${resource}`
          });
        } else if (percentage >= 100) {
          alerts.push({
            type: 'error',
            resource,
            percentage,
            message: `تم تجاوز حد ${resource} (${percentage}%)`
          });
        }
      });
      
      if (alerts.length > 0) {
        console.log(`⚠️ [USAGE] تنبيهات الاستخدام للشركة ${companyId}:`, alerts);
        // هنا يمكن إضافة إرسال إيميل أو إشعار
      }
    } catch (error) {
      console.error('❌ [USAGE] خطأ في فحص التنبيهات:', error);
    }
  }
}
