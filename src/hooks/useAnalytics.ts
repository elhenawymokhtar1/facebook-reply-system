import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useToast } from '@/hooks/use-toast';

export interface SalesData {
  totalRevenue: number;
  revenueChange: number;
  monthlySales: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface ProductData {
  totalSold: number;
  soldChange: number;
  topProducts: Array<{
    id: string;
    name: string;
    sold: number;
    revenue: number;
    image_url?: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock_quantity: number;
  }>;
}

export interface CustomerData {
  totalCustomers: number;
  customersChange: number;
  newCustomers: number;
  returningCustomers: number;
  topCustomers: Array<{
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

export interface OrderData {
  totalOrders: number;
  ordersChange: number;
  averageOrderValue: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export const useAnalytics = (dateRange: number = 30) => {
  const { toast } = useToast();
  const { company } = useCurrentCompany();

  // حساب تاريخ البداية
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  // جلب متاجر الشركة الحالية
  const { data: stores = [] } = useQuery({
    queryKey: ['company-stores', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!company?.id,
  });

  // جلب بيانات المبيعات
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError
  } = useQuery({
    queryKey: ['analytics-sales', dateRange, company?.id],
    queryFn: async (): Promise<SalesData> => {
      if (!company?.id || stores.length === 0) {
        return {
          totalRevenue: 0,
          revenueChange: 0,
          monthlySales: [],
          dailySales: []
        };
      }

      const storeIds = stores.map(store => store.id);

      // جلب إجمالي المبيعات
      const { data: orders, error: ordersError } = await supabase
        .from('ecommerce_orders')
        .select('total_amount, created_at')
        .in('store_id', storeIds)
        .gte('created_at', startDate.toISOString())
        .eq('payment_status', 'paid');

      if (ordersError) throw new Error(ordersError.message);

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // حساب التغيير مقارنة بالفترة السابقة
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - dateRange);

      const { data: previousOrders } = await supabase
        .from('ecommerce_orders')
        .select('total_amount')
        .in('store_id', storeIds)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())
        .eq('payment_status', 'paid');

      const previousRevenue = previousOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // بيانات المبيعات الشهرية (آخر 6 شهور)
      const monthlySales = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const { data: monthOrders } = await supabase
          .from('ecommerce_orders')
          .select('total_amount')
          .in('store_id', storeIds)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString())
          .eq('payment_status', 'paid');

        const monthRevenue = monthOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

        monthlySales.push({
          month: monthStart.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
          revenue: monthRevenue,
          orders: monthOrders?.length || 0
        });
      }

      return {
        totalRevenue: Math.round(totalRevenue),
        revenueChange: Math.round(revenueChange),
        monthlySales,
        dailySales: [] // سيتم تطويرها لاحقاً
      };
    },
    enabled: !!company?.id && stores.length > 0,
  });

  // جلب بيانات المنتجات
  const {
    data: productData,
    isLoading: productLoading,
    error: productError
  } = useQuery({
    queryKey: ['analytics-products', dateRange],
    queryFn: async (): Promise<ProductData> => {
      // جلب أفضل المنتجات مبيعاً
      const { data: orderItems, error: itemsError } = await supabase
        .from('ecommerce_order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          total,
          ecommerce_orders!inner(created_at, payment_status)
        `)
        .gte('ecommerce_orders.created_at', startDate.toISOString())
        .eq('ecommerce_orders.payment_status', 'paid');

      if (itemsError) throw new Error(itemsError.message);

      // تجميع بيانات المنتجات
      const productStats = new Map();
      let totalSold = 0;

      orderItems?.forEach(item => {
        totalSold += item.quantity;
        
        if (productStats.has(item.product_id)) {
          const existing = productStats.get(item.product_id);
          existing.sold += item.quantity;
          existing.revenue += item.total;
        } else {
          productStats.set(item.product_id, {
            id: item.product_id,
            name: item.product_name,
            sold: item.quantity,
            revenue: item.total
          });
        }
      });

      // ترتيب المنتجات حسب المبيعات
      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10);

      // جلب المنتجات منخفضة المخزون
      const { data: lowStockProducts } = await supabase
        .from('ecommerce_products')
        .select('id, name, stock_quantity')
        .lte('stock_quantity', 5)
        .eq('status', 'active')
        .order('stock_quantity', { ascending: true })
        .limit(10);

      return {
        totalSold,
        soldChange: 0, // سيتم حسابها لاحقاً
        topProducts,
        lowStockProducts: lowStockProducts || []
      };
    },
  });

  // جلب بيانات العملاء
  const {
    data: customerData,
    isLoading: customerLoading,
    error: customerError
  } = useQuery({
    queryKey: ['analytics-customers', dateRange, company?.id],
    queryFn: async (): Promise<CustomerData> => {
      if (!company?.id || stores.length === 0) {
        return {
          totalCustomers: 0,
          newCustomers: 0,
          customerGrowth: 0,
          topCustomers: []
        };
      }

      const storeIds = stores.map(store => store.id);

      // جلب العملاء الفريدين
      const { data: customers, error: customersError } = await supabase
        .from('ecommerce_orders')
        .select('customer_name, customer_phone, total_amount, created_at')
        .in('store_id', storeIds)
        .gte('created_at', startDate.toISOString());

      if (customersError) throw new Error(customersError.message);

      // تجميع بيانات العملاء
      const customerStats = new Map();
      customers?.forEach(order => {
        const key = `${order.customer_name}_${order.customer_phone}`;
        if (customerStats.has(key)) {
          const existing = customerStats.get(key);
          existing.totalOrders += 1;
          existing.totalSpent += order.total_amount;
        } else {
          customerStats.set(key, {
            name: order.customer_name,
            phone: order.customer_phone,
            totalOrders: 1,
            totalSpent: order.total_amount
          });
        }
      });

      const topCustomers = Array.from(customerStats.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      return {
        totalCustomers: customerStats.size,
        customersChange: 0, // سيتم حسابها لاحقاً
        newCustomers: 0,
        returningCustomers: 0,
        topCustomers
      };
    },
    enabled: !!company?.id && stores.length > 0,
  });

  // جلب بيانات الطلبات
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError
  } = useQuery({
    queryKey: ['analytics-orders', dateRange, company?.id],
    queryFn: async (): Promise<OrderData> => {
      if (!company?.id || stores.length === 0) {
        return {
          totalOrders: 0,
          averageOrderValue: 0,
          orderGrowth: 0,
          recentOrders: [],
          ordersByStatus: []
        };
      }

      const storeIds = stores.map(store => store.id);

      // جلب الطلبات
      const { data: orders, error: ordersError } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .in('store_id', storeIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw new Error(ordersError.message);

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // تجميع الطلبات حسب الحالة
      const ordersByStatus = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };

      orders?.forEach(order => {
        if (ordersByStatus.hasOwnProperty(order.status)) {
          ordersByStatus[order.status as keyof typeof ordersByStatus]++;
        }
      });

      return {
        totalOrders,
        ordersChange: 0, // سيتم حسابها لاحقاً
        averageOrderValue: Math.round(averageOrderValue),
        recentOrders: orders?.slice(0, 10) || [],
        ordersByStatus
      };
    },
    enabled: !!company?.id && stores.length > 0,
  });

  const isLoading = salesLoading || productLoading || customerLoading || orderLoading;
  const error = salesError || productError || customerError || orderError;

  // تصدير التقرير
  const exportReport = async (reportType: string, dateRange: string) => {
    try {
      // هنا يمكن إضافة منطق تصدير التقرير
      toast({
        title: "جاري التصدير",
        description: "سيتم تطوير ميزة التصدير قريباً",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  // الحصول على بيانات نطاق تاريخي محدد
  const getDateRangeData = async (startDate: Date, endDate: Date) => {
    // سيتم تطويرها لاحقاً
    return null;
  };

  return {
    salesData,
    productData,
    customerData,
    orderData,
    isLoading,
    error,
    exportReport,
    getDateRangeData
  };
};
