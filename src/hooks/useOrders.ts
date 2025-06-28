import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

export interface Order {
  id: string;
  store_id: string;
  order_number: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  currency: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  notes?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address: string;
  product_name?: string | null;
  product_size?: string | null;
  product_color?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  shipping_address?: any;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface CreateOrderData {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  notes?: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export const useOrders = () => {
  console.log('🚀 useOrders hook called!');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { company } = useCurrentCompany();

  console.log('🏢 Current company in useOrders:', {
    company: company,
    companyId: company?.id,
    companyName: company?.name
  });

  // Alert للتأكد من إن الـ hook بيشتغل
  if (company?.id) {
    console.log('🎯 COMPANY FOUND:', company.name, 'ID:', company.id);
  } else {
    console.log('❌ NO COMPANY FOUND!');
  }

  // إعادة تعيين الـ cache عند تغيير الشركة
  useEffect(() => {
    if (company?.id) {
      console.log('🔄 Company changed, invalidating orders cache:', company.name);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['company-stores'] });
    }
  }, [company?.id, queryClient]);

  // جلب متاجر الشركة الحالية
  const {
    data: stores = [],
    isLoading: storesLoading,
    isSuccess: storesSuccess
  } = useQuery({
    queryKey: ['company-stores', company?.id],
    queryFn: async () => {
      console.log('🏪 Fetching stores for company:', {
        companyId: company?.id,
        companyName: company?.name
      });

      if (!company?.id) {
        console.log('❌ No company ID, returning empty stores');
        return [];
      }

      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching stores:', error);
        throw new Error(error.message);
      }

      console.log('🏪 Stores found:', {
        companyName: company?.name,
        storesCount: data?.length || 0,
        stores: data || []
      });

      return data || [];
    },
    enabled: !!company?.id,
    staleTime: 0, // البيانات تصبح قديمة فوراً لضمان التحديث
    cacheTime: 1000 * 60 * 5, // الاحتفاظ بالـ cache لمدة 5 دقائق
  });

  // جلب الطلبات المرتبطة بمتاجر الشركة الحالية فقط
  const {
    data: orders = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', company?.id, stores.map(s => s.id).sort().join(',')],
    queryFn: async () => {
      console.log('🔍 useOrders queryFn called with:', {
        companyId: company?.id,
        companyName: company?.name,
        storesCount: stores.length,
        stores: stores
      });

      if (!company?.id) {
        console.log('❌ No company ID, returning empty array');
        return [];
      }

      console.log('🔍 About to query orders for company:', {
        companyId: company.id,
        companyName: company.name,
        queryFilter: `company_id = '${company.id}'`
      });

      // فلترة الطلبات بناءً على company_id
      const { data, error } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      console.log('📊 Raw query result:', {
        totalResults: data?.length || 0,
        companyIdUsed: company.id,
        results: data?.map(o => ({
          order_number: o.order_number,
          company_id: o.company_id,
          matches: o.company_id === company.id
        })) || []
      });

      if (error) {
        console.error('❌ Error fetching orders:', error);
        throw new Error(error.message);
      }

      console.log('📦 طلبات الشركة:', {
        companyName: company?.name,
        companyId: company?.id,
        ordersCount: data?.length || 0,
        orders: data?.map(o => ({
          id: o.id,
          order_number: o.order_number,
          company_id: o.company_id,
          customer_name: o.customer_name
        })) || []
      });

      console.log('🔍 تفاصيل إضافية:', {
        totalOrdersReceived: data?.length,
        companyIdUsedForFiltering: company.id,
        queryUsed: `SELECT * FROM ecommerce_orders WHERE company_id = '${company.id}'`,
        shouldOnlyShowOrdersFromThisCompany: company.id
      });

      return data as Order[];
    },
    enabled: !!company?.id, // فقط نحتاج معرف الشركة، RLS سيتولى الفلترة
    staleTime: 0, // البيانات تصبح قديمة فوراً لضمان التحديث
    cacheTime: 0, // عدم الاحتفاظ بالـ cache لضمان التحديث الفوري
    refetchOnMount: true, // إعادة التحميل عند mount
    refetchOnWindowFocus: true, // إعادة التحميل عند focus
  });

  // جلب طلب واحد مع عناصره
  const getOrderById = async (orderId: string) => {
    const { data: order, error: orderError } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      throw new Error(orderError.message);
    }

    const { data: items, error: itemsError } = await supabase
      .from('ecommerce_order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    return {
      order: order as Order,
      items: items as OrderItem[]
    };
  };

  // إنشاء طلب جديد
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      // الحصول على معرف المتجر الافتراضي
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('لا يوجد متجر متاح');
      }

      // إنشاء رقم طلب فريد
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // التأكد من وجود معرف الشركة
      if (!company?.id) {
        throw new Error('لا يمكن إنشاء طلب بدون تحديد الشركة');
      }

      // إنشاء الطلب
      const newOrder = {
        store_id: stores[0].id,
        company_id: company.id, // إضافة معرف الشركة
        order_number: orderNumber,
        status: 'pending' as const,
        currency: 'EGP',
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax_amount,
        shipping_amount: orderData.shipping_amount,
        discount_amount: 0,
        total_amount: orderData.total_amount,
        payment_method: orderData.payment_method,
        payment_status: 'pending' as const,
        notes: orderData.notes,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address
      };

      const { data: order, error: orderError } = await supabase
        .from('ecommerce_orders')
        .insert(newOrder)
        .select()
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      // إضافة عناصر الطلب
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('ecommerce_order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      // تحديث المخزون
      for (const item of orderData.items) {
        const { error: stockError } = await supabase.rpc('update_product_stock', {
          product_id: item.product_id,
          quantity_sold: item.quantity
        });

        if (stockError) {
          console.error('Error updating stock:', stockError);
        }
      }

      return order as Order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "تم إنشاء الطلب بنجاح!",
        description: `رقم الطلب: ${order.order_number}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  // تحديث حالة الطلب
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const updateData: any = { status };

      // إضافة تواريخ خاصة حسب الحالة
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('ecommerce_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "تم تحديث حالة الطلب",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  // تحديث حالة الدفع
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: Order['payment_status'] }) => {
      const { data, error } = await supabase
        .from('ecommerce_orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "تم تحديث حالة الدفع",
        description: "تم تحديث حالة الدفع بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الدفع",
        variant: "destructive",
      });
    },
  });

  // حذف طلب
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // حذف عناصر الطلب أولاً
      const { error: itemsError } = await supabase
        .from('ecommerce_order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      // حذف الطلب
      const { error: orderError } = await supabase
        .from('ecommerce_orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        throw new Error(orderError.message);
      }

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "تم حذف الطلب",
        description: "تم حذف الطلب بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الطلب",
        variant: "destructive",
      });
    },
  });

  // إحصائيات الطلبات
  const getOrdersStats = () => {
    if (!orders.length) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      };
    }

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0),
      averageOrderValue: 0
    };

    stats.averageOrderValue = stats.total > 0 
      ? Math.round(orders.reduce((sum, o) => sum + o.total_amount, 0) / stats.total)
      : 0;

    return stats;
  };

  // البحث والفلترة
  const searchOrders = (searchTerm: string, status?: string, paymentStatus?: string) => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm);

      const matchesStatus = !status || status === 'all' || order.status === status;
      const matchesPaymentStatus = !paymentStatus || paymentStatus === 'all' || order.payment_status === paymentStatus;

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  };

  return {
    // البيانات
    orders,
    isLoading,
    error,
    
    // العمليات
    createOrder: createOrderMutation.mutate,
    updateOrderStatus: updateOrderStatusMutation.mutate,
    updatePaymentStatus: updatePaymentStatusMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,
    getOrderById,
    
    // حالات التحميل
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderStatusMutation.isPending,
    isDeleting: deleteOrderMutation.isPending,
    
    // المساعدات
    refetch,
    getOrdersStats,
    searchOrders
  };
};
