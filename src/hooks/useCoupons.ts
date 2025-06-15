import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed_cart' | 'fixed_product' | 'free_shipping';
  amount: number;
  minimum_amount?: number;
  usage_limit?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateCouponData {
  code: string;
  description?: string;
  type: 'percentage' | 'fixed_cart' | 'fixed_product' | 'free_shipping';
  amount: number;
  minimum_amount?: number;
  usage_limit?: number;
  expires_at?: string;
  is_active?: boolean;
}

export interface CouponValidation {
  isValid: boolean;
  coupon?: Coupon;
  error?: string;
  discount?: {
    amount: number;
    type: string;
    freeShipping?: boolean;
  };
}

export const useCoupons = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب جميع الكوبونات
  const {
    data: coupons = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Coupon[];
    },
  });

  // إنشاء كوبون جديد
  const createCouponMutation = useMutation({
    mutationFn: async (couponData: CreateCouponData) => {
      // الحصول على معرف المتجر الافتراضي
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('لا يوجد متجر متاح');
      }

      // التحقق من عدم وجود كوبون بنفس الكود
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', couponData.code)
        .eq('store_id', stores[0].id)
        .single();

      if (existingCoupon) {
        throw new Error('يوجد كوبون بنفس الكود مسبقاً');
      }

      const newCoupon = {
        store_id: stores[0].id,
        code: couponData.code,
        description: couponData.description,
        type: couponData.type,
        amount: couponData.amount,
        minimum_amount: couponData.minimum_amount,
        usage_limit: couponData.usage_limit,
        used_count: 0,
        expires_at: couponData.expires_at,
        is_active: couponData.is_active ?? true
      };

      const { data, error } = await supabase
        .from('coupons')
        .insert(newCoupon)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: "نجح",
        description: "تم إنشاء الكوبون بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الكوبون",
        variant: "destructive",
      });
    },
  });

  // تحديث كوبون
  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateCouponData> }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: "نجح",
        description: "تم تحديث الكوبون بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الكوبون",
        variant: "destructive",
      });
    },
  });

  // حذف كوبون
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: "نجح",
        description: "تم حذف الكوبون بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الكوبون",
        variant: "destructive",
      });
    },
  });

  // التحقق من صحة الكوبون
  const validateCoupon = async (code: string, cartTotal: number): Promise<CouponValidation> => {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return {
          isValid: false,
          error: 'كود الكوبون غير صحيح'
        };
      }

      // التحقق من تاريخ الانتهاء
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return {
          isValid: false,
          error: 'انتهت صلاحية هذا الكوبون'
        };
      }

      // التحقق من حد الاستخدام
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return {
          isValid: false,
          error: 'تم استنفاد هذا الكوبون'
        };
      }

      // التحقق من الحد الأدنى للطلب
      if (coupon.minimum_amount && cartTotal < coupon.minimum_amount) {
        return {
          isValid: false,
          error: `الحد الأدنى للطلب ${coupon.minimum_amount} ج`
        };
      }

      // حساب قيمة الخصم
      let discountAmount = 0;
      let freeShipping = false;

      switch (coupon.type) {
        case 'percentage':
          discountAmount = (cartTotal * coupon.amount) / 100;
          break;
        case 'fixed_cart':
          discountAmount = Math.min(coupon.amount, cartTotal);
          break;
        case 'free_shipping':
          freeShipping = true;
          discountAmount = 0; // سيتم حساب قيمة الشحن لاحقاً
          break;
        default:
          discountAmount = coupon.amount;
      }

      return {
        isValid: true,
        coupon,
        discount: {
          amount: Math.round(discountAmount * 100) / 100,
          type: coupon.type,
          freeShipping
        }
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'حدث خطأ في التحقق من الكوبون'
      };
    }
  };

  // استخدام كوبون (زيادة العداد)
  const useCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const { data, error } = await supabase
        .from('coupons')
        .update({ used_count: supabase.sql`used_count + 1` })
        .eq('id', couponId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  // إحصائيات الكوبونات
  const getCouponsStats = () => {
    if (!coupons.length) {
      return {
        total: 0,
        active: 0,
        expired: 0,
        used: 0,
        totalUsage: 0,
        totalSavings: 0
      };
    }

    const now = new Date();
    const active = coupons.filter(c => 
      c.is_active && 
      (!c.expires_at || new Date(c.expires_at) > now) &&
      (!c.usage_limit || c.used_count < c.usage_limit)
    ).length;

    const expired = coupons.filter(c => 
      c.expires_at && new Date(c.expires_at) <= now
    ).length;

    const used = coupons.filter(c => c.used_count > 0).length;
    const totalUsage = coupons.reduce((sum, c) => sum + c.used_count, 0);
    
    // تقدير إجمالي الوفورات (تقريبي)
    const totalSavings = coupons.reduce((sum, c) => {
      if (c.type === 'percentage') {
        return sum + (c.used_count * c.amount * 10); // تقدير متوسط
      } else if (c.type === 'fixed_cart') {
        return sum + (c.used_count * c.amount);
      }
      return sum;
    }, 0);

    return {
      total: coupons.length,
      active,
      expired,
      used,
      totalUsage,
      totalSavings: Math.round(totalSavings)
    };
  };

  // البحث والفلترة
  const searchCoupons = (searchTerm: string, status?: string, type?: string) => {
    const now = new Date();
    
    return coupons.filter(coupon => {
      const matchesSearch = !searchTerm || 
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (status && status !== 'all') {
        switch (status) {
          case 'active':
            matchesStatus = coupon.is_active && 
              (!coupon.expires_at || new Date(coupon.expires_at) > now) &&
              (!coupon.usage_limit || coupon.used_count < coupon.usage_limit);
            break;
          case 'inactive':
            matchesStatus = !coupon.is_active;
            break;
          case 'expired':
            matchesStatus = coupon.expires_at && new Date(coupon.expires_at) <= now;
            break;
        }
      }

      const matchesType = !type || type === 'all' || coupon.type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  return {
    // البيانات
    coupons,
    isLoading,
    error,
    
    // العمليات
    createCoupon: createCouponMutation.mutate,
    updateCoupon: updateCouponMutation.mutate,
    deleteCoupon: deleteCouponMutation.mutate,
    validateCoupon,
    useCoupon: useCouponMutation.mutate,
    
    // حالات التحميل
    isCreating: createCouponMutation.isPending,
    isUpdating: updateCouponMutation.isPending,
    isDeleting: deleteCouponMutation.isPending,
    
    // المساعدات
    refetch,
    getCouponsStats,
    searchCoupons
  };
};
