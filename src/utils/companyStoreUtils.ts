/**
 * أدوات إدارة متاجر الشركات
 * كل شركة لها متجر واحد فقط
 */

import { supabase } from '@/integrations/supabase/client';

export interface CompanyStore {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * إنشاء متجر تلقائي للشركة الجديدة
 */
export const createDefaultStoreForCompany = async (
  companyId: string,
  companyName: string,
  companyEmail: string
): Promise<CompanyStore | null> => {
  try {
    console.log('🔄 محاولة إنشاء متجر للشركة:', { companyId, companyName, companyEmail });

    // التحقق من صحة معرف الشركة أولاً
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, email')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('❌ الشركة غير موجودة:', companyError);
      return null;
    }

    // التحقق من عدم وجود متجر للشركة
    const { data: existingStores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    if (existingStores && existingStores.length > 0) {
      console.log('⚠️ الشركة لديها متجر بالفعل');
      // إرجاع المتجر الموجود
      const { data: existingStore } = await supabase
        .from('stores')
        .select('*')
        .eq('company_id', companyId)
        .single();
      return existingStore as CompanyStore;
    }

    // إنشاء متجر افتراضي
    const storeData = {
      company_id: companyId,
      name: `متجر ${company.name}`,
      description: `المتجر الرسمي لشركة ${company.name}`,
      email: company.email,
      is_active: true,
    };

    console.log('📝 بيانات المتجر الجديد:', storeData);

    const { data: store, error } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في إنشاء المتجر:', error);
      return null;
    }

    console.log(`✅ تم إنشاء متجر افتراضي للشركة: ${company.name}`);
    return store as CompanyStore;

  } catch (error) {
    console.error('❌ خطأ في إنشاء المتجر الافتراضي:', error);
    return null;
  }
};

/**
 * الحصول على متجر الشركة الوحيد
 */
export const getCompanyStore = async (companyId: string): Promise<CompanyStore | null> => {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('خطأ في جلب متجر الشركة:', error);
      return null;
    }

    return store as CompanyStore;
  } catch (error) {
    console.error('خطأ في جلب متجر الشركة:', error);
    return null;
  }
};

/**
 * تحديث بيانات متجر الشركة
 */
export const updateCompanyStore = async (
  companyId: string, 
  updates: Partial<Omit<CompanyStore, 'id' | 'company_id' | 'created_at'>>
): Promise<CompanyStore | null> => {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تحديث متجر الشركة:', error);
      return null;
    }

    return store as CompanyStore;
  } catch (error) {
    console.error('خطأ في تحديث متجر الشركة:', error);
    return null;
  }
};

/**
 * التأكد من وجود متجر للشركة وإنشاؤه إذا لم يكن موجوداً
 */
export const ensureCompanyHasStore = async (
  companyId: string,
  companyName: string,
  companyEmail: string
): Promise<CompanyStore | null> => {
  try {
    console.log('🔍 التحقق من وجود متجر للشركة:', { companyId, companyName });

    // محاولة جلب المتجر الموجود
    let store = await getCompanyStore(companyId);

    if (store) {
      console.log('✅ تم العثور على متجر موجود:', store.name);
      return store;
    }

    console.log('⚠️ لا يوجد متجر، سيتم إنشاء متجر جديد');

    // إذا لم يكن موجوداً، إنشاء متجر جديد
    store = await createDefaultStoreForCompany(companyId, companyName, companyEmail);

    if (store) {
      console.log('✅ تم إنشاء متجر جديد بنجاح:', store.name);
    } else {
      console.error('❌ فشل في إنشاء متجر جديد');
    }

    return store;
  } catch (error) {
    console.error('❌ خطأ في التأكد من وجود متجر للشركة:', error);
    return null;
  }
};

/**
 * الحصول على معرف متجر الشركة
 */
export const getCompanyStoreId = async (companyId: string): Promise<string | null> => {
  try {
    const store = await getCompanyStore(companyId);
    return store?.id || null;
  } catch (error) {
    console.error('خطأ في الحصول على معرف متجر الشركة:', error);
    return null;
  }
};

/**
 * التحقق من أن الشركة لديها متجر واحد فقط
 */
export const validateSingleStorePerCompany = async (companyId: string): Promise<boolean> => {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    if (error) {
      console.error('خطأ في التحقق من متاجر الشركة:', error);
      return false;
    }

    const storeCount = stores?.length || 0;
    
    if (storeCount > 1) {
      console.warn(`⚠️ الشركة ${companyId} لديها ${storeCount} متاجر! يجب أن يكون متجر واحد فقط.`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في التحقق من متاجر الشركة:', error);
    return false;
  }
};
