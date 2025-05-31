import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test route
router.get('/test', (req, res) => {
  console.log('🧪 Gemini test route called!');
  res.json({ message: 'Gemini API is working!' });
});

// Get Gemini settings
router.get('/settings', async (req, res) => {
  try {
    console.log('🤖 Fetching Gemini settings...');
    
    const { data, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Gemini settings:', error);
      return res.status(500).json({ error: 'Failed to fetch Gemini settings' });
    }

    if (!data) {
      console.log('⚠️ No Gemini settings found, returning defaults');
      return res.json({
        api_key: '',
        model: 'gemini-1.5-flash',
        prompt_template: '',
        is_enabled: false,
        max_tokens: 1000,
        temperature: 0.7
      });
    }

    console.log('✅ Gemini settings found:', {
      model: data.model,
      is_enabled: data.is_enabled,
      hasApiKey: !!data.api_key
    });

    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/gemini/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Gemini settings
router.post('/settings', async (req, res) => {
  try {
    console.log('🤖 Saving Gemini settings...');
    const settings = req.body;

    // التحقق من وجود سجل موجود
    const { data: existingSettings } = await supabase
      .from('gemini_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSettings) {
      // تحديث السجل الموجود
      const { data, error } = await supabase
        .from('gemini_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Gemini settings updated successfully');
      res.json(data);
    } else {
      // إنشاء سجل جديد
      const { data, error } = await supabase
        .from('gemini_settings')
        .insert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Gemini settings created successfully');
      res.json(data);
    }
  } catch (error) {
    console.error('Error in POST /api/gemini/settings:', error);
    res.status(500).json({ error: 'Failed to save Gemini settings' });
  }
});

// Test Gemini connection
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Testing Gemini connection...');
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // اختبار الاتصال مع Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api_key}`, {
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
      console.error('❌ Gemini API test failed:', errorData);
      return res.status(400).json({ 
        success: false, 
        error: errorData.error?.message || 'Failed to connect to Gemini API' 
      });
    }

    const data = await response.json();
    console.log('✅ Gemini API test successful');
    
    res.json({ 
      success: true, 
      message: 'Connection successful',
      response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Test response received'
    });
  } catch (error) {
    console.error('Error in POST /api/gemini/test:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during test' 
    });
  }
});

export default router;
