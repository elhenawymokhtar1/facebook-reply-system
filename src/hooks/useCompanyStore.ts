/**
 * Hook لإدارة متجر الشركة الوحيد
 * كل شركة لها متجر واحد فقط
 */

import { useState, useEffect } from 'react';
import { useCurrentCompany } from './useCurrentCompany';
import { 
  getCompanyStore, 
  ensureCompanyHasStore, 
  updateCompanyStore,
  CompanyStore 
} from '@/utils/companyStoreUtils';

export const useCompanyStore = () => {
  const { company } = useCurrentCompany();
  const [store, setStore] = useState<CompanyStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب أو إنشاء متجر الشركة
  const fetchOrCreateStore = async () => {
    if (!company?.id) {
      setStore(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // التأكد من وجود متجر للشركة وإنشاؤه إذا لم يكن موجوداً
      const companyStore = await ensureCompanyHasStore(
        company.id,
        company.name,
        company.email
      );

      if (companyStore) {
        setStore(companyStore);
      } else {
        setError('فشل في إنشاء أو جلب متجر الشركة');
      }
    } catch (err) {
      console.error('خطأ في جلب متجر الشركة:', err);
      setError('حدث خطأ في جلب بيانات المتجر');
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات المتجر
  const updateStore = async (updates: Partial<Omit<CompanyStore, 'id' | 'company_id' | 'created_at'>>) => {
    if (!company?.id) {
      throw new Error('لا توجد شركة محددة');
    }

    try {
      const updatedStore = await updateCompanyStore(company.id, updates);
      if (updatedStore) {
        setStore(updatedStore);
        return updatedStore;
      } else {
        throw new Error('فشل في تحديث بيانات المتجر');
      }
    } catch (err) {
      console.error('خطأ في تحديث المتجر:', err);
      throw err;
    }
  };

  // إعادة تحميل بيانات المتجر
  const refreshStore = () => {
    fetchOrCreateStore();
  };

  // تحميل البيانات عند تغيير الشركة
  useEffect(() => {
    fetchOrCreateStore();
  }, [company?.id]);

  return {
    store,
    loading,
    error,
    updateStore,
    refreshStore,
    // معلومات مفيدة
    hasStore: !!store,
    storeId: store?.id || null,
    isStoreActive: store?.is_active || false,
  };
};

export default useCompanyStore;
