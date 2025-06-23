/**
 * 🔐 خدمة إدارة الصلاحيات والأدوار
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// تعريف الأدوار المتاحة
export enum UserRole {
  OWNER = 'owner',           // مالك الشركة - صلاحيات كاملة
  ADMIN = 'admin',           // مدير - صلاحيات إدارية
  MANAGER = 'manager',       // مدير قسم - صلاحيات محدودة
  EMPLOYEE = 'employee',     // موظف - صلاحيات أساسية
  VIEWER = 'viewer'          // مشاهد فقط - قراءة فقط
}

// تعريف الصلاحيات المتاحة
export enum Permission {
  // إدارة الشركة
  MANAGE_COMPANY = 'manage_company',
  VIEW_COMPANY = 'view_company',
  
  // إدارة المستخدمين
  MANAGE_USERS = 'manage_users',
  INVITE_USERS = 'invite_users',
  VIEW_USERS = 'view_users',
  
  // إدارة الاشتراكات
  MANAGE_SUBSCRIPTION = 'manage_subscription',
  VIEW_SUBSCRIPTION = 'view_subscription',
  UPGRADE_PLAN = 'upgrade_plan',
  
  // إدارة المنتجات
  MANAGE_PRODUCTS = 'manage_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  VIEW_PRODUCTS = 'view_products',
  
  // إدارة الطلبات
  MANAGE_ORDERS = 'manage_orders',
  VIEW_ORDERS = 'view_orders',
  PROCESS_ORDERS = 'process_orders',
  
  // إدارة المحادثات
  MANAGE_CONVERSATIONS = 'manage_conversations',
  VIEW_CONVERSATIONS = 'view_conversations',
  REPLY_CONVERSATIONS = 'reply_conversations',
  
  // التحليلات والتقارير
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // الإعدادات
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SETTINGS = 'view_settings'
}

// تعريف الصلاحيات لكل دور
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // صلاحيات كاملة
    Permission.MANAGE_COMPANY,
    Permission.VIEW_COMPANY,
    Permission.MANAGE_USERS,
    Permission.INVITE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_SUBSCRIPTION,
    Permission.VIEW_SUBSCRIPTION,
    Permission.UPGRADE_PLAN,
    Permission.MANAGE_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.PROCESS_ORDERS,
    Permission.MANAGE_CONVERSATIONS,
    Permission.VIEW_CONVERSATIONS,
    Permission.REPLY_CONVERSATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS
  ],
  
  [UserRole.ADMIN]: [
    // صلاحيات إدارية (كل شيء عدا إدارة الشركة والاشتراك)
    Permission.VIEW_COMPANY,
    Permission.MANAGE_USERS,
    Permission.INVITE_USERS,
    Permission.VIEW_USERS,
    Permission.VIEW_SUBSCRIPTION,
    Permission.MANAGE_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.PROCESS_ORDERS,
    Permission.MANAGE_CONVERSATIONS,
    Permission.VIEW_CONVERSATIONS,
    Permission.REPLY_CONVERSATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS
  ],
  
  [UserRole.MANAGER]: [
    // صلاحيات إدارة القسم
    Permission.VIEW_COMPANY,
    Permission.VIEW_USERS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.VIEW_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
    Permission.PROCESS_ORDERS,
    Permission.MANAGE_CONVERSATIONS,
    Permission.VIEW_CONVERSATIONS,
    Permission.REPLY_CONVERSATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_SETTINGS
  ],
  
  [UserRole.EMPLOYEE]: [
    // صلاحيات أساسية
    Permission.VIEW_COMPANY,
    Permission.VIEW_USERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_ORDERS,
    Permission.PROCESS_ORDERS,
    Permission.VIEW_CONVERSATIONS,
    Permission.REPLY_CONVERSATIONS,
    Permission.VIEW_SETTINGS
  ],
  
  [UserRole.VIEWER]: [
    // قراءة فقط
    Permission.VIEW_COMPANY,
    Permission.VIEW_USERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_CONVERSATIONS,
    Permission.VIEW_SETTINGS
  ]
};

export interface UserPermissions {
  userId: string;
  companyId: string;
  role: UserRole;
  permissions: Permission[];
  customPermissions?: Permission[];
}

export class PermissionsService {
  /**
   * 🔍 الحصول على صلاحيات المستخدم
   */
  static async getUserPermissions(userId: string, companyId: string): Promise<UserPermissions | null> {
    try {
      console.log(`🔍 [PERMISSIONS] جلب صلاحيات المستخدم ${userId} في الشركة ${companyId}`);
      
      const { data: user, error } = await supabase
        .from('company_users')
        .select('role, permissions')
        .eq('id', userId)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();
      
      if (error || !user) {
        console.error('❌ [PERMISSIONS] المستخدم غير موجود:', error);
        return null;
      }
      
      const role = user.role as UserRole;
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      const customPermissions = user.permissions ? Object.keys(user.permissions).filter(p => user.permissions[p]) as Permission[] : [];
      
      // دمج صلاحيات الدور مع الصلاحيات المخصصة
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];
      
      return {
        userId,
        companyId,
        role,
        permissions: allPermissions,
        customPermissions
      };
    } catch (error) {
      console.error('❌ [PERMISSIONS] خطأ في جلب الصلاحيات:', error);
      return null;
    }
  }

  /**
   * ✅ التحقق من صلاحية معينة
   */
  static async hasPermission(userId: string, companyId: string, permission: Permission): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, companyId);
      if (!userPermissions) return false;
      
      return userPermissions.permissions.includes(permission);
    } catch (error) {
      console.error('❌ [PERMISSIONS] خطأ في التحقق من الصلاحية:', error);
      return false;
    }
  }

  /**
   * ✅ التحقق من عدة صلاحيات
   */
  static async hasPermissions(userId: string, companyId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, companyId);
      if (!userPermissions) return false;
      
      return permissions.every(permission => userPermissions.permissions.includes(permission));
    } catch (error) {
      console.error('❌ [PERMISSIONS] خطأ في التحقق من الصلاحيات:', error);
      return false;
    }
  }

  /**
   * ✅ التحقق من أي صلاحية من مجموعة
   */
  static async hasAnyPermission(userId: string, companyId: string, permissions: Permission[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, companyId);
      if (!userPermissions) return false;
      
      return permissions.some(permission => userPermissions.permissions.includes(permission));
    } catch (error) {
      console.error('❌ [PERMISSIONS] خطأ في التحقق من الصلاحيات:', error);
      return false;
    }
  }

  /**
   * 🔄 تحديث دور المستخدم
   */
  static async updateUserRole(userId: string, companyId: string, newRole: UserRole, updatedBy: string): Promise<boolean> {
    try {
      console.log(`🔄 [PERMISSIONS] تحديث دور المستخدم ${userId} إلى ${newRole}`);
      
      // التحقق من صلاحية المحدث
      const hasPermission = await this.hasPermission(updatedBy, companyId, Permission.MANAGE_USERS);
      if (!hasPermission) {
        console.error('❌ [PERMISSIONS] ليس لديك صلاحية لتحديث الأدوار');
        return false;
      }
      
      const { error } = await supabase
        .from('company_users')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      console.log(`✅ [PERMISSIONS] تم تحديث دور المستخدم بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ [PERMISSIONS] خطأ في تحديث الدور:', error);
      return false;
    }
  }

  /**
   * 🔄 تحديث الصلاحيات المخصصة
   */
  static async updateCustomPermissions(
    userId: string, 
    companyId: string, 
    permissions: Permission[], 
    updatedBy: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 [PERMISSIONS] تحديث الصلاحيات المخصصة للمستخدم ${userId}`);
      
      // التحقق من صلاحية المحدث
      const hasPermission = await this.hasPermission(updatedBy, companyId, Permission.MANAGE_USERS);
      if (!hasPermission) {
        console.error('❌ [PERMISSIONS] ليس لديك صلاحية لتحديث الصلاحيات');
        return false;
      }
      
      // تحويل المصفوفة إلى كائن
      const permissionsObject = permissions.reduce((acc, permission) => {
        acc[permission] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      const { error } = await supabase
        .from('company_users')
        .update({
          permissions: permissionsObject,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      console.log(`✅ [PERMISSIONS] تم تحديث الصلاحيات المخصصة بنجاح`);
      return true;
    } catch (error) {
      console.error('❌ [PERMISSIONS] خطأ في تحديث الصلاحيات:', error);
      return false;
    }
  }

  /**
   * 📋 الحصول على جميع الأدوار المتاحة
   */
  static getAvailableRoles(): Array<{role: UserRole, name: string, description: string}> {
    return [
      {
        role: UserRole.OWNER,
        name: 'مالك الشركة',
        description: 'صلاحيات كاملة لإدارة الشركة والاشتراك'
      },
      {
        role: UserRole.ADMIN,
        name: 'مدير',
        description: 'صلاحيات إدارية شاملة عدا إدارة الشركة'
      },
      {
        role: UserRole.MANAGER,
        name: 'مدير قسم',
        description: 'صلاحيات إدارة المنتجات والطلبات والمحادثات'
      },
      {
        role: UserRole.EMPLOYEE,
        name: 'موظف',
        description: 'صلاحيات أساسية للعمل اليومي'
      },
      {
        role: UserRole.VIEWER,
        name: 'مشاهد',
        description: 'صلاحيات قراءة فقط'
      }
    ];
  }

  /**
   * 📋 الحصول على جميع الصلاحيات المتاحة
   */
  static getAvailablePermissions(): Array<{permission: Permission, name: string, category: string}> {
    return [
      // إدارة الشركة
      { permission: Permission.MANAGE_COMPANY, name: 'إدارة الشركة', category: 'الشركة' },
      { permission: Permission.VIEW_COMPANY, name: 'عرض بيانات الشركة', category: 'الشركة' },
      
      // إدارة المستخدمين
      { permission: Permission.MANAGE_USERS, name: 'إدارة المستخدمين', category: 'المستخدمين' },
      { permission: Permission.INVITE_USERS, name: 'دعوة مستخدمين', category: 'المستخدمين' },
      { permission: Permission.VIEW_USERS, name: 'عرض المستخدمين', category: 'المستخدمين' },
      
      // إدارة الاشتراكات
      { permission: Permission.MANAGE_SUBSCRIPTION, name: 'إدارة الاشتراك', category: 'الاشتراك' },
      { permission: Permission.VIEW_SUBSCRIPTION, name: 'عرض الاشتراك', category: 'الاشتراك' },
      { permission: Permission.UPGRADE_PLAN, name: 'ترقية الخطة', category: 'الاشتراك' },
      
      // إدارة المنتجات
      { permission: Permission.MANAGE_PRODUCTS, name: 'إدارة المنتجات', category: 'المنتجات' },
      { permission: Permission.CREATE_PRODUCTS, name: 'إنشاء منتجات', category: 'المنتجات' },
      { permission: Permission.EDIT_PRODUCTS, name: 'تعديل المنتجات', category: 'المنتجات' },
      { permission: Permission.DELETE_PRODUCTS, name: 'حذف المنتجات', category: 'المنتجات' },
      { permission: Permission.VIEW_PRODUCTS, name: 'عرض المنتجات', category: 'المنتجات' },
      
      // إدارة الطلبات
      { permission: Permission.MANAGE_ORDERS, name: 'إدارة الطلبات', category: 'الطلبات' },
      { permission: Permission.VIEW_ORDERS, name: 'عرض الطلبات', category: 'الطلبات' },
      { permission: Permission.PROCESS_ORDERS, name: 'معالجة الطلبات', category: 'الطلبات' },
      
      // إدارة المحادثات
      { permission: Permission.MANAGE_CONVERSATIONS, name: 'إدارة المحادثات', category: 'المحادثات' },
      { permission: Permission.VIEW_CONVERSATIONS, name: 'عرض المحادثات', category: 'المحادثات' },
      { permission: Permission.REPLY_CONVERSATIONS, name: 'الرد على المحادثات', category: 'المحادثات' },
      
      // التحليلات
      { permission: Permission.VIEW_ANALYTICS, name: 'عرض التحليلات', category: 'التحليلات' },
      { permission: Permission.EXPORT_DATA, name: 'تصدير البيانات', category: 'التحليلات' },
      
      // الإعدادات
      { permission: Permission.MANAGE_SETTINGS, name: 'إدارة الإعدادات', category: 'الإعدادات' },
      { permission: Permission.VIEW_SETTINGS, name: 'عرض الإعدادات', category: 'الإعدادات' }
    ];
  }
}
