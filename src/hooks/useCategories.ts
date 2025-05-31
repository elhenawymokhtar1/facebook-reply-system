import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mockAPI } from '@/data/mockData';

// أنواع البيانات
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  total_products?: number;
  active_products?: number;
  total_stock?: number;
}

interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
  is_active?: boolean;
}

const API_BASE = 'http://localhost:3002/api';

export const useCategories = () => {
  const queryClient = useQueryClient();

  // جلب جميع الفئات مع الإحصائيات
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: mockAPI.getCategories,
    staleTime: 30000,
    cacheTime: 300000,
  });

  // إضافة فئة جديدة
  const addCategory = useMutation({
    mutationFn: mockAPI.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'active'] });
      toast.success('تم إضافة الفئة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إضافة الفئة: ${error.message}`);
    },
  });

  // تحديث فئة
  const updateCategory = useMutation({
    mutationFn: async (categoryData: UpdateCategoryData): Promise<Category> => {
      const { id, ...updateData } = categoryData;
      const response = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'active'] });
      toast.success('تم تحديث الفئة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث الفئة: ${error.message}`);
    },
  });

  // حذف فئة
  const deleteCategory = useMutation({
    mutationFn: mockAPI.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'active'] });
      toast.success('تم حذف الفئة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في حذف الفئة: ${error.message}`);
    },
  });

  // تفعيل/إلغاء تفعيل فئة
  const toggleCategory = useMutation({
    mutationFn: async (categoryId: string): Promise<Category> => {
      const response = await fetch(`${API_BASE}/categories/${categoryId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle category status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'active'] });
      toast.success('تم تحديث حالة الفئة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في تحديث حالة الفئة: ${error.message}`);
    },
  });

  // إعادة ترتيب الفئات
  const reorderCategories = useMutation({
    mutationFn: async (categories: Category[]): Promise<void> => {
      const response = await fetch(`${API_BASE}/categories/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder categories');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'active'] });
      toast.success('تم إعادة ترتيب الفئات بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`خطأ في إعادة ترتيب الفئات: ${error.message}`);
    },
  });

  return {
    categories,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    reorderCategories,
  };
};

// Hook للحصول على الفئات النشطة فقط
export const useActiveCategories = () => {
  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: mockAPI.getActiveCategories,
    staleTime: 60000,
    cacheTime: 300000,
  });
};

// Hook للبحث في الفئات
export const useSearchCategories = (query: string) => {
  return useQuery({
    queryKey: ['categories', 'search', query],
    queryFn: async (): Promise<Category[]> => {
      if (!query.trim()) return [];

      const response = await fetch(`${API_BASE}/categories/search/${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search categories');
      }
      return response.json();
    },
    enabled: !!query.trim(),
    staleTime: 30000,
  });
};

// Hook للحصول على فئة واحدة
export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['categories', categoryId],
    queryFn: async (): Promise<Category> => {
      const response = await fetch(`${API_BASE}/categories/${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }
      return response.json();
    },
    enabled: !!categoryId,
    staleTime: 30000,
  });
};

// دوال مساعدة
export const getCategoryIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'activity': '🏃',
    'crown': '👑',
    'coffee': '☕',
    'briefcase': '💼',
    'baby': '👶',
    'heart': '💖',
    'package': '📦',
    'star': '⭐',
    'home': '🏠',
    'car': '🚗',
    'book': '📚',
    'music': '🎵',
    'camera': '📷',
    'phone': '📱',
    'laptop': '💻',
    'watch': '⌚',
    'shirt': '👕',
    'shoe': '👟',
    'bag': '👜',
    'gift': '🎁'
  };

  return iconMap[iconName] || '📦';
};

export const getCategoryColor = (colorName: string) => {
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-100 text-blue-800 border-blue-200',
    'green': 'bg-green-100 text-green-800 border-green-200',
    'purple': 'bg-purple-100 text-purple-800 border-purple-200',
    'red': 'bg-red-100 text-red-800 border-red-200',
    'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'pink': 'bg-pink-100 text-pink-800 border-pink-200',
    'gray': 'bg-gray-100 text-gray-800 border-gray-200',
    'indigo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'orange': 'bg-orange-100 text-orange-800 border-orange-200',
    'teal': 'bg-teal-100 text-teal-800 border-teal-200',
    'rose': 'bg-rose-100 text-rose-800 border-rose-200'
  };

  return colorMap[colorName] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// دالة للحصول على الفئات مرتبة حسب الاستخدام
export const getCategoriesByUsage = (categories: Category[]) => {
  return [...categories].sort((a, b) => {
    const aProducts = a.active_products || 0;
    const bProducts = b.active_products || 0;
    return bProducts - aProducts;
  });
};

// دالة للحصول على إحصائيات الفئات
export const getCategoriesStats = (categories: Category[]) => {
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.total_products || 0), 0);
  const totalStock = categories.reduce((sum, c) => sum + (c.total_stock || 0), 0);

  return {
    totalCategories,
    activeCategories,
    inactiveCategories: totalCategories - activeCategories,
    totalProducts,
    totalStock,
    averageProductsPerCategory: totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0
  };
};
