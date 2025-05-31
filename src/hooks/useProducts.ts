import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  color: string;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

interface CreateProductData {
  name: string;
  price: number;
  description: string;
  color: string;
  category: string;
  image_url: string;
  is_available: boolean;
}

interface UpdateProductData extends CreateProductData {
  id: string;
}

const API_BASE = 'http://localhost:3002/api';

export const useProducts = () => {
  const queryClient = useQueryClient();

  // جلب جميع المنتجات
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  // إضافة منتج جديد
  const addProduct = useMutation({
    mutationFn: async (productData: CreateProductData): Promise<Product> => {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إضافة المنتج: ${error.message}`);
    },
  });

  // تحديث منتج
  const updateProduct = useMutation({
    mutationFn: async (productData: UpdateProductData): Promise<Product> => {
      const { id, ...updateData } = productData;
      const response = await fetch(`${API_BASE}/products/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث المنتج: ${error.message}`);
    },
  });

  // حذف منتج
  const deleteProduct = useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`خطأ في حذف المنتج: ${error.message}`);
    },
  });

  // تفعيل/إلغاء تفعيل منتج
  const toggleAvailability = useMutation({
    mutationFn: async (productId: string): Promise<Product> => {
      const response = await fetch(`${API_BASE}/products/${productId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle product availability');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث حالة المنتج: ${error.message}`);
    },
  });

  return {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
  };
};

// Hook للبحث في المنتجات بالألوان
export const useProductsByColor = (color: string) => {
  return useQuery({
    queryKey: ['products', 'color', color],
    queryFn: async (): Promise<Product[]> => {
      if (!color) return [];
      
      const response = await fetch(`${API_BASE}/products/search/color/${encodeURIComponent(color)}`);
      if (!response.ok) {
        throw new Error('Failed to search products by color');
      }
      return response.json();
    },
    enabled: !!color,
    staleTime: 60000, // 1 minute
  });
};

// Hook للبحث في المنتجات بالفئة
export const useProductsByCategory = (category: string) => {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: async (): Promise<Product[]> => {
      if (!category) return [];
      
      const response = await fetch(`${API_BASE}/products/search/category/${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error('Failed to search products by category');
      }
      return response.json();
    },
    enabled: !!category,
    staleTime: 60000, // 1 minute
  });
};

// Hook للحصول على المنتجات المتاحة فقط
export const useAvailableProducts = () => {
  return useQuery({
    queryKey: ['products', 'available'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch(`${API_BASE}/products/available`);
      if (!response.ok) {
        throw new Error('Failed to fetch available products');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

// دالة مساعدة للبحث في المنتجات
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    // البحث بالألوان أولاً
    const colorResponse = await fetch(`${API_BASE}/products/search/color/${encodeURIComponent(query)}`);
    if (colorResponse.ok) {
      const colorResults = await colorResponse.json();
      if (colorResults.length > 0) {
        return colorResults;
      }
    }

    // البحث بالفئات
    const categoryResponse = await fetch(`${API_BASE}/products/search/category/${encodeURIComponent(query)}`);
    if (categoryResponse.ok) {
      const categoryResults = await categoryResponse.json();
      if (categoryResults.length > 0) {
        return categoryResults;
      }
    }

    // إذا لم نجد نتائج، نرجع مصفوفة فارغة
    return [];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
