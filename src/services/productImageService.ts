import { supabase } from "@/integrations/supabase/client";

export interface ProductImage {
  id: string;
  product_name: string;
  color: string;
  image_url: string;
  image_filename: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export class ProductImageService {
  // الحصول على صورة منتج بلون معين
  static async getProductImageByColor(productName: string, color: string): Promise<ProductImage | null> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_name', productName)
        .eq('color', color)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching product image:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching product image:', error);
      return null;
    }
  }

  // الحصول على جميع صور منتج
  static async getProductImages(productName: string): Promise<ProductImage[]> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_name', productName)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching product images:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
  }

  // البحث عن اللون في النص
  static detectColorInText(text: string): string | null {
    const colorMappings = {
      // الألوان الأساسية
      'أبيض': 'أبيض',
      'ابيض': 'أبيض',
      'white': 'أبيض',
      'أسود': 'أسود',
      'اسود': 'أسود',
      'black': 'أسود',
      'أحمر': 'أحمر',
      'احمر': 'أحمر',
      'red': 'أحمر',
      'أزرق': 'أزرق',
      'ازرق': 'أزرق',
      'blue': 'أزرق',
      'أخضر': 'أخضر',
      'اخضر': 'أخضر',
      'green': 'أخضر',
      'أصفر': 'أصفر',
      'اصفر': 'أصفر',
      'yellow': 'أصفر',
      'بني': 'بني',
      'brown': 'بني',
      'رمادي': 'رمادي',
      'gray': 'رمادي',
      'grey': 'رمادي',
      'وردي': 'وردي',
      'pink': 'وردي',
      'بنفسجي': 'بنفسجي',
      'purple': 'بنفسجي'
    };

    const lowerText = text.toLowerCase();

    for (const [key, value] of Object.entries(colorMappings)) {
      if (lowerText.includes(key.toLowerCase())) {
        return value;
      }
    }

    return null;
  }

  // تحليل طلب الصورة
  static isImageRequest(text: string): boolean {
    const imageKeywords = [
      'صورة', 'صوره', 'شكل', 'شكله', 'أشوف', 'اشوف', 'أرى', 'ارى',
      'عايزة أشوف', 'عايز أشوف', 'ممكن صورة', 'ممكن اشوف',
      'شكله إيه', 'شكله ايه', 'عايزة أرى', 'عايز ارى',
      'ابعت', 'ابعتلي', 'ابعت لي', 'ورني', 'وريني', 'فين الصورة',
      'image', 'photo', 'picture', 'show', 'see'
    ];

    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  // إنشاء رسالة مع صورة
  static createImageMessage(productImage: ProductImage): string {
    const colorEmojis: { [key: string]: string } = {
      'أبيض': '🤍',
      'أسود': '🖤',
      'أحمر': '❤️',
      'أزرق': '💙',
      'أخضر': '💚',
      'أصفر': '💛',
      'بني': '🤎',
      'رمادي': '🩶',
      'وردي': '💗',
      'بنفسجي': '💜'
    };

    const emoji = colorEmojis[productImage.color] || '✨';

    return `تفضلي يا قمر! ${emoji} دي صورة ${productImage.product_name} باللون ${productImage.color} الجميل!

${productImage.description || 'منتج رائع وعملي مناسب لجميع المناسبات'}

إيه رأيك؟ حلو ولا إيه؟ 😍`;
  }

  // إضافة صورة منتج جديدة
  static async addProductImage(imageData: Omit<ProductImage, 'id' | 'created_at' | 'updated_at'>): Promise<ProductImage | null> {
    try {
      // التحقق من صحة البيانات
      if (!imageData.color || !imageData.image_url) {
        console.error('Missing required fields: color or image_url');
        return null;
      }

      // تنظيف رابط الصورة
      let cleanImageUrl = imageData.image_url.trim();

      // إذا كان الرابط خارجي، نتركه كما هو
      // إذا كان محلي، نتأكد من أنه يبدأ بـ /
      if (!cleanImageUrl.startsWith('http') && !cleanImageUrl.startsWith('/')) {
        cleanImageUrl = `/product-images/${cleanImageUrl}`;
      }

      const cleanedData = {
        ...imageData,
        image_url: cleanImageUrl,
        image_filename: imageData.image_filename || cleanImageUrl.split('/').pop() || 'image.jpg'
      };

      const { data, error } = await supabase
        .from('product_images')
        .insert(cleanedData)
        .select()
        .single();

      if (error) {
        console.error('Error adding product image:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error adding product image:', error);
      return null;
    }
  }

  // تحديث صورة منتج
  static async updateProductImage(id: string, updates: Partial<ProductImage>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating product image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating product image:', error);
      return false;
    }
  }

  // حذف صورة منتج
  static async deleteProductImage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting product image:', error);
      return false;
    }
  }

  // الحصول على جميع الصور للإدارة
  static async getAllProductImages(): Promise<ProductImage[]> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .order('product_name', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching all product images:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all product images:', error);
      return [];
    }
  }

  // تحديث ترتيب العرض
  static async updateDisplayOrder(id: string, newOrder: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ display_order: newOrder, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating display order:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating display order:', error);
      return false;
    }
  }
}
