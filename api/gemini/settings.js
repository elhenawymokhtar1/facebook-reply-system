// Vercel API Route - Gemini Settings
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  console.log('🤖 [VERCEL] Gemini settings endpoint called!');
  console.log('📝 Method:', req.method);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get Gemini settings with company filtering
      const { company_id } = req.query;
      console.log('🤖 Fetching Gemini settings for company:', company_id);

      let query = supabase
        .from('gemini_settings')
        .select('*');

      if (company_id) {
        query = query.eq('company_id', company_id);
      } else {
        // إذا لم يتم تمرير company_id، جلب الإعدادات العامة (company_id = null)
        query = query.is('company_id', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      const settings = data && data.length > 0 ? data[0] : {
        api_key: '',
        model: 'gemini-1.5-flash',
        prompt_template: '',
        personality_prompt: '',
        products_prompt: '',
        is_enabled: false,
        max_tokens: 1000,
        temperature: 0.7,
        company_id: company_id || null
      };

      console.log('✅ Gemini settings found:', {
        model: settings.model,
        is_enabled: settings.is_enabled,
        hasApiKey: !!settings.api_key,
        company_id: settings.company_id
      });

      res.status(200).json(settings);
    }
    else if (req.method === 'POST') {
      // Update Gemini settings with company association
      console.log('💾 Saving Gemini settings...');
      const settings = req.body;
      const { company_id } = settings;

      console.log('🏢 Company ID:', company_id);

      // تحضير البيانات للحفظ
      const settingsData = {
        ...settings,
        company_id: company_id || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('gemini_settings')
        .upsert(settingsData)
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      console.log('✅ Gemini settings saved successfully');
      res.status(200).json({ success: true, data: data[0] });
    }
    else {
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error in Gemini settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
