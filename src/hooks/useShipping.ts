import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShippingMethod {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  type: 'flat_rate' | 'weight_based' | 'distance_based' | 'express' | 'same_day';
  base_cost: number;
  cost_per_kg?: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  zones?: string[];
  is_active: boolean;
  created_at: string;
}

export interface ShippingZone {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  cities: string[];
  additional_cost: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateShippingMethodData {
  name: string;
  description?: string;
  type: string;
  base_cost: number;
  cost_per_kg?: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  zones?: string[];
  is_active?: boolean;
}

export interface CreateShippingZoneData {
  name: string;
  description?: string;
  cities: string[];
  additional_cost?: number;
  is_active?: boolean;
}

export interface ShippingCalculation {
  method_id: string;
  method_name: string;
  base_cost: number;
  weight_cost: number;
  zone_cost: number;
  total_cost: number;
  estimated_days: string;
  is_free: boolean;
}

export const useShipping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب طرق الشحن
  const {
    data: shippingMethods = [],
    isLoading: methodsLoading,
    error: methodsError,
    refetch: refetchMethods
  } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as ShippingMethod[];
    },
  });

  // جلب مناطق الشحن
  const {
    data: shippingZones = [],
    isLoading: zonesLoading,
    error: zonesError,
    refetch: refetchZones
  } = useQuery({
    queryKey: ['shipping-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as ShippingZone[];
    },
  });

  const isLoading = methodsLoading || zonesLoading;

  // إنشاء طريقة شحن جديدة
  const createShippingMethodMutation = useMutation({
    mutationFn: async (methodData: CreateShippingMethodData) => {
      // الحصول على معرف المتجر الافتراضي
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('لا يوجد متجر متاح');
      }

      const newMethod = {
        store_id: stores[0].id,
        name: methodData.name,
        description: methodData.description,
        type: methodData.type,
        base_cost: methodData.base_cost,
        cost_per_kg: methodData.cost_per_kg || 0,
        free_shipping_threshold: methodData.free_shipping_threshold,
        estimated_days_min: methodData.estimated_days_min,
        estimated_days_max: methodData.estimated_days_max,
        zones: methodData.zones || [],
        is_active: methodData.is_active ?? true
      };

      const { data, error } = await supabase
        .from('shipping_methods')
        .insert(newMethod)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as ShippingMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast({
        title: "نجح",
        description: "تم إنشاء طريقة الشحن بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء طريقة الشحن",
        variant: "destructive",
      });
    },
  });

  // إنشاء منطقة شحن جديدة
  const createShippingZoneMutation = useMutation({
    mutationFn: async (zoneData: CreateShippingZoneData) => {
      // الحصول على معرف المتجر الافتراضي
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('لا يوجد متجر متاح');
      }

      const newZone = {
        store_id: stores[0].id,
        name: zoneData.name,
        description: zoneData.description,
        cities: zoneData.cities,
        additional_cost: zoneData.additional_cost || 0,
        is_active: zoneData.is_active ?? true
      };

      const { data, error } = await supabase
        .from('shipping_zones')
        .insert(newZone)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as ShippingZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      toast({
        title: "نجح",
        description: "تم إنشاء منطقة الشحن بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء منطقة الشحن",
        variant: "destructive",
      });
    },
  });

  // تحديث طريقة شحن
  const updateShippingMethodMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateShippingMethodData> }) => {
      const { data, error } = await supabase
        .from('shipping_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as ShippingMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast({
        title: "نجح",
        description: "تم تحديث طريقة الشحن بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث طريقة الشحن",
        variant: "destructive",
      });
    },
  });

  // حذف طريقة شحن
  const deleteShippingMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast({
        title: "نجح",
        description: "تم حذف طريقة الشحن بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف طريقة الشحن",
        variant: "destructive",
      });
    },
  });

  // حساب تكلفة الشحن
  const calculateShipping = async (
    cartWeight: number, 
    cartTotal: number, 
    customerCity: string
  ): Promise<ShippingCalculation[]> => {
    const availableMethods = shippingMethods.filter(method => method.is_active);
    const calculations: ShippingCalculation[] = [];

    for (const method of availableMethods) {
      let totalCost = method.base_cost;
      let weightCost = 0;
      let zoneCost = 0;

      // حساب تكلفة الوزن
      if (method.cost_per_kg && cartWeight > 0) {
        weightCost = method.cost_per_kg * cartWeight;
        totalCost += weightCost;
      }

      // حساب تكلفة المنطقة
      const zone = shippingZones.find(z => 
        z.is_active && z.cities.some(city => 
          city.toLowerCase().includes(customerCity.toLowerCase())
        )
      );

      if (zone) {
        zoneCost = zone.additional_cost;
        totalCost += zoneCost;
      }

      // التحقق من الشحن المجاني
      const isFree = method.free_shipping_threshold && cartTotal >= method.free_shipping_threshold;
      if (isFree) {
        totalCost = 0;
      }

      calculations.push({
        method_id: method.id,
        method_name: method.name,
        base_cost: method.base_cost,
        weight_cost: weightCost,
        zone_cost: zoneCost,
        total_cost: Math.max(0, totalCost),
        estimated_days: `${method.estimated_days_min}-${method.estimated_days_max}`,
        is_free: isFree || false
      });
    }

    return calculations.sort((a, b) => a.total_cost - b.total_cost);
  };

  // إحصائيات الشحن
  const getShippingStats = () => {
    const totalMethods = shippingMethods.length;
    const totalZones = shippingZones.length;
    const activeMethods = shippingMethods.filter(m => m.is_active).length;
    const averageCost = totalMethods > 0 
      ? Math.round(shippingMethods.reduce((sum, m) => sum + m.base_cost, 0) / totalMethods)
      : 0;
    const averageDeliveryTime = totalMethods > 0
      ? Math.round(shippingMethods.reduce((sum, m) => sum + ((m.estimated_days_min + m.estimated_days_max) / 2), 0) / totalMethods)
      : 0;

    return {
      totalMethods,
      totalZones,
      activeMethods,
      averageCost,
      averageDeliveryTime
    };
  };

  // البحث والفلترة
  const searchShippingMethods = (searchTerm: string, filter?: string) => {
    return shippingMethods.filter(method => {
      const matchesSearch = !searchTerm || 
        method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (method.description && method.description.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (filter && filter !== 'all') {
        switch (filter) {
          case 'active':
            matchesFilter = method.is_active;
            break;
          case 'inactive':
            matchesFilter = !method.is_active;
            break;
          case 'express':
            matchesFilter = method.type === 'express' || method.type === 'same_day';
            break;
          case 'standard':
            matchesFilter = method.type === 'flat_rate' || method.type === 'weight_based';
            break;
        }
      }

      return matchesSearch && matchesFilter;
    });
  };

  return {
    // البيانات
    shippingMethods,
    shippingZones,
    isLoading,
    error: methodsError || zonesError,
    
    // العمليات
    createShippingMethod: createShippingMethodMutation.mutate,
    createShippingZone: createShippingZoneMutation.mutate,
    updateShippingMethod: updateShippingMethodMutation.mutate,
    deleteShippingMethod: deleteShippingMethodMutation.mutate,
    calculateShipping,
    
    // حالات التحميل
    isCreating: createShippingMethodMutation.isPending || createShippingZoneMutation.isPending,
    isUpdating: updateShippingMethodMutation.isPending,
    isDeleting: deleteShippingMethodMutation.isPending,
    
    // المساعدات
    refetch: () => {
      refetchMethods();
      refetchZones();
    },
    getShippingStats,
    searchShippingMethods
  };
};
