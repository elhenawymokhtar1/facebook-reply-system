/**
 * Supabase Admin Client
 * يستخدم Service Role Key لتجاوز RLS والوصول لكل البيانات
 * ⚠️ يجب استخدامه بحذر شديد مع التأكد من الفلترة اليدوية
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';

// Service Role Key - يتجاوز RLS
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODMwNzYwNiwiZXhwIjoyMDYzODgzNjA2fQ.wQFJkVOhWJGJJOqOhWJGJJOqOhWJGJJOqOhWJGJJOqO';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 🔒 دالة آمنة لجلب الطلبات مع فلترة الشركة
 */
export const getOrdersForCompany = async (companyId: string) => {
  if (!companyId) {
    throw new Error('معرف الشركة مطلوب');
  }

  console.log('🔍 جلب طلبات الشركة:', companyId);

  const { data, error } = await supabaseAdmin
    .from('ecommerce_orders')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ خطأ في جلب الطلبات:', error);
    throw error;
  }

  console.log('✅ تم جلب الطلبات:', data?.length || 0);
  return data;
};

/**
 * 🔒 دالة آمنة لإنشاء طلب جديد مع التأكد من الشركة
 */
export const createOrderForCompany = async (orderData: any, companyId: string) => {
  if (!companyId) {
    throw new Error('معرف الشركة مطلوب');
  }

  // التأكد من إضافة company_id للطلب
  const orderWithCompany = {
    ...orderData,
    company_id: companyId
  };

  console.log('📝 إنشاء طلب جديد للشركة:', companyId);

  const { data, error } = await supabaseAdmin
    .from('ecommerce_orders')
    .insert(orderWithCompany)
    .select()
    .single();

  if (error) {
    console.error('❌ خطأ في إنشاء الطلب:', error);
    throw error;
  }

  console.log('✅ تم إنشاء الطلب:', data.id);
  return data;
};

/**
 * 🔒 دالة آمنة لتحديث طلب مع التأكد من الملكية
 */
export const updateOrderForCompany = async (orderId: string, updates: any, companyId: string) => {
  if (!companyId || !orderId) {
    throw new Error('معرف الشركة والطلب مطلوبان');
  }

  // التحقق من أن الطلب ينتمي للشركة
  const { data: existingOrder } = await supabaseAdmin
    .from('ecommerce_orders')
    .select('company_id')
    .eq('id', orderId)
    .single();

  if (!existingOrder || existingOrder.company_id !== companyId) {
    throw new Error('الطلب غير موجود أو لا تملك صلاحية تعديله');
  }

  console.log('📝 تحديث طلب للشركة:', { orderId, companyId });

  const { data, error } = await supabaseAdmin
    .from('ecommerce_orders')
    .update(updates)
    .eq('id', orderId)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    console.error('❌ خطأ في تحديث الطلب:', error);
    throw error;
  }

  console.log('✅ تم تحديث الطلب:', data.id);
  return data;
};

/**
 * 🔒 دالة آمنة لحذف طلب مع التأكد من الملكية
 */
export const deleteOrderForCompany = async (orderId: string, companyId: string) => {
  if (!companyId || !orderId) {
    throw new Error('معرف الشركة والطلب مطلوبان');
  }

  // التحقق من أن الطلب ينتمي للشركة
  const { data: existingOrder } = await supabaseAdmin
    .from('ecommerce_orders')
    .select('company_id')
    .eq('id', orderId)
    .single();

  if (!existingOrder || existingOrder.company_id !== companyId) {
    throw new Error('الطلب غير موجود أو لا تملك صلاحية حذفه');
  }

  console.log('🗑️ حذف طلب للشركة:', { orderId, companyId });

  const { error } = await supabaseAdmin
    .from('ecommerce_orders')
    .delete()
    .eq('id', orderId)
    .eq('company_id', companyId);

  if (error) {
    console.error('❌ خطأ في حذف الطلب:', error);
    throw error;
  }

  console.log('✅ تم حذف الطلب:', orderId);
  return true;
};
