import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mockAPI } from '@/data/mockData';

// أنواع البيانات
interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  sku: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  brand?: string;
  is_active: boolean;
  created_at: string;
  variants: ProductVariant[];
}

interface CreateProductData {
  name: string;
  description: string;
  category: string;
  base_price: number;
  brand?: string;
  variants: {
    color: string;
    size: string;
    price: number;
    stock_quantity: number;
    image_url?: string;
  }[];
}

interface CreateVariantData {
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

const API_BASE = 'http://localhost:3002/api';

export const useProductsVariants = () => {
  const queryClient = useQueryClient();

  // جلب جميع المنتجات مع متغيراتها
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products-variants'],
    queryFn: mockAPI.getProducts,
    staleTime: 30000,
    cacheTime: 300000,
  });

  // إضافة منتج جديد مع متغيراته
  const addProduct = useMutation({
    mutationFn: mockAPI.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-variants'] });
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إضافة المنتج: ${error.message}`);
    },
  });

  // تحديث منتج
  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateProductData>): Promise<Product> => {
      const response = await fetch(`${API_BASE}/products-variants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-variants'] });
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث المنتج: ${error.message}`);
    },
  });

  // حذف منتج
  const deleteProduct = useMutation({
    mutationFn: mockAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-variants'] });
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في حذف المنتج: ${error.message}`);
    },
  });

  // إضافة متغير جديد لمنتج موجود
  const addVariant = useMutation({
    mutationFn: async ({ productId, variantData }: { productId: string; variantData: CreateVariantData }): Promise<ProductVariant> => {
      const response = await fetch(`${API_BASE}/products-variants/${productId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create variant');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-variants'] });
      toast.success('تم إضافة المتغير بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إضافة المتغير: ${error.message}`);
    },
  });

  // تحديث متغير
  const updateVariant = useMutation({
    mutationFn: async ({ variantId, ...updateData }: { variantId: string } & Partial<CreateVariantData>): Promise<ProductVariant> => {
      const response = await fetch(`${API_BASE}/products-variants/variants/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update variant');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-variants'] });
      toast.success('تم تحديث المتغير بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث المتغير: ${error.message}`);
    },
  });

  // حذف متغير
  const deleteVariant = useMutation({
    mutationFn: async (variantId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/products-variants/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete variant');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-variants'] });
      toast.success('تم حذف المتغير بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في حذف المتغير: ${error.message}`);
    },
  });

  return {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    addVariant,
    updateVariant,
    deleteVariant,
  };
};

// Hook للبحث في المنتجات بالألوان
export const useProductsByColor = (color: string) => {
  return useQuery({
    queryKey: ['products-variants', 'color', color],
    queryFn: async () => {
      if (!color) return [];

      const response = await fetch(`${API_BASE}/products-variants/search/color/${encodeURIComponent(color)}`);
      if (!response.ok) {
        throw new Error('Failed to search products by color');
      }
      return response.json();
    },
    enabled: !!color,
    staleTime: 60000,
  });
};

// Hook للبحث في المنتجات بالفئة
export const useProductsByCategory = (category: string) => {
  return useQuery({
    queryKey: ['products-variants', 'category', category],
    queryFn: async () => {
      if (!category) return [];

      const response = await fetch(`${API_BASE}/products-variants/search/category/${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error('Failed to search products by category');
      }
      return response.json();
    },
    enabled: !!category,
    staleTime: 60000,
  });
};

// Hook للحصول على منتج واحد مع متغيراته
export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['products-variants', productId],
    queryFn: async (): Promise<Product> => {
      const response = await fetch(`${API_BASE}/products-variants/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return response.json();
    },
    enabled: !!productId,
    staleTime: 30000,
  });
};

// دالة مساعدة للبحث الذكي
export const searchProductsVariants = async (query: string) => {
  try {
    // البحث بالألوان أولاً
    const colorResponse = await fetch(`${API_BASE}/products-variants/search/color/${encodeURIComponent(query)}`);
    if (colorResponse.ok) {
      const colorResults = await colorResponse.json();
      if (colorResults.length > 0) {
        return colorResults;
      }
    }

    // البحث بالفئات
    const categoryResponse = await fetch(`${API_BASE}/products-variants/search/category/${encodeURIComponent(query)}`);
    if (categoryResponse.ok) {
      const categoryResults = await categoryResponse.json();
      if (categoryResults.length > 0) {
        return categoryResults;
      }
    }

    return [];
  } catch (error) {
    console.error('Error searching products variants:', error);
    return [];
  }
};

// دالة مساعدة للحصول على المتغيرات المتاحة فقط
export const getAvailableVariants = (variants: ProductVariant[]) => {
  return variants.filter(variant => variant.is_available && variant.stock_quantity > 0);
};

// دالة مساعدة للحصول على أقل سعر للمنتج
export const getMinPrice = (variants: ProductVariant[]) => {
  const availableVariants = getAvailableVariants(variants);
  if (availableVariants.length === 0) return 0;
  return Math.min(...availableVariants.map(v => v.price));
};

// دالة مساعدة للحصول على أعلى سعر للمنتج
export const getMaxPrice = (variants: ProductVariant[]) => {
  const availableVariants = getAvailableVariants(variants);
  if (availableVariants.length === 0) return 0;
  return Math.max(...availableVariants.map(v => v.price));
};

// دالة مساعدة للحصول على الألوان المتاحة
export const getAvailableColors = (variants: ProductVariant[]) => {
  const availableVariants = getAvailableVariants(variants);
  return [...new Set(availableVariants.map(v => v.color))];
};

// دالة مساعدة للحصول على المقاسات المتاحة للون معين
export const getAvailableSizes = (variants: ProductVariant[], color: string) => {
  const colorVariants = variants.filter(v =>
    v.color === color && v.is_available && v.stock_quantity > 0
  );
  return colorVariants.map(v => v.size).sort((a, b) => parseInt(a) - parseInt(b));
};
