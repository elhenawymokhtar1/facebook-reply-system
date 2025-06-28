import { supabase } from "@/integrations/supabase/client";

export interface OrderData {
  id?: string;
  order_number?: string;
  conversation_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product_name: string;
  product_size: string;
  product_color: string;
  quantity?: number;
  unit_price: number;
  shipping_cost?: number;
  total_price: number;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
  product?: string;
  size?: string;
  color?: string;
}

export class OrderService {
  // استخراج معلومات العميل من النص باستخدام regex
  static extractCustomerInfo(text: string): Partial<CustomerInfo> {
    const info: Partial<CustomerInfo> = {};

    // استخراج الاسم (أنماط متعددة)
    let nameMatch = text.match(/(?:اسمي|انا\s+اسمي|انا\s+سمي|سمي)\s+([^من]+?)(?:\s+من|\s*$)/i);
    if (!nameMatch) {
      nameMatch = text.match(/(?:اسمي|انا)\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+من|\s+عايز|\s+محتاج|\s*$)/i);
    }
    // إضافة نمط جديد لاستخراج الاسم من بداية الجملة مع رقم هاتف
    if (!nameMatch) {
      nameMatch = text.match(/(?:انا\s+)?([أ-ي]+)\s+[٠-٩\d]/);
    }
    if (nameMatch) {
      info.name = nameMatch[1].trim();
    }

    // استخراج رقم الهاتف (أرقام مصرية - عربية وإنجليزية)
    let phoneMatch = text.match(/(?:[٠-٩\d]{11})/);
    if (!phoneMatch) {
      phoneMatch = text.match(/(?:01[0-9]|011|012|010|015)\d{8}/);
    }
    if (!phoneMatch) {
      phoneMatch = text.match(/(?:[٠١][٠-٩\d]{10})/);
    }
    if (phoneMatch) {
      // تحويل الأرقام العربية إلى إنجليزية
      let phone = phoneMatch[0];
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

      for (let i = 0; i < arabicNumbers.length; i++) {
        phone = phone.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
      }

      // التحقق من أن الرقم مصري صحيح
      if (phone.match(/^(01[0-9]|011|012|010|015)\d{8}$/)) {
        info.phone = phone;
      }
    }

    // استخراج العنوان (إذا احتوى على كلمات مكانية)
    const addressKeywords = ['شارع', 'مدينة', 'محافظة', 'منطقة', 'حي', 'بلوك', 'عمارة', 'برج', 'فيلا', 'بيت', 'اسكندرية', 'القاهرة', 'الجيزة', 'سموحة', 'النصر'];
    const hasAddressKeywords = addressKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
    if (hasAddressKeywords) {
      // استخراج الجزء الذي يحتوي على العنوان
      const addressMatch = text.match(/(?:من\s+)?(.*?(?:شارع|مدينة|محافظة|منطقة|حي|بلوك|عمارة|برج|فيلا|بيت|اسكندرية|القاهرة|الجيزة|سموحة|النصر).*?)(?:\s+رقم|\s+٠|\s*$)/i);
      if (addressMatch) {
        info.address = addressMatch[1].trim();
      } else if (hasAddressKeywords) {
        info.address = text.trim();
      }
    }

    // استخراج المقاس (أرقام عربية وإنجليزية)
    let sizeMatch = text.match(/مقاس\s*([٠-٩\d]+)/i) ||
                   text.match(/([٠-٩\d]+)\s*مقاس/i);

    // إذا لم نجد مقاس صريح، ابحث عن أرقام من رقمين في النطاق المعقول
    if (!sizeMatch) {
      const allNumbers = text.match(/[٠-٩\d]{1,2}/g);
      if (allNumbers) {
        for (const num of allNumbers) {
          // تحويل الأرقام العربية إلى إنجليزية
          let convertedNum = num;
          const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
          const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

          for (let i = 0; i < arabicNumbers.length; i++) {
            convertedNum = convertedNum.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
          }

          const numValue = parseInt(convertedNum);
          // التحقق من أن الرقم في نطاق مقاسات الأحذية المعقولة
          if (numValue >= 35 && numValue <= 45) {
            sizeMatch = [num, num]; // إنشاء match مشابه للـ regex
            break;
          }
        }
      }
    }

    if (sizeMatch) {
      // تحويل الأرقام العربية إلى إنجليزية
      let size = sizeMatch[1];
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

      for (let i = 0; i < arabicNumbers.length; i++) {
        size = size.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
      }

      // التحقق من أن المقاس في النطاق المعقول
      const sizeNum = parseInt(size);
      if (sizeNum >= 35 && sizeNum <= 45) {
        info.size = size;
      }
    }

    return info;
  }

  // تحليل المحادثة لاستخراج معلومات الطلب الكاملة
  static async analyzeConversationForOrder(conversationId: string): Promise<CustomerInfo | null> {
    try {
      // الحصول على جميع رسائل المحادثة
      const { data: messages, error } = await supabase
        .from('messages')
        .select('content, sender_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error || !messages) {
        console.error('Error fetching conversation messages:', error);
        return null;
      }

      const customerInfo: CustomerInfo = {};

      // تحليل كل رسالة من العميل
      for (const message of messages) {
        if (message.sender_type === 'customer') {
          const extractedInfo = this.extractCustomerInfo(message.content);

          // دمج المعلومات المستخرجة
          if (extractedInfo.name && !customerInfo.name) {
            customerInfo.name = extractedInfo.name;
          }
          if (extractedInfo.phone && !customerInfo.phone) {
            customerInfo.phone = extractedInfo.phone;
          }
          if (extractedInfo.address && !customerInfo.address) {
            customerInfo.address = extractedInfo.address;
          }
          if (extractedInfo.size && !customerInfo.size) {
            customerInfo.size = extractedInfo.size;
          }
          if (extractedInfo.color && !customerInfo.color) {
            customerInfo.color = extractedInfo.color;
          }
        }
      }

      // تحديد المنتج (افتراضي: كوتشي)
      customerInfo.product = 'كوتشي حريمي';

      return customerInfo;
    } catch (error) {
      console.error('Error analyzing conversation for order:', error);
      return null;
    }
  }

  // التحقق من اكتمال بيانات الطلب
  static isOrderDataComplete(customerInfo: CustomerInfo): boolean {
    return !!(
      customerInfo.name &&
      customerInfo.phone &&
      customerInfo.address &&
      customerInfo.size &&
      customerInfo.color
    );
  }

  // إنشاء طلب جديد
  static async createOrder(orderData: Omit<OrderData, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<OrderData | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          quantity: orderData.quantity || 1,
          shipping_cost: orderData.shipping_cost || 50,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return null;
      }

      console.log('✅ Order created successfully:', data.order_number);
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  // الحصول على طلبات الشركة الحالية فقط
  static async getAllOrders(): Promise<OrderData[]> {
    try {
      // الحصول على بيانات الشركة الحالية
      const companyData = localStorage.getItem('company');
      if (!companyData) {
        console.warn('لا توجد بيانات شركة في localStorage');
        return [];
      }

      const company = JSON.parse(companyData);
      if (!company?.id) {
        console.warn('معرف الشركة غير موجود');
        return [];
      }

      // جلب متاجر الشركة أولاً
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (storesError) {
        console.error('Error fetching stores:', storesError);
        return [];
      }

      if (!stores || stores.length === 0) {
        console.log('لا توجد متاجر للشركة');
        return [];
      }

      const storeIds = stores.map(store => store.id);

      // جلب الطلبات المرتبطة بمتاجر الشركة فقط
      const { data, error } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .in('store_id', storeIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      console.log('📦 طلبات الشركة من OrderService:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // تحديث حالة الطلب
  static async updateOrderStatus(orderId: string, status: OrderData['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return false;
      }

      console.log(`✅ Order ${orderId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // الحصول على طلب بواسطة conversation_id
  static async getOrderByConversationId(conversationId: string): Promise<OrderData | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching order by conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching order by conversation:', error);
      return null;
    }
  }
}
