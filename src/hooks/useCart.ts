import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  user_id?: string;
  session_id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  // معلومات المنتج المرتبطة
  product?: {
    id: string;
    name: string;
    image_url?: string;
    stock_quantity: number;
    status: string;
  };
}

export interface AddToCartData {
  productId: string;
  quantity?: number;
  sessionId: string;
  userId?: string;
}

export const useCart = (sessionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState(
    sessionId || localStorage.getItem('cart_session_id') || `session_${Date.now()}_${Math.random()}`
  );

  // حفظ session ID في localStorage
  useEffect(() => {
    localStorage.setItem('cart_session_id', currentSessionId);
  }, [currentSessionId]);

  // جلب عناصر السلة
  const {
    data: cartItems = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cart', currentSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecommerce_cart')
        .select(`
          *,
          product:ecommerce_products(
            id,
            name,
            image_url,
            stock_quantity,
            status,
            price,
            sale_price
          )
        `)
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as CartItem[];
    },
    enabled: !!currentSessionId,
  });

  // إضافة منتج للسلة
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1, sessionId, userId }: AddToCartData) => {
      // الحصول على تفاصيل المنتج
      const { data: product, error: productError } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('المنتج غير موجود');
      }

      if (product.status !== 'active') {
        throw new Error('المنتج غير متاح حالياً');
      }

      if (product.stock_quantity < quantity) {
        throw new Error('الكمية المطلوبة غير متوفرة في المخزون');
      }

      // الحصول على معرف المتجر (مع التعامل مع المنتجات القديمة)
      let storeId = product.store_id;

      // إذا لم يكن هناك store_id، نحصل على أول متجر متاح أو ننشئ واحد
      if (!storeId) {
        console.log('⚠️ المنتج لا يحتوي على store_id، جاري البحث عن متجر...');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .limit(1);

        if (stores && stores.length > 0) {
          storeId = stores[0].id;
          console.log('✅ تم العثور على متجر:', storeId);

          // تحديث المنتج ليحتوي على store_id
          await supabase
            .from('ecommerce_products')
            .update({ store_id: storeId })
            .eq('id', productId);

        } else {
          // إنشاء متجر افتراضي
          console.log('🏪 إنشاء متجر افتراضي...');
          const { data: newStore, error: storeError } = await supabase
            .from('stores')
            .insert({
              name: 'سوان شوب',
              slug: 'swan-shop',
              description: 'متجر سوان الإلكتروني',
              owner_email: 'admin@swanshop.com',
              currency: 'EGP',
              is_active: true
            })
            .select('id')
            .single();

          if (storeError) {
            throw new Error('فشل في إنشاء متجر افتراضي: ' + storeError.message);
          }

          storeId = newStore.id;
          console.log('✅ تم إنشاء متجر جديد:', storeId);

          // تحديث المنتج ليحتوي على store_id الجديد
          await supabase
            .from('ecommerce_products')
            .update({ store_id: storeId })
            .eq('id', productId);
        }
      }

      // التحقق من وجود المنتج في السلة مسبقاً
      const { data: existingItem } = await supabase
        .from('ecommerce_cart')
        .select('*')
        .eq('session_id', sessionId)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // تحديث الكمية
        const newQuantity = existingItem.quantity + quantity;
        
        if (product.stock_quantity < newQuantity) {
          throw new Error('الكمية الإجمالية تتجاوز المخزون المتاح');
        }

        const { data, error } = await supabase
          .from('ecommerce_cart')
          .update({ 
            quantity: newQuantity,
            price: product.sale_price || product.price
          })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      } else {
        // إضافة عنصر جديد
        const cartItem = {
          user_id: userId,
          session_id: sessionId,
          store_id: storeId,
          product_id: productId,
          quantity,
          price: product.sale_price || product.price
        };

        const { data, error } = await supabase
          .from('ecommerce_cart')
          .insert(cartItem)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', currentSessionId] });
      // لا نعرض toast هنا لأن Shop.tsx يتولى ذلك
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في useCart:', error);
      // لا نعرض toast هنا لأن Shop.tsx يتولى ذلك
    },
  });

  // تحديث كمية منتج في السلة
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        throw new Error('الكمية يجب أن تكون أكبر من صفر');
      }

      // الحصول على عنصر السلة
      const { data: cartItem, error: cartError } = await supabase
        .from('ecommerce_cart')
        .select(`
          *,
          product:ecommerce_products(stock_quantity, status)
        `)
        .eq('id', itemId)
        .single();

      if (cartError || !cartItem) {
        throw new Error('عنصر السلة غير موجود');
      }

      if (cartItem.product?.status !== 'active') {
        throw new Error('المنتج غير متاح حالياً');
      }

      if ((cartItem.product?.stock_quantity || 0) < quantity) {
        throw new Error('الكمية المطلوبة غير متوفرة في المخزون');
      }

      const { data, error } = await supabase
        .from('ecommerce_cart')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', currentSessionId] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الكمية",
        variant: "destructive",
      });
    },
  });

  // حذف منتج من السلة
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('ecommerce_cart')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error(error.message);
      }

      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', currentSessionId] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
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

  // مسح السلة بالكامل
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ecommerce_cart')
        .delete()
        .eq('session_id', currentSessionId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', currentSessionId] });
      toast({
        title: "تم مسح السلة",
        description: "تم مسح جميع المنتجات من السلة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في مسح السلة",
        variant: "destructive",
      });
    },
  });

  // حساب إجمالي السلة
  const getCartSummary = () => {
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.14; // ضريبة 14%
    const shipping = subtotal > 500 ? 0 : 50; // شحن مجاني فوق 500 ج
    const total = subtotal + tax + shipping;

    return {
      itemsCount,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping,
      total: Math.round(total * 100) / 100
    };
  };

  // التحقق من توفر المنتجات في السلة
  const validateCart = async () => {
    const invalidItems = [];

    for (const item of cartItems) {
      if (!item.product) {
        invalidItems.push({ ...item, reason: 'المنتج غير موجود' });
        continue;
      }

      if (item.product.status !== 'active') {
        invalidItems.push({ ...item, reason: 'المنتج غير متاح' });
        continue;
      }

      if (item.product.stock_quantity < item.quantity) {
        invalidItems.push({ 
          ...item, 
          reason: `الكمية المتاحة: ${item.product.stock_quantity}` 
        });
        continue;
      }
    }

    return {
      isValid: invalidItems.length === 0,
      invalidItems
    };
  };

  return {
    // البيانات
    cartItems,
    isLoading,
    error,
    sessionId: currentSessionId,
    
    // العمليات
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    
    // حالات التحميل
    isAdding: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
    
    // المساعدات
    refetch,
    getCartSummary,
    validateCart,
    setSessionId: setCurrentSessionId
  };
};
