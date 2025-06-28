import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentCompany {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
  is_verified?: boolean;
  created_at?: string;
  last_login_at?: string;
}

export const useCurrentCompany = () => {
  const [company, setCompany] = useState<CurrentCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = localStorage.getItem('company');
        if (companyData) {
          const parsedCompany = JSON.parse(companyData);
          if (parsedCompany.id && parsedCompany.email) {
            // التحقق من صحة بيانات الشركة في قاعدة البيانات
            const validatedCompany = await validateAndFixCompanyData(parsedCompany);

            // تحديث JWT token بمعرف الشركة للـ RLS
            await updateJWTWithCompanyId(validatedCompany.id);

            setCompany(validatedCompany);
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات الشركة:', error);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();

    // الاستماع لتغييرات localStorage
    const handleStorageChange = () => {
      loadCompany();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateCompany = async (updatedCompany: CurrentCompany) => {
    localStorage.setItem('company', JSON.stringify(updatedCompany));

    // تحديث JWT token بمعرف الشركة الجديد
    await updateJWTWithCompanyId(updatedCompany.id);

    setCompany(updatedCompany);
  };

  const clearCompany = () => {
    localStorage.removeItem('company');
    localStorage.removeItem('userToken');
    setCompany(null);
  };

  return {
    company,
    loading,
    updateCompany,
    clearCompany,
    isNewCompany: company ? isCompanyNew(company.created_at) : false
  };
};

// دالة لتحديث JWT token بمعرف الشركة للـ RLS
const updateJWTWithCompanyId = async (companyId: string) => {
  try {
    console.log('🔑 تحديث JWT token بمعرف الشركة:', companyId);

    // استدعاء الدالة في قاعدة البيانات لتحديث JWT claims
    const { error } = await supabase.rpc('set_company_id_in_jwt', {
      company_uuid: companyId
    });

    if (error) {
      console.error('❌ خطأ في تحديث JWT token:', error);
    } else {
      console.log('✅ تم تحديث JWT token بنجاح');
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث JWT token:', error);
  }
};

// دالة للتحقق من صحة بيانات الشركة وتصحيحها
const validateAndFixCompanyData = async (company: CurrentCompany): Promise<CurrentCompany> => {
  try {
    // التحقق من وجود الشركة بالمعرف
    const { data: companyById } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company.id)
      .single();

    if (companyById) {
      // المعرف صحيح، إرجاع البيانات المحدثة من قاعدة البيانات
      const updatedCompany = { ...companyById };
      delete updatedCompany.password_hash; // إزالة كلمة المرور

      // تحديث localStorage بالبيانات الصحيحة
      localStorage.setItem('company', JSON.stringify(updatedCompany));
      console.log('✅ تم التحقق من صحة بيانات الشركة');

      return updatedCompany;
    } else {
      // المعرف خاطئ، البحث بالاسم
      console.warn('⚠️ معرف الشركة غير صحيح، البحث بالاسم...');

      const { data: companyByName } = await supabase
        .from('companies')
        .select('*')
        .eq('name', company.name)
        .single();

      if (companyByName) {
        const correctedCompany = { ...companyByName };
        delete correctedCompany.password_hash; // إزالة كلمة المرور

        // تحديث localStorage بالبيانات الصحيحة
        localStorage.setItem('company', JSON.stringify(correctedCompany));
        console.log('✅ تم تصحيح بيانات الشركة:', correctedCompany);

        return correctedCompany;
      } else {
        console.error('❌ لم يتم العثور على الشركة في قاعدة البيانات');
        // إزالة البيانات الخاطئة
        localStorage.removeItem('company');
        throw new Error('بيانات الشركة غير صحيحة');
      }
    }
  } catch (error) {
    console.error('❌ خطأ في التحقق من بيانات الشركة:', error);
    // في حالة الخطأ، إرجاع البيانات الأصلية
    return company;
  }
};

// دالة للتحقق من كون الشركة جديدة (أقل من 7 أيام)
const isCompanyNew = (createdAt?: string): boolean => {
  if (!createdAt) return false;

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffInDays <= 7; // شركة جديدة إذا كانت أقل من 7 أيام
};
