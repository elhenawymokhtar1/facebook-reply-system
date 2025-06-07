import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface GeminiSettings {
  api_key: string;
  model: string;
  prompt_template: string;
  is_enabled: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  success: boolean;
  response?: string;
  error?: string;
}

/**
 * خدمة Gemini AI المبسطة والمحسنة
 * تركز على الوظائف الأساسية مع معالجة أفضل للأخطاء
 */
export class GeminiAiServiceSimplified {
  private settings: GeminiSettings;

  constructor(settings: GeminiSettings) {
    this.settings = settings;
  }

  /**
   * إرسال رسالة إلى Gemini AI
   */
  async generateResponse(userMessage: string, conversationHistory?: string[]): Promise<GeminiResponse> {
    try {
      console.log('🤖 Generating Gemini response for:', userMessage.substring(0, 50) + '...');

      // بناء البرومت
      const prompt = this.buildPrompt(userMessage, conversationHistory);

      // إرسال الطلب إلى Gemini API
      const response = await this.callGeminiAPI(prompt);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const generatedText = this.extractTextFromResponse(data);

      if (!generatedText) {
        throw new Error('No valid response generated from Gemini');
      }

      console.log('✅ Gemini response generated successfully');
      return {
        success: true,
        response: generatedText.trim()
      };

    } catch (error) {
      console.error('❌ Error generating Gemini response:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * بناء البرومت مع السياق
   */
  private buildPrompt(userMessage: string, conversationHistory?: string[]): string {
    let prompt = this.settings.prompt_template;

    // إضافة تاريخ المحادثة إذا كان متوفراً
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory.slice(-5).join('\n'); // آخر 5 رسائل فقط
      prompt += `\n\nتاريخ المحادثة السابقة:\n${historyText}`;
    }

    // إضافة الرسالة الحالية
    prompt += `\n\nرسالة العميل الحالية: ${userMessage}`;
    prompt += `\n\nردك:`;

    return prompt;
  }

  /**
   * استدعاء Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<Response> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${this.settings.api_key}`;
    
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: this.settings.temperature || 0.7,
          maxOutputTokens: this.settings.max_tokens || 1000,
          topP: 0.8,
          topK: 10
        }
      })
    });
  }

  /**
   * استخراج النص من استجابة Gemini
   */
  private extractTextFromResponse(data: any): string | null {
    try {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const candidate = data.candidates[0];
        
        if (candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0] && candidate.content.parts[0].text) {
          return candidate.content.parts[0].text;
        }

        // التعامل مع حالة MAX_TOKENS
        if (candidate.finishReason === 'MAX_TOKENS' && candidate.content.parts && candidate.content.parts.length > 0) {
          const partialText = candidate.content.parts[0]?.text || '';
          if (partialText) {
            console.log('⚠️ Using partial response due to MAX_TOKENS');
            return partialText + '...';
          }
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error extracting text from response:', error);
      return null;
    }
  }

  /**
   * الحصول على إعدادات Gemini من قاعدة البيانات
   */
  static async getGeminiSettings(): Promise<GeminiSettings | null> {
    try {
      console.log('🔍 Fetching Gemini settings from database...');
      
      const { data, error } = await supabase
        .from('gemini_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Database error:', error);
        return null;
      }

      if (data && data.api_key && data.api_key !== 'your_gemini_api_key_here') {
        console.log('✅ Using Gemini settings from database');
        return data;
      }

      // محاولة الحصول على الإعدادات من متغيرات البيئة
      console.log('⚠️ No valid database settings found, trying environment variables...');
      return this.getSettingsFromEnv();

    } catch (error) {
      console.error('❌ Error fetching Gemini settings:', error);
      return null;
    }
  }

  /**
   * الحصول على إعدادات Gemini من متغيرات البيئة
   */
  static getSettingsFromEnv(): GeminiSettings | null {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL;
      const enabled = process.env.GEMINI_ENABLED;
      const promptTemplate = process.env.GEMINI_PROMPT_TEMPLATE;

      if (!apiKey || !model || !enabled || !promptTemplate) {
        console.log('⚠️ Missing required Gemini environment variables');
        return null;
      }

      return {
        api_key: apiKey,
        model: model,
        is_enabled: enabled.toLowerCase() === 'true',
        max_tokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
        prompt_template: promptTemplate.replace(/\\n/g, '\n')
      };
    } catch (error) {
      console.error('❌ Error parsing environment variables:', error);
      return null;
    }
  }

  /**
   * حفظ إعدادات Gemini في قاعدة البيانات
   */
  static async saveGeminiSettings(settings: Partial<GeminiSettings>): Promise<void> {
    try {
      console.log('💾 Saving Gemini settings to database...');

      const { data: existingSettings } = await supabase
        .from('gemini_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSettings) {
        // تحديث السجل الموجود
        const { error } = await supabase
          .from('gemini_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
        console.log('✅ Gemini settings updated successfully');
      } else {
        // إنشاء سجل جديد
        const { error } = await supabase
          .from('gemini_settings')
          .insert({
            ...settings,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        console.log('✅ Gemini settings created successfully');
      }
    } catch (error) {
      console.error('❌ Error saving Gemini settings:', error);
      throw error;
    }
  }

  /**
   * اختبار الاتصال مع Gemini API
   */
  static async testConnection(apiKey: string): Promise<{ success: boolean; message: string; response?: string }> {
    try {
      console.log('🧪 Testing Gemini connection...');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'مرحبا، هذا اختبار للاتصال'
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error?.message || 'Failed to connect to Gemini API'
        };
      }

      const data = await response.json();
      const testResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Test response received';

      console.log('✅ Gemini connection test successful');
      return {
        success: true,
        message: 'Connection successful',
        response: testResponse
      };

    } catch (error) {
      console.error('❌ Error testing Gemini connection:', error);
      return {
        success: false,
        message: 'Internal server error during test'
      };
    }
  }
}

/**
 * إنشاء instance من الخدمة المبسطة
 */
export const createGeminiAiServiceSimplified = async (): Promise<GeminiAiServiceSimplified | null> => {
  const settings = await GeminiAiServiceSimplified.getGeminiSettings();
  if (!settings || !settings.is_enabled) {
    return null;
  }
  return new GeminiAiServiceSimplified(settings);
};
