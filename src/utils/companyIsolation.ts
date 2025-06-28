/**
 * أدوات للتأكد من عزل البيانات بين الشركات
 * Company Data Isolation Utilities
 */

import { supabase } from '@/lib/supabase';

/**
 * التحقق من أن المحادثة تنتمي للشركة المحددة
 */
export const validateConversationOwnership = async (
  conversationId: string, 
  companyId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('company_id')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('❌ خطأ في التحقق من ملكية المحادثة:', error);
      return false;
    }

    return data?.company_id === companyId;
  } catch (error) {
    console.error('❌ خطأ في التحقق من ملكية المحادثة:', error);
    return false;
  }
};

/**
 * التحقق من أن الصفحة تنتمي للشركة المحددة
 */
export const validatePageOwnership = async (
  pageId: string, 
  companyId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('facebook_settings')
      .select('company_id')
      .eq('page_id', pageId)
      .single();

    if (error) {
      console.error('❌ خطأ في التحقق من ملكية الصفحة:', error);
      return false;
    }

    return data?.company_id === companyId;
  } catch (error) {
    console.error('❌ خطأ في التحقق من ملكية الصفحة:', error);
    return false;
  }
};

/**
 * جلب المحادثات مع فلترة الشركة
 */
export const getCompanyConversations = async (
  companyId: string,
  limit: number = 50
) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return conversations || [];
  } catch (error) {
    console.error('❌ خطأ في جلب محادثات الشركة:', error);
    throw error;
  }
};

/**
 * جلب صفحات الشركة
 */
export const getCompanyPages = async (companyId: string) => {
  try {
    const { data: pages, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return pages || [];
  } catch (error) {
    console.error('❌ خطأ في جلب صفحات الشركة:', error);
    throw error;
  }
};

/**
 * التحقق من صحة معرف الشركة
 */
export const validateCompanyId = (companyId: string | null | undefined): boolean => {
  if (!companyId) {
    console.warn('⚠️ معرف الشركة مفقود');
    return false;
  }

  // التحقق من صيغة UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    console.warn('⚠️ معرف الشركة ليس UUID صحيح:', companyId);
    return false;
  }

  return true;
};

/**
 * إنشاء middleware للتحقق من الشركة في API endpoints
 */
export const createCompanyMiddleware = (req: any, res: any, next: any) => {
  const companyId = req.query.company_id || req.body.company_id;
  
  if (!validateCompanyId(companyId)) {
    return res.status(400).json({
      error: 'معرف الشركة مطلوب ويجب أن يكون UUID صحيح',
      code: 'INVALID_COMPANY_ID'
    });
  }

  // إضافة معرف الشركة للطلب
  req.companyId = companyId;
  next();
};

/**
 * تسجيل تحذير عند استخدام endpoints بدون فلترة الشركة
 */
export const logCompanyIsolationWarning = (endpoint: string, companyId?: string) => {
  if (!companyId) {
    console.warn(`⚠️ COMPANY ISOLATION WARNING: ${endpoint} called without company_id filter`);
    console.warn('   This may expose data from other companies!');
    console.warn('   Please use company-specific endpoints or add company_id filter');
  }
};
