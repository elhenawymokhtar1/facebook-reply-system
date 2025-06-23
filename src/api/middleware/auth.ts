/**
 * 🔐 Middleware للمصادقة والتحقق من الصلاحيات
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { PermissionsService, Permission, UserRole } from '../../services/permissionsService';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// مفتاح JWT (في الإنتاج يجب أن يكون في متغيرات البيئة)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// تمديد نوع Request لإضافة معلومات الشركة
declare global {
  namespace Express {
    interface Request {
      company?: {
        id: string;
        name: string;
        email: string;
        status: string;
      };
      user?: {
        id: string;
        company_id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * 🔑 توليد JWT token للشركة
 */
export const generateCompanyToken = (company: any): string => {
  return jwt.sign(
    {
      id: company.id,
      email: company.email,
      type: 'company'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * 🔑 توليد JWT token لمستخدم الشركة
 */
export const generateUserToken = (user: any): string => {
  return jwt.sign(
    {
      id: user.id,
      company_id: user.company_id,
      email: user.email,
      role: user.role,
      type: 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * 🔐 Middleware للتحقق من مصادقة الشركة
 */
export const authenticateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'رمز المصادقة مطلوب'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== 'company') {
        return res.status(401).json({
          success: false,
          error: 'نوع الرمز غير صحيح'
        });
      }

      // التحقق من وجود الشركة في قاعدة البيانات
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, email, status')
        .eq('id', decoded.id)
        .eq('status', 'active')
        .single();

      if (error || !company) {
        return res.status(401).json({
          success: false,
          error: 'الشركة غير موجودة أو معطلة'
        });
      }

      req.company = company;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'رمز المصادقة غير صحيح أو منتهي الصلاحية'
      });
    }
  } catch (error) {
    console.error('❌ [AUTH] خطأ في مصادقة الشركة:', error);
    return res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
};

/**
 * 👥 Middleware للتحقق من مصادقة مستخدم الشركة
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'رمز المصادقة مطلوب'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.type !== 'user') {
        return res.status(401).json({
          success: false,
          error: 'نوع الرمز غير صحيح'
        });
      }

      // التحقق من وجود المستخدم في قاعدة البيانات
      const { data: user, error } = await supabase
        .from('company_users')
        .select('id, company_id, name, email, role')
        .eq('id', decoded.id)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'المستخدم غير موجود أو معطل'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'رمز المصادقة غير صحيح أو منتهي الصلاحية'
      });
    }
  } catch (error) {
    console.error('❌ [AUTH] خطأ في مصادقة المستخدم:', error);
    return res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
};

/**
 * 🔒 Middleware للتحقق من الصلاحيات
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'مطلوب تسجيل الدخول'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ليس لديك صلاحية للوصول لهذا المورد'
      });
    }

    next();
  };
};

/**
 * 🏢 Middleware للتحقق من ملكية الشركة للمورد
 */
export const requireCompanyOwnership = (req: Request, res: Response, next: NextFunction) => {
  const companyId = req.params.companyId || req.params.id;
  
  if (!req.company) {
    return res.status(401).json({
      success: false,
      error: 'مطلوب تسجيل دخول الشركة'
    });
  }

  if (req.company.id !== companyId) {
    return res.status(403).json({
      success: false,
      error: 'ليس لديك صلاحية للوصول لبيانات هذه الشركة'
    });
  }

  next();
};

/**
 * 📊 Middleware لتسجيل الطلبات
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  console.log(`📥 [${new Date().toISOString()}] ${method} ${url} - IP: ${ip}`);
  
  // تسجيل وقت الاستجابة
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    console.log(`📤 [${new Date().toISOString()}] ${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * 🛡️ Middleware لمعالجة الأخطاء
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ [ERROR]', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // أخطاء التحقق من صحة البيانات
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'بيانات غير صحيحة',
      details: error.details
    });
  }

  // أخطاء قاعدة البيانات
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: 'البيانات موجودة بالفعل'
    });
  }

  // أخطاء JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'رمز المصادقة غير صحيح'
    });
  }

  // خطأ عام
  res.status(500).json({
    success: false,
    error: 'حدث خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

/**
 * 🔐 Middleware للتحقق من صلاحية معينة
 */
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'مطلوب تسجيل الدخول'
        });
      }

      const hasPermission = await PermissionsService.hasPermission(
        req.user.id,
        req.user.company_id,
        permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `ليس لديك صلاحية: ${permission}`,
          required_permission: permission
        });
      }

      next();
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من الصلاحية:', error);
      return res.status(500).json({
        success: false,
        error: 'خطأ في التحقق من الصلاحيات'
      });
    }
  };
};

/**
 * 🔐 Middleware للتحقق من عدة صلاحيات (يجب توفر جميعها)
 */
export const requirePermissions = (permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'مطلوب تسجيل الدخول'
        });
      }

      const hasPermissions = await PermissionsService.hasPermissions(
        req.user.id,
        req.user.company_id,
        permissions
      );

      if (!hasPermissions) {
        return res.status(403).json({
          success: false,
          error: 'ليس لديك جميع الصلاحيات المطلوبة',
          required_permissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من الصلاحيات:', error);
      return res.status(500).json({
        success: false,
        error: 'خطأ في التحقق من الصلاحيات'
      });
    }
  };
};

/**
 * 🔐 Middleware للتحقق من أي صلاحية من مجموعة (يكفي توفر واحدة)
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'مطلوب تسجيل الدخول'
        });
      }

      const hasAnyPermission = await PermissionsService.hasAnyPermission(
        req.user.id,
        req.user.company_id,
        permissions
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          error: 'ليس لديك أي من الصلاحيات المطلوبة',
          required_permissions: permissions
        });
      }

      next();
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من الصلاحيات:', error);
      return res.status(500).json({
        success: false,
        error: 'خطأ في التحقق من الصلاحيات'
      });
    }
  };
};

/**
 * 👑 Middleware للتحقق من دور معين أو أعلى
 */
export const requireMinimumRole = (minimumRole: UserRole) => {
  const roleHierarchy = {
    [UserRole.VIEWER]: 1,
    [UserRole.EMPLOYEE]: 2,
    [UserRole.MANAGER]: 3,
    [UserRole.ADMIN]: 4,
    [UserRole.OWNER]: 5
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'مطلوب تسجيل الدخول'
        });
      }

      const userPermissions = await PermissionsService.getUserPermissions(
        req.user.id,
        req.user.company_id
      );

      if (!userPermissions) {
        return res.status(403).json({
          success: false,
          error: 'لا يمكن تحديد صلاحياتك'
        });
      }

      const userRoleLevel = roleHierarchy[userPermissions.role];
      const requiredRoleLevel = roleHierarchy[minimumRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          error: `مطلوب دور ${minimumRole} أو أعلى`,
          current_role: userPermissions.role,
          required_role: minimumRole
        });
      }

      next();
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من الدور:', error);
      return res.status(500).json({
        success: false,
        error: 'خطأ في التحقق من الدور'
      });
    }
  };
};

/**
 * 📊 Middleware لإضافة معلومات الصلاحيات للطلب
 */
export const attachUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      const userPermissions = await PermissionsService.getUserPermissions(
        req.user.id,
        req.user.company_id
      );

      if (userPermissions) {
        req.user.permissions = userPermissions.permissions;
        req.user.role = userPermissions.role;
      }
    }

    next();
  } catch (error) {
    console.error('❌ [AUTH] خطأ في إرفاق الصلاحيات:', error);
    next(); // المتابعة حتى لو فشل في جلب الصلاحيات
  }
};

/**
 * 🚫 Middleware للتعامل مع المسارات غير الموجودة
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'المسار غير موجود',
    path: req.url,
    method: req.method
  });
};
