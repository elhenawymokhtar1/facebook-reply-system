// استخدام API بدلاً من Supabase مباشرة

interface ProductColor {
  id: string;
  color_key: string;
  arabic_name: string;
  english_name: string;
  image_url: string;
  keywords: string[];
  is_active: boolean;
}

export class ColorService {
  // الحصول على جميع الألوان النشطة
  static async getActiveColors(): Promise<ProductColor[]> {
    try {
      const { data, error } = await supabase
        .from('product_colors')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching colors:', error);
      return [];
    }
  }

  // اكتشاف اللون من النص باستخدام API
  static async detectColorFromText(text: string): Promise<ProductColor | null> {
    try {
      const response = await fetch('http://localhost:3002/api/colors/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const result = await response.json();
        return result.detected ? result.color : null;
      }

      return null;
    } catch (error) {
      console.error('Error detecting color:', error);
      return null;
    }
  }

  // إضافة لون جديد
  static async addColor(colorData: {
    colorKey: string;
    arabicName: string;
    englishName: string;
    imageUrl: string;
    keywords: string[];
  }): Promise<ProductColor | null> {
    try {
      const { data, error } = await supabase
        .from('product_colors')
        .insert({
          color_key: colorData.colorKey,
          arabic_name: colorData.arabicName,
          english_name: colorData.englishName,
          image_url: colorData.imageUrl,
          keywords: colorData.keywords
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding color:', error);
      return null;
    }
  }

  // تحديث لون
  static async updateColor(id: string, colorData: Partial<{
    colorKey: string;
    arabicName: string;
    englishName: string;
    imageUrl: string;
    keywords: string[];
  }>): Promise<ProductColor | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (colorData.colorKey) updateData.color_key = colorData.colorKey;
      if (colorData.arabicName) updateData.arabic_name = colorData.arabicName;
      if (colorData.englishName) updateData.english_name = colorData.englishName;
      if (colorData.imageUrl) updateData.image_url = colorData.imageUrl;
      if (colorData.keywords) updateData.keywords = colorData.keywords;

      const { data, error } = await supabase
        .from('product_colors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating color:', error);
      return null;
    }
  }

  // حذف لون (soft delete)
  static async deleteColor(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_colors')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting color:', error);
      return false;
    }
  }

  // إنشاء خريطة الألوان للاستخدام في الكود القديم
  static async getColorMap(): Promise<Record<string, string>> {
    try {
      const colors = await this.getActiveColors();
      const colorMap: Record<string, string> = {};

      colors.forEach(color => {
        colorMap[color.color_key] = color.image_url;
      });

      return colorMap;
    } catch (error) {
      console.error('Error creating color map:', error);
      return {};
    }
  }

  // البحث المتقدم في الألوان
  static async searchColors(query: string): Promise<ProductColor[]> {
    try {
      const colors = await this.getActiveColors();
      const lowerQuery = query.toLowerCase();

      return colors.filter(color => 
        color.arabic_name.toLowerCase().includes(lowerQuery) ||
        color.english_name.toLowerCase().includes(lowerQuery) ||
        color.color_key.toLowerCase().includes(lowerQuery) ||
        color.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching colors:', error);
      return [];
    }
  }
}
