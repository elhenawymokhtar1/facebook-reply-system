/**
 * 🏢 API Routes لنظام الاشتراكات للشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionService } from '../services/subscriptionService';
import { UsageTrackingService } from '../services/usageTrackingService';
import { PermissionsService, Permission, UserRole } from '../services/permissionsService';
import { SuperAdminService } from '../services/superAdminService';
import { requirePermission, requireMinimumRole, authenticateUser } from './middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================
// 🧪 Test Routes
// ===================================

router.get('/test', (req, res) => {
  console.log('🧪 [SUBSCRIPTION] Test route called!');
  res.json({ 
    message: 'Subscription API is working!',
    timestamp: new Date().toISOString()
  });
});

// ===================================
// 📋 Subscription Plans Routes
// ===================================

// جلب جميع خطط الاشتراك
router.get('/plans', async (req, res) => {
  try {
    console.log('📋 [SUBSCRIPTION] Fetching subscription plans...');
    
    const plans = await SubscriptionService.getAllPlans();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب خطط الاشتراك'
    });
  }
});

// جلب خطة اشتراك محددة
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 [SUBSCRIPTION] Fetching plan: ${id}`);
    
    const plan = await SubscriptionService.getPlanById(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'الخطة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching plan:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الخطة'
    });
  }
});

// ===================================
// 🏢 Company Registration & Auth Routes
// ===================================

// تسجيل شركة جديدة
router.post('/companies/register', async (req, res) => {
  try {
    console.log('🏢 [SUBSCRIPTION] Company registration request...');
    console.log('📝 [SUBSCRIPTION] Body:', JSON.stringify(req.body, null, 2));
    
    const { name, email, password, phone, website, address, city, country } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'اسم الشركة والإيميل وكلمة المرور مطلوبة'
      });
    }
    
    // التحقق من صحة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'صيغة الإيميل غير صحيحة'
      });
    }
    
    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }
    
    const result = await SubscriptionService.registerCompany({
      name,
      email,
      password,
      phone,
      website,
      address,
      city,
      country
    });

    // إنشاء مستخدم أساسي للشركة إذا تم تسجيل الشركة بنجاح
    if (result.success && result.company) {
      console.log('👑 [SUBSCRIPTION] إنشاء مستخدم أساسي للشركة...');

      const adminResult = await SuperAdminService.createCompanySuperAdmin(
        result.company.id,
        {
          email: email,
          password: password,
          name: `مدير ${name}`,
          companyId: result.company.id
        }
      );

      if (adminResult.success) {
        console.log('✅ [SUBSCRIPTION] تم إنشاء مستخدم أساسي للشركة');
        result.admin = adminResult.data;
      } else {
        console.warn('⚠️ [SUBSCRIPTION] فشل في إنشاء مستخدم أساسي:', adminResult.message);
      }
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Company registration error:', error);
    
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        error: 'الإيميل مستخدم بالفعل'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'فشل في تسجيل الشركة'
    });
  }
});

// تسجيل دخول الشركة
router.post('/companies/login', async (req, res) => {
  try {
    console.log('🔐 [SUBSCRIPTION] Company login request...');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'الإيميل وكلمة المرور مطلوبان'
      });
    }
    
    const result = await SubscriptionService.loginCompany(email, password);
    
    res.json(result);
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Company login error:', error);
    res.status(401).json({
      success: false,
      error: 'بيانات الدخول غير صحيحة'
    });
  }
});

// ===================================
// 🏢 Company Management Routes
// ===================================

// جلب بيانات الشركة
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏢 [SUBSCRIPTION] Fetching company: ${id}`);
    
    const company = await SubscriptionService.getCompanyById(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching company:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب بيانات الشركة'
    });
  }
});

// تحديث بيانات الشركة
router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏢 [SUBSCRIPTION] Updating company: ${id}`);
    
    const updateData = req.body;
    delete updateData.password; // منع تحديث كلمة المرور من هنا
    delete updateData.email; // منع تحديث الإيميل من هنا
    
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      message: 'تم تحديث بيانات الشركة بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error updating company:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث بيانات الشركة'
    });
  }
});

// ===================================
// 📊 Company Subscription Routes
// ===================================

// جلب اشتراك الشركة الحالي
router.get('/companies/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 [SUBSCRIPTION] Fetching company subscription: ${id}`);
    
    const subscription = await SubscriptionService.getCompanySubscription(id);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب بيانات الاشتراك'
    });
  }
});

// جلب إحصائيات استخدام الشركة
router.get('/companies/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📈 [SUBSCRIPTION] Fetching company usage: ${id}`);

    const usage = await UsageTrackingService.getCompanyUsageSummary(id);

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب إحصائيات الاستخدام'
    });
  }
});

// جلب الإحصائيات اليومية
router.get('/companies/:id/usage/daily', async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.query;

    console.log(`📊 [SUBSCRIPTION] Fetching daily usage stats: ${id}`);

    const stats = await UsageTrackingService.getDailyUsageStats(
      id,
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching daily stats:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإحصائيات اليومية'
    });
  }
});

// تسجيل استخدام مورد
router.post('/companies/:id/usage/record', async (req, res) => {
  try {
    const { id } = req.params;
    const { resourceType, count } = req.body;

    console.log(`📝 [SUBSCRIPTION] Recording usage: ${resourceType} (${count}) for company ${id}`);

    if (!resourceType || !['messages', 'images', 'products', 'api_calls'].includes(resourceType)) {
      return res.status(400).json({
        success: false,
        error: 'نوع المورد غير صحيح'
      });
    }

    const success = await UsageTrackingService.recordUsage(
      id,
      resourceType,
      count || 1
    );

    if (success) {
      res.json({
        success: true,
        message: 'تم تسجيل الاستخدام بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في تسجيل الاستخدام'
      });
    }
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error recording usage:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تسجيل الاستخدام'
    });
  }
});

// التحقق من حدود الاستخدام
router.get('/companies/:id/usage/limits/:resourceType', async (req, res) => {
  try {
    const { id, resourceType } = req.params;

    console.log(`🚫 [SUBSCRIPTION] Checking usage limits: ${resourceType} for company ${id}`);

    if (!['messages', 'images', 'products'].includes(resourceType)) {
      return res.status(400).json({
        success: false,
        error: 'نوع المورد غير صحيح'
      });
    }

    const limits = await UsageTrackingService.checkUsageLimits(
      id,
      resourceType as 'messages' | 'images' | 'products'
    );

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error checking limits:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في التحقق من الحدود'
    });
  }
});

// إعادة تعيين استخدام الشهر (للاختبار)
router.post('/companies/:id/usage/reset', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 [SUBSCRIPTION] Resetting monthly usage for company ${id}`);

    const success = await UsageTrackingService.resetMonthlyUsage(id);

    if (success) {
      res.json({
        success: true,
        message: 'تم إعادة تعيين الاستخدام بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في إعادة تعيين الاستخدام'
      });
    }
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error resetting usage:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تعيين الاستخدام'
    });
  }
});

// ===================================
// 🔄 Subscription Management Routes
// ===================================

// ترقية الاشتراك
router.post('/companies/:id/upgrade', async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, billingCycle } = req.body;

    console.log(`🔄 [SUBSCRIPTION] Upgrading company ${id} to plan ${planId}`);

    if (!planId || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'معرف الخطة ونوع الفوترة مطلوبان'
      });
    }

    // جلب الخطة الجديدة
    const newPlan = await SubscriptionService.getPlanById(planId);
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'الخطة المطلوبة غير موجودة'
      });
    }

    // حساب المبلغ
    const amount = billingCycle === 'yearly' ? newPlan.yearly_price : newPlan.monthly_price;

    // إنشاء اشتراك جديد
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const { data, error } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: id,
        plan_id: planId,
        billing_cycle: billingCycle,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        amount: amount,
        currency: 'USD',
        status: 'active',
        auto_renew: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'تم ترقية الاشتراك بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في ترقية الاشتراك'
    });
  }
});

// إلغاء الاشتراك
router.post('/companies/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log(`❌ [SUBSCRIPTION] Cancelling subscription for company ${id}`);

    // أولاً، جلب الاشتراك النشط الأحدث
    const { data: activeSubscription, error: fetchError } = await supabase
      .from('company_subscriptions')
      .select('id')
      .eq('company_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !activeSubscription) {
      return res.status(404).json({
        success: false,
        error: 'لا يوجد اشتراك نشط للشركة'
      });
    }

    // ثم تحديث الاشتراك المحدد
    const { data, error } = await supabase
      .from('company_subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'لم يتم تحديد السبب'
      })
      .eq('id', activeSubscription.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data && data.length > 0 ? data[0] : data,
      message: 'تم إلغاء الاشتراك بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إلغاء الاشتراك'
    });
  }
});

// إيقاف الاشتراك مؤقتاً
router.post('/companies/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log(`⏸️ [SUBSCRIPTION] Pausing subscription for company ${id}`);

    // أولاً، جلب الاشتراك النشط الأحدث
    const { data: activeSubscription, error: fetchError } = await supabase
      .from('company_subscriptions')
      .select('id')
      .eq('company_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !activeSubscription) {
      return res.status(404).json({
        success: false,
        error: 'لا يوجد اشتراك نشط للشركة'
      });
    }

    // ثم تحديث الاشتراك المحدد
    const { data, error } = await supabase
      .from('company_subscriptions')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        pause_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', activeSubscription.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data && data.length > 0 ? data[0] : data,
      message: 'تم إيقاف الاشتراك مؤقتاً'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error pausing subscription:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إيقاف الاشتراك'
    });
  }
});

// استئناف الاشتراك
router.post('/companies/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`▶️ [SUBSCRIPTION] Resuming subscription for company ${id}`);

    // أولاً، جلب الاشتراك المتوقف الأحدث
    const { data: pausedSubscription, error: fetchError } = await supabase
      .from('company_subscriptions')
      .select('id')
      .eq('company_id', id)
      .eq('status', 'paused')
      .order('paused_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !pausedSubscription) {
      return res.status(404).json({
        success: false,
        error: 'لا يوجد اشتراك متوقف للشركة'
      });
    }

    // ثم تحديث الاشتراك المحدد
    const { data, error } = await supabase
      .from('company_subscriptions')
      .update({
        status: 'active',
        resumed_at: new Date().toISOString(),
        paused_at: null,
        pause_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pausedSubscription.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data && data.length > 0 ? data[0] : data,
      message: 'تم استئناف الاشتراك بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في استئناف الاشتراك'
    });
  }
});

// ===================================
// 👥 Company Users Management Routes
// ===================================

// جلب مستخدمي الشركة
router.get('/companies/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 [SUBSCRIPTION] Fetching users for company: ${id}`);

    const { data, error } = await supabase
      .from('company_users')
      .select('id, name, email, role, is_active, created_at, last_login_at')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching company users:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب مستخدمي الشركة'
    });
  }
});

// إضافة مستخدم جديد للشركة
router.post('/companies/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    console.log(`👥 [SUBSCRIPTION] Adding user to company: ${id}`);

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'الاسم والإيميل وكلمة المرور مطلوبة'
      });
    }

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('company_users')
      .insert({
        company_id: id,
        name,
        email,
        password_hash: passwordHash,
        role: role || 'user'
      })
      .select('id, name, email, role, is_active, created_at')
      .single();

    if (error) {
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          error: 'الإيميل مستخدم بالفعل في هذه الشركة'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      message: 'تم إضافة المستخدم بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error adding company user:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إضافة المستخدم'
    });
  }
});

// ===================================
// 📊 Analytics & Reports Routes
// ===================================

// تقرير شامل عن الشركة
router.get('/companies/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 [SUBSCRIPTION] Fetching dashboard data for company: ${id}`);

    // جلب بيانات الشركة
    const company = await SubscriptionService.getCompanyById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    // جلب الاشتراك الحالي
    const subscription = await SubscriptionService.getCompanySubscription(id);

    // جلب إحصائيات الاستخدام
    const usage = await SubscriptionService.getCompanyUsage(id);

    // جلب عدد المستخدمين
    const { data: users, error: usersError } = await supabase
      .from('company_users')
      .select('id')
      .eq('company_id', id)
      .eq('is_active', true);

    if (usersError) throw usersError;

    res.json({
      success: true,
      data: {
        company,
        subscription,
        usage,
        activeUsers: users?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب بيانات لوحة التحكم'
    });
  }
});

// ===================================
// 🔐 Permissions & Roles Management Routes
// ===================================

// جلب صلاحيات المستخدم
router.get('/users/:userId/permissions', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.query;

    console.log(`🔍 [PERMISSIONS] جلب صلاحيات المستخدم ${userId}`);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'معرف الشركة مطلوب'
      });
    }

    const permissions = await PermissionsService.getUserPermissions(userId, companyId as string);

    if (!permissions) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود أو ليس لديه صلاحيات'
      });
    }

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('❌ [PERMISSIONS] خطأ في جلب الصلاحيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الصلاحيات'
    });
  }
});

// تحديث دور المستخدم
router.put('/users/:userId/role', authenticateUser, requirePermission(Permission.MANAGE_USERS), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, companyId } = req.body;

    console.log(`🔄 [PERMISSIONS] تحديث دور المستخدم ${userId} إلى ${role}`);

    if (!role || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'الدور ومعرف الشركة مطلوبان'
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'الدور غير صحيح'
      });
    }

    const success = await PermissionsService.updateUserRole(
      userId,
      companyId,
      role,
      req.user!.id
    );

    if (success) {
      res.json({
        success: true,
        message: 'تم تحديث الدور بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث الدور'
      });
    }
  } catch (error) {
    console.error('❌ [PERMISSIONS] خطأ في تحديث الدور:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث الدور'
    });
  }
});

// تحديث الصلاحيات المخصصة
router.put('/users/:userId/permissions', authenticateUser, requirePermission(Permission.MANAGE_USERS), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, companyId } = req.body;

    console.log(`🔄 [PERMISSIONS] تحديث الصلاحيات المخصصة للمستخدم ${userId}`);

    if (!permissions || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'الصلاحيات ومعرف الشركة مطلوبان'
      });
    }

    // التحقق من صحة الصلاحيات
    const validPermissions = Object.values(Permission);
    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p as Permission));

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'صلاحيات غير صحيحة',
        invalid_permissions: invalidPermissions
      });
    }

    const success = await PermissionsService.updateCustomPermissions(
      userId,
      companyId,
      permissions,
      req.user!.id
    );

    if (success) {
      res.json({
        success: true,
        message: 'تم تحديث الصلاحيات بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث الصلاحيات'
      });
    }
  } catch (error) {
    console.error('❌ [PERMISSIONS] خطأ في تحديث الصلاحيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث الصلاحيات'
    });
  }
});

// جلب الأدوار المتاحة
router.get('/roles', async (req, res) => {
  try {
    console.log('📋 [PERMISSIONS] جلب الأدوار المتاحة');

    const roles = PermissionsService.getAvailableRoles();

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('❌ [PERMISSIONS] خطأ في جلب الأدوار:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الأدوار'
    });
  }
});

// جلب الصلاحيات المتاحة
router.get('/permissions', async (req, res) => {
  try {
    console.log('📋 [PERMISSIONS] جلب الصلاحيات المتاحة');

    const permissions = PermissionsService.getAvailablePermissions();

    // تجميع الصلاحيات حسب الفئة
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    res.json({
      success: true,
      data: {
        all: permissions,
        grouped: groupedPermissions
      }
    });
  } catch (error) {
    console.error('❌ [PERMISSIONS] خطأ في جلب الصلاحيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الصلاحيات'
    });
  }
});

// التحقق من صلاحية معينة
router.post('/check-permission', authenticateUser, async (req, res) => {
  try {
    const { permission, companyId } = req.body;

    if (!permission || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'الصلاحية ومعرف الشركة مطلوبان'
      });
    }

    const hasPermission = await PermissionsService.hasPermission(
      req.user!.id,
      companyId,
      permission
    );

    res.json({
      success: true,
      data: {
        hasPermission,
        permission,
        userId: req.user!.id,
        companyId
      }
    });
  } catch (error) {
    console.error('❌ [PERMISSIONS] خطأ في التحقق من الصلاحية:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في التحقق من الصلاحية'
    });
  }
});

// ===================================
// 📧 User Invitations Routes
// ===================================

// إرسال دعوة مستخدم جديد
router.post('/companies/:id/invitations', authenticateUser, requirePermission(Permission.INVITE_USERS), async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const { email, role, permissions } = req.body;

    console.log(`📧 [INVITATIONS] إرسال دعوة للمستخدم ${email} في الشركة ${companyId}`);

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'الإيميل والدور مطلوبان'
      });
    }

    // التحقق من عدم وجود دعوة سابقة
    const { data: existingInvitation, error: checkError } = await supabase
      .from('user_invitations')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingInvitation) {
      return res.status(409).json({
        success: false,
        error: 'يوجد دعوة معلقة لهذا الإيميل بالفعل'
      });
    }

    // توليد رمز الدعوة
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // تنتهي خلال 7 أيام

    // إنشاء الدعوة
    const { data: invitation, error: insertError } = await supabase
      .from('user_invitations')
      .insert({
        company_id: companyId,
        email,
        role,
        permissions: permissions || {},
        invited_by: req.user!.id,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // هنا يمكن إضافة إرسال إيميل حقيقي
    console.log(`📧 [INVITATIONS] تم إنشاء الدعوة بنجاح. رابط الدعوة: /accept-invitation/${invitationToken}`);

    res.status(201).json({
      success: true,
      data: {
        ...invitation,
        invitation_link: `/accept-invitation/${invitationToken}`
      },
      message: 'تم إرسال الدعوة بنجاح'
    });
  } catch (error) {
    console.error('❌ [INVITATIONS] خطأ في إرسال الدعوة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إرسال الدعوة'
    });
  }
});

// جلب دعوات الشركة
router.get('/companies/:id/invitations', authenticateUser, requirePermission(Permission.VIEW_USERS), async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const { status } = req.query;

    console.log(`📋 [INVITATIONS] جلب دعوات الشركة ${companyId}`);

    let query = supabase
      .from('user_invitations')
      .select(`
        *,
        invited_by_user:company_users!invited_by(name, email)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invitations, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: invitations || []
    });
  } catch (error) {
    console.error('❌ [INVITATIONS] خطأ في جلب الدعوات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الدعوات'
    });
  }
});

// قبول الدعوة
router.post('/invitations/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    console.log(`✅ [INVITATIONS] قبول الدعوة ${token}`);

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'الاسم وكلمة المرور مطلوبان'
      });
    }

    // جلب الدعوة
    const { data: invitation, error: invError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'الدعوة غير موجودة أو منتهية الصلاحية'
      });
    }

    // التحقق من انتهاء الصلاحية
    if (new Date() > new Date(invitation.expires_at)) {
      await supabase
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return res.status(410).json({
        success: false,
        error: 'الدعوة منتهية الصلاحية'
      });
    }

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, 12);

    // إنشاء المستخدم
    const { data: newUser, error: userError } = await supabase
      .from('company_users')
      .insert({
        company_id: invitation.company_id,
        name,
        email: invitation.email,
        password_hash: passwordHash,
        role: invitation.role,
        permissions: invitation.permissions
      })
      .select()
      .single();

    if (userError) {
      if (userError.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          error: 'المستخدم موجود بالفعل في هذه الشركة'
        });
      }
      throw userError;
    }

    // تحديث حالة الدعوة
    await supabase
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      message: 'تم قبول الدعوة وإنشاء الحساب بنجاح'
    });
  } catch (error) {
    console.error('❌ [INVITATIONS] خطأ في قبول الدعوة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في قبول الدعوة'
    });
  }
});

// إلغاء الدعوة
router.delete('/invitations/:id', authenticateUser, requirePermission(Permission.MANAGE_USERS), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`❌ [INVITATIONS] إلغاء الدعوة ${id}`);

    const { error } = await supabase
      .from('user_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'تم إلغاء الدعوة بنجاح'
    });
  } catch (error) {
    console.error('❌ [INVITATIONS] خطأ في إلغاء الدعوة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إلغاء الدعوة'
    });
  }
});

// ===================================
// 📅 Subscription Schedule Routes
// ===================================

// جلب مواعيد الاشتراك والتجديد
router.get('/companies/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📅 [SUBSCRIPTION] Fetching schedule for company: ${id}`);

    // جلب الاشتراك الحالي
    const { data: subscription, error: subError } = await supabase
      .from('company_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('company_id', id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.json({
        success: true,
        data: []
      });
    }

    // إنشاء أحداث مجدولة
    const events = [];
    const now = new Date();

    // إنشاء تاريخ تجديد واقعي (30 يوم من الآن للاختبار)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const daysUntilRenewal = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // حدث التجديد القادم
    if (daysUntilRenewal > 0) {
      events.push({
        id: 'renewal-' + subscription.id,
        type: 'renewal',
        title: 'تجديد الاشتراك',
        description: `تجديد خطة ${subscription.plan.name_ar}`,
        date: endDate.toISOString(),
        amount: subscription.billing_cycle === 'yearly' ? subscription.plan.yearly_price : subscription.plan.monthly_price,
        currency: subscription.currency,
        status: 'upcoming',
        days_until: daysUntilRenewal
      });
    }

    // تحذيرات قبل التجديد (إضافة تحذيرات حتى لو لم يحن وقتها بعد)
    const reminderDays = [30, 7, 3, 1];
    reminderDays.forEach(days => {
      if (daysUntilRenewal > days) {
        const reminderDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        events.push({
          id: `reminder-${days}-${subscription.id}`,
          type: 'payment',
          title: `تذكير الدفع - ${days} ${days === 1 ? 'يوم' : 'أيام'}`,
          description: `سيتم إرسال تذكير بتجديد الاشتراك قبل ${days} ${days === 1 ? 'يوم' : 'أيام'}`,
          date: reminderDate.toISOString(),
          amount: subscription.billing_cycle === 'yearly' ? subscription.plan.yearly_price : subscription.plan.monthly_price,
          currency: subscription.currency,
          status: 'upcoming',
          days_until: Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    });

    // إضافة أحداث تجريبية إضافية للعرض
    if (subscription.plan.name === 'Starter') {
      // حدث مراجعة الاستخدام الشهري
      const monthlyReviewDate = new Date();
      monthlyReviewDate.setDate(monthlyReviewDate.getDate() + 15);
      events.push({
        id: 'monthly-review-' + subscription.id,
        type: 'trial_end',
        title: 'مراجعة الاستخدام الشهري',
        description: 'مراجعة استخدامك الشهري وتقييم إمكانية الترقية',
        date: monthlyReviewDate.toISOString(),
        status: 'upcoming',
        days_until: 15
      });
    }

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب مواعيد الاشتراك'
    });
  }
});

// تحديث إعدادات التجديد التلقائي
router.put('/companies/:id/auto-renew', async (req, res) => {
  try {
    const { id } = req.params;
    const { auto_renew } = req.body;

    console.log(`🔄 [SUBSCRIPTION] Updating auto-renew for company ${id}: ${auto_renew}`);

    const { data, error } = await supabase
      .from('company_subscriptions')
      .update({
        auto_renew: auto_renew,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', id)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: auto_renew ? 'تم تفعيل التجديد التلقائي' : 'تم إيقاف التجديد التلقائي'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error updating auto-renew:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث إعدادات التجديد'
    });
  }
});

// جلب إعدادات الإشعارات
router.get('/companies/:id/notification-settings', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔔 [SUBSCRIPTION] Fetching notification settings for company: ${id}`);

    // إعدادات افتراضية
    const defaultSettings = {
      email_enabled: true,
      sms_enabled: false,
      renewal_reminder_days: [7, 3, 1],
      payment_failure_notifications: true,
      trial_end_notifications: true
    };

    res.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب إعدادات الإشعارات'
    });
  }
});

// تحديث إعدادات الإشعارات
router.put('/companies/:id/notification-settings', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;

    console.log(`🔔 [SUBSCRIPTION] Updating notification settings for company: ${id}`);

    // في التطبيق الحقيقي، ستحفظ هذه الإعدادات في قاعدة البيانات
    res.json({
      success: true,
      data: settings,
      message: 'تم تحديث إعدادات الإشعارات بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث إعدادات الإشعارات'
    });
  }
});

// ===================================
// 👑 Super Admin Routes
// ===================================

// تسجيل دخول المستخدم الأساسي
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`👑 [SUPER_ADMIN] محاولة تسجيل دخول المستخدم الأساسي: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'الإيميل وكلمة المرور مطلوبان'
      });
    }

    const result = await SuperAdminService.loginSystemSuperAdmin(email, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في تسجيل دخول المستخدم الأساسي:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تسجيل الدخول'
    });
  }
});

// 👑 تسجيل دخول المدير الأساسي كشركة (Login As Company)
router.post('/admin/login-as-company', async (req, res) => {
  try {
    const { superAdminId, companyId } = req.body;

    console.log(`👑 [LOGIN_AS] المدير الأساسي ${superAdminId} يحاول الدخول كشركة ${companyId}`);

    if (!superAdminId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدير الأساسي ومعرف الشركة مطلوبان'
      });
    }

    const result = await SuperAdminService.loginAsCompany(superAdminId, companyId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول كشركة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

// 📋 الحصول على قائمة جميع الشركات للمدير الأساسي
router.get('/admin/companies', async (req, res) => {
  try {
    console.log('📋 [SUPER_ADMIN] طلب قائمة جميع الشركات...');

    const result = await SuperAdminService.getAllCompaniesForSuperAdmin();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ خطأ في جلب قائمة الشركات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

// 🏢 الحصول على تفاصيل شركة محددة للمدير الأساسي
router.get('/admin/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log(`🏢 [SUPER_ADMIN] طلب تفاصيل الشركة: ${companyId}`);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'معرف الشركة مطلوب'
      });
    }

    const result = await SuperAdminService.getCompanyDetails(companyId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل الشركة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

// إنشاء المستخدم الأساسي للنظام
router.post('/admin/create-super-admin', async (req, res) => {
  try {
    console.log('👑 [SUPER_ADMIN] طلب إنشاء المستخدم الأساسي');

    const result = await SuperAdminService.createSystemSuperAdmin();

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في إنشاء المستخدم الأساسي:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء المستخدم الأساسي'
    });
  }
});

// جلب جميع الشركات (للمستخدم الأساسي)
router.get('/admin/companies', async (req, res) => {
  try {
    console.log('📋 [SUPER_ADMIN] جلب جميع الشركات');

    const result = await SuperAdminService.getAllCompanies();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في جلب الشركات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الشركات'
    });
  }
});

// جلب إحصائيات النظام
router.get('/admin/stats', async (req, res) => {
  try {
    console.log('📊 [SUPER_ADMIN] جلب إحصائيات النظام');

    const result = await SuperAdminService.getSystemStats();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإحصائيات'
    });
  }
});

// تهيئة النظام
router.post('/admin/initialize', async (req, res) => {
  try {
    console.log('🔧 [SUPER_ADMIN] تهيئة النظام');

    await SuperAdminService.initializeSystem();

    res.json({
      success: true,
      message: 'تم تهيئة النظام بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في تهيئة النظام:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تهيئة النظام'
    });
  }
});

// تحديث حالة الشركة
router.put('/admin/companies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 [SUPER_ADMIN] تحديث حالة الشركة ${id} إلى ${status}`);

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'حالة غير صحيحة'
      });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: company,
      message: 'تم تحديث حالة الشركة بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في تحديث حالة الشركة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث حالة الشركة'
    });
  }
});

// تحديث بيانات الشركة
router.put('/admin/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, website, address, city, country } = req.body;

    console.log(`✏️ [SUPER_ADMIN] تحديث بيانات الشركة ${id}`);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'اسم الشركة والإيميل مطلوبان'
      });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .update({
        name,
        email,
        phone,
        website,
        address,
        city,
        country,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: company,
      message: 'تم تحديث بيانات الشركة بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUPER_ADMIN] خطأ في تحديث بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث بيانات الشركة'
    });
  }
});

// جلب بيانات الاستخدام للشركة
router.get('/companies/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📊 [SUBSCRIPTION] جلب بيانات الاستخدام للشركة ${id}`);

    // جلب بيانات الاشتراك والخطة
    const { data: subscription, error: subError } = await supabase
      .from('company_subscriptions')
      .select(`
        status,
        plan:subscription_plans(
          name,
          max_users,
          max_messages,
          max_images,
          max_products,
          features
        )
      `)
      .eq('company_id', id)
      .single();

    if (subError) {
      console.error('❌ [SUBSCRIPTION] خطأ في جلب الاشتراك:', subError);
      return res.status(404).json({
        success: false,
        error: 'لا يوجد اشتراك للشركة'
      });
    }

    // جلب عدد المستخدمين
    const { count: usersCount } = await supabase
      .from('company_users')
      .select('id', { count: 'exact' })
      .eq('company_id', id)
      .eq('is_active', true);

    // جلب الاستخدام الشهري من جدول التتبع
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('resource_type, usage_count')
      .eq('company_id', id)
      .gte('created_at', startOfMonth);

    // تجميع بيانات الاستخدام
    const usageData = {
      users_count: usersCount || 0,
      messages_count: 0,
      images_count: 0,
      products_count: 0
    };

    if (usage) {
      usage.forEach(item => {
        switch (item.resource_type) {
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

    res.json({
      success: true,
      data: {
        ...usageData,
        plan: subscription.plan,
        subscription_status: subscription.status
      },
      message: 'تم جلب بيانات الاستخدام بنجاح'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] خطأ في جلب بيانات الاستخدام:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب بيانات الاستخدام'
    });
  }
});

// جلب فواتير الشركة
router.get('/companies/:id/invoices', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📄 [BILLING] جلب فواتير الشركة ${id}`);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', id)
      .order('issue_date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: invoices || [],
      message: 'تم جلب الفواتير بنجاح'
    });
  } catch (error) {
    console.error('❌ [BILLING] خطأ في جلب الفواتير:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الفواتير'
    });
  }
});

// جلب مدفوعات الشركة
router.get('/companies/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`💳 [BILLING] جلب مدفوعات الشركة ${id}`);

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: payments || [],
      message: 'تم جلب المدفوعات بنجاح'
    });
  } catch (error) {
    console.error('❌ [BILLING] خطأ في جلب المدفوعات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب المدفوعات'
    });
  }
});

// تحميل فاتورة PDF
router.get('/invoices/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📥 [BILLING] تحميل فاتورة ${id}`);

    // هنا يمكن إضافة منطق إنشاء PDF
    // للآن سنرجع رسالة أن الميزة قيد التطوير
    res.status(501).json({
      success: false,
      error: 'ميزة تحميل PDF قيد التطوير'
    });
  } catch (error) {
    console.error('❌ [BILLING] خطأ في تحميل الفاتورة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحميل الفاتورة'
    });
  }
});

// إرسال فاتورة بالبريد الإلكتروني
router.post('/invoices/:id/send', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📧 [BILLING] إرسال فاتورة ${id}`);

    // تحديث حالة الفاتورة إلى مرسلة
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: invoice,
      message: 'تم إرسال الفاتورة بنجاح'
    });
  } catch (error) {
    console.error('❌ [BILLING] خطأ في إرسال الفاتورة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إرسال الفاتورة'
    });
  }
});

// جلب طرق الدفع للشركة
router.get('/companies/:id/payment-methods', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`💳 [PAYMENT] جلب طرق الدفع للشركة ${id}`);

    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('company_id', id)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: paymentMethods || [],
      message: 'تم جلب طرق الدفع بنجاح'
    });
  } catch (error) {
    console.error('❌ [PAYMENT] خطأ في جلب طرق الدفع:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب طرق الدفع'
    });
  }
});

// إضافة طريقة دفع جديدة
router.post('/companies/:id/payment-methods', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      card_number,
      card_exp_month,
      card_exp_year,
      card_cvc,
      card_holder_name,
      wallet_email,
      wallet_phone,
      wallet_provider,
      instapay_identifier,
      instapay_type
    } = req.body;

    console.log(`➕ [PAYMENT] إضافة طريقة دفع ${type} للشركة ${id}`);

    let paymentMethodData: any = {
      company_id: id,
      type: type || 'credit_card',
      is_default: false,
      is_active: true
    };

    // معالجة البيانات حسب نوع طريقة الدفع
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        if (!card_number || !card_exp_month || !card_exp_year || !card_cvc) {
          return res.status(400).json({
            success: false,
            error: 'جميع بيانات البطاقة مطلوبة'
          });
        }

        const cardBrand = getCardBrand(card_number);
        const lastFour = card_number.slice(-4);

        paymentMethodData = {
          ...paymentMethodData,
          provider: 'stripe',
          card_last_four: lastFour,
          card_brand: cardBrand,
          card_exp_month: parseInt(card_exp_month),
          card_exp_year: parseInt(card_exp_year)
        };
        break;

      case 'digital_wallet':
        if (!wallet_provider || (!wallet_email && !wallet_phone)) {
          return res.status(400).json({
            success: false,
            error: 'مزود المحفظة والبريد الإلكتروني أو رقم الهاتف مطلوبان'
          });
        }

        paymentMethodData = {
          ...paymentMethodData,
          provider: wallet_provider,
          wallet_email: wallet_email || null,
          wallet_phone: wallet_phone || null
        };
        break;

      case 'instapay':
        if (!instapay_identifier || !instapay_type) {
          return res.status(400).json({
            success: false,
            error: 'معرف InstaPay ونوعه مطلوبان'
          });
        }

        paymentMethodData = {
          ...paymentMethodData,
          provider: 'instapay',
          instapay_identifier,
          instapay_type
        };
        break;

      case 'bank_transfer':
        paymentMethodData = {
          ...paymentMethodData,
          provider: 'bank'
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'نوع طريقة الدفع غير مدعوم'
        });
    }

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .insert(paymentMethodData)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: paymentMethod,
      message: 'تم إضافة طريقة الدفع بنجاح'
    });
  } catch (error) {
    console.error('❌ [PAYMENT] خطأ في إضافة طريقة الدفع:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إضافة طريقة الدفع'
    });
  }
});

// تعيين طريقة دفع افتراضية
router.put('/payment-methods/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`⭐ [PAYMENT] تعيين طريقة دفع افتراضية ${id}`);

    // الحصول على معلومات طريقة الدفع
    const { data: paymentMethod, error: getError } = await supabase
      .from('payment_methods')
      .select('company_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    // إلغاء تعيين جميع طرق الدفع الأخرى كافتراضية
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('company_id', paymentMethod.company_id);

    // تعيين طريقة الدفع الحالية كافتراضية
    const { data: updatedMethod, error } = await supabase
      .from('payment_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: updatedMethod,
      message: 'تم تعيين طريقة الدفع الافتراضية'
    });
  } catch (error) {
    console.error('❌ [PAYMENT] خطأ في تعيين طريقة الدفع الافتراضية:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تعيين طريقة الدفع الافتراضية'
    });
  }
});

// حذف طريقة دفع
router.delete('/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ [PAYMENT] حذف طريقة دفع ${id}`);

    const { data: deletedMethod, error } = await supabase
      .from('payment_methods')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: deletedMethod,
      message: 'تم حذف طريقة الدفع'
    });
  } catch (error) {
    console.error('❌ [PAYMENT] خطأ في حذف طريقة الدفع:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حذف طريقة الدفع'
    });
  }
});

// إنشاء اشتراك جديد للشركة
router.post('/companies/:id/subscribe', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    console.log(`📝 [SUBSCRIPTION] Creating new subscription for company: ${id}`);

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        error: 'معرف الخطة مطلوب'
      });
    }

    // التحقق من وجود الخطة
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        success: false,
        error: 'الخطة غير موجودة أو غير نشطة'
      });
    }

    // التحقق من عدم وجود اشتراك نشط
    const { data: existingSubscriptions } = await supabase
      .from('company_subscriptions')
      .select('id, status')
      .eq('company_id', id)
      .eq('status', 'active');

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'يوجد اشتراك نشط بالفعل للشركة'
      });
    }

    // حساب تاريخ البداية والنهاية
    const startDate = new Date();
    const endDate = new Date();

    if (billing_cycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // حساب المبلغ
    const amount = billing_cycle === 'yearly' ? plan.yearly_price : plan.monthly_price;

    // إنشاء الاشتراك الجديد
    const { data, error } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: id,
        plan_id: plan_id,
        billing_cycle: billing_cycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount: amount,
        currency: 'USD',
        status: 'active',
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [SUBSCRIPTION] Error creating subscription:', error);
      return res.status(500).json({
        success: false,
        error: 'فشل في إنشاء الاشتراك'
      });
    }

    res.json({
      success: true,
      data,
      message: 'تم إنشاء الاشتراك بنجاح'
    });

  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء الاشتراك'
    });
  }
});

// دالة مساعدة لتحديد نوع البطاقة
function getCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, '');

  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
  if (number.startsWith('3')) return 'amex';
  if (number.startsWith('6')) return 'discover';

  return 'unknown';
}

export default router;
