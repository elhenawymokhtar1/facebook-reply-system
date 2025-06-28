import { supabase } from "@/integrations/supabase/client";
import { GeminiSettings } from './geminiAi';

export class GeminiBackupService {
  // تم إزالة fs module لتوافق البراوزر - استخدام localStorage بدلاً من ذلك

  // حفظ الإعدادات في localStorage (متوافق مع البراوزر)
  static async saveToBackup(settings: GeminiSettings): Promise<void> {
    try {
      const backupData = {
        ...settings,
        backup_timestamp: new Date().toISOString(),
        auto_restore: true
      };

      // حفظ في localStorage بدلاً من ملف
      if (typeof window !== 'undefined') {
        localStorage.setItem('gemini-backup', JSON.stringify(backupData));
        console.log('✅ Gemini settings backed up to localStorage');
      } else {
        console.log('⚠️ localStorage not available (server-side)');
      }
    } catch (error) {
      console.error('❌ Error backing up Gemini settings:', error);
    }
  }

  // استرجاع الإعدادات من localStorage
  static async loadFromBackup(): Promise<GeminiSettings | null> {
    try {
      if (typeof window === 'undefined') {
        console.log('⚠️ localStorage not available (server-side)');
        return null;
      }

      const backupData = localStorage.getItem('gemini-backup');
      if (!backupData) {
        console.log('⚠️ No backup data found in localStorage');
        return null;
      }

      const parsedData = JSON.parse(backupData);
      console.log('✅ Gemini settings loaded from localStorage backup');

      return {
        api_key: parsedData.api_key,
        model: parsedData.model,
        is_enabled: backupData.is_enabled,
        max_tokens: backupData.max_tokens,
        temperature: backupData.temperature,
        prompt_template: backupData.prompt_template
      };
    } catch (error) {
      console.error('❌ Error loading backup:', error);
      return null;
    }
  }

  // استرجاع الإعدادات تلقائ<|im_start|> إلى قاعدة البيانات
  static async restoreToDatabase(): Promise<boolean> {
    try {
      const backupSettings = await this.loadFromBackup();
      if (!backupSettings) {
        console.log('❌ No backup settings to restore');
        return false;
      }

      // حفظ في قاعدة البيانات
      const { error } = await supabase
        .from('gemini_settings')
        .upsert({
          ...backupSettings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error restoring to database:', error);
        return false;
      }

      console.log('🔄 Gemini settings restored to database from backup');
      return true;
    } catch (error) {
      console.error('❌ Error in restore process:', error);
      return false;
    }
  }

  // التحقق من وجود الإعدادات واسترجاعها إذا لزم الأمر
  static async ensureSettingsExist(): Promise<GeminiSettings | null> {
    try {
      // محاولة الحصول على الإعدادات من قاعدة البيانات
      const { data, error } = await supabase
        .from('gemini_settings')
        .select('*')
        .single();

      if (data && !error) {
        console.log('✅ Gemini settings found in database');
        // حفظ backup جديد
        await this.saveToBackup(data);
        return data;
      }

      // إذا لم توجد في قاعدة البيانات، استرجع من الـ backup
      console.log('⚠️ Gemini settings not found in database, trying backup...');
      const restored = await this.restoreToDatabase();
      
      if (restored) {
        // إعادة محاولة الحصول على الإعدادات
        const { data: restoredData } = await supabase
          .from('gemini_settings')
          .select('*')
          .single();
        
        return restoredData;
      }

      return null;
    } catch (error) {
      console.error('❌ Error ensuring settings exist:', error);
      return null;
    }
  }

  // تحديث الإعدادات مع حفظ backup
  static async updateSettings(settings: Partial<GeminiSettings>): Promise<void> {
    try {
      // تحديث قاعدة البيانات
      const { error } = await supabase
        .from('gemini_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // حفظ backup
      const fullSettings = await this.ensureSettingsExist();
      if (fullSettings) {
        await this.saveToBackup(fullSettings);
      }

      console.log('✅ Gemini settings updated and backed up');
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }
}
