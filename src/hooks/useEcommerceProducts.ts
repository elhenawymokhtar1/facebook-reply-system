import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

export interface EcommerceProduct {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  image_url?: string;
  category?: string;
  brand?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: number;
  sale_price?: number;
  stock_quantity?: number;
  category?: string;
  brand?: string;
  image_url?: string;
  featured?: boolean;
}

export const useEcommerceProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { company } = useCurrentCompany();

  // جلب المتاجر المرتبطة بالشركة الحالية
  const { data: stores = [] } = useQuery({
    queryKey: ['company-stores', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (error) {
        throw new Error(error.message);
      }

      console.log('🏪 المتاجر الموجودة:', data);
      return data || [];
    },
    enabled: !!company?.id,
  });

  // جلب المنتجات المرتبطة بمتاجر الشركة الحالية
  const {
    data: products = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ecommerce-products', company?.id],
    queryFn: async () => {
      if (!company?.id || stores.length === 0) return [];

      const storeIds = stores.map(store => store.id);

      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .in('store_id', storeIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as EcommerceProduct[];
    },
    enabled: !!company?.id && stores.length > 0,
  });

  // إضافة منتج جديد
  const addProductMutation = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      // التحقق من وجود الشركة الحالية
      if (!company?.id) {
        throw new Error('لا توجد شركة محددة');
      }

      // الحصول على متجر الشركة الوحيد
      const { data: companyStore } = await supabase
        .from('stores')
        .select('id')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .single();

      if (!companyStore) {
        throw new Error('لا يوجد متجر متاح لهذه الشركة');
      }

      // إنشاء slug من الاسم
      const slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const newProduct = {
        store_id: companyStore.id,
        name: productData.name,
        slug: slug,
        description: productData.description,
        short_description: productData.short_description,
        sku: productData.sku || `SKU-${Date.now()}`,
        price: productData.price,
        sale_price: productData.sale_price,
        stock_quantity: productData.stock_quantity || 0,
        category: productData.category,
        brand: productData.brand,
        image_url: productData.image_url,
        featured: productData.featured || false,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('ecommerce_products')
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
      toast({
        title: "نجح",
        description: "تم إضافة المنتج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المنتج",
        variant: "destructive",
      });
    },
  });

  // تحديث منتج
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateProductData> }) => {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
      toast({
        title: "نجح",
        description: "تم تحديث المنتج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المنتج",
        variant: "destructive",
      });
    },
  });

  // حذف منتج
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ecommerce_products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
      toast({
        title: "نجح",
        description: "تم حذف المنتج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المنتج",
        variant: "destructive",
      });
    },
  });

  // تبديل حالة المنتج المميز
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .update({ featured })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة المنتج",
        variant: "destructive",
      });
    },
  });

  // تحديث المخزون
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock_quantity }: { id: string; stock_quantity: number }) => {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .update({ stock_quantity })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-products'] });
      toast({
        title: "نجح",
        description: "تم تحديث المخزون بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المخزون",
        variant: "destructive",
      });
    },
  });

  // إحصائيات المنتجات
  const getProductStats = () => {
    if (!products.length) {
      return {
        total: 0,
        active: 0,
        featured: 0,
        outOfStock: 0,
        averagePrice: 0,
        totalValue: 0
      };
    }

    const active = products.filter(p => p.status === 'active').length;
    const featured = products.filter(p => p.featured).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    const averagePrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

    return {
      total: products.length,
      active,
      featured,
      outOfStock,
      averagePrice: Math.round(averagePrice),
      totalValue: Math.round(totalValue)
    };
  };

  // البحث والفلترة
  const searchProducts = (searchTerm: string, category?: string, status?: string) => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !category || category === 'all' || product.category === category;
      const matchesStatus = !status || status === 'all' || product.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  // الحصول على الفئات الفريدة
  const getCategories = () => {
    const categories = products
      .map(p => p.category)
      .filter(Boolean)
      .filter((category, index, array) => array.indexOf(category) === index);
    
    return categories;
  };

  // الحصول على العلامات التجارية الفريدة
  const getBrands = () => {
    const brands = products
      .map(p => p.brand)
      .filter(Boolean)
      .filter((brand, index, array) => array.indexOf(brand) === index);
    
    return brands;
  };

  return {
    // البيانات
    products,
    isLoading,
    error,
    
    // العمليات
    addProduct: addProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    toggleFeatured: toggleFeaturedMutation.mutate,
    updateStock: updateStockMutation.mutate,
    
    // حالات التحميل
    isAdding: addProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
    
    // المساعدات
    refetch,
    getProductStats,
    searchProducts,
    getCategories,
    getBrands
  };
};
