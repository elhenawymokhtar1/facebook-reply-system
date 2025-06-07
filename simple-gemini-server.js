// سيرفر مبسط لاختبار Gemini AI
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3010; // منفذ مختلف

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called!');
  res.json({ message: 'Simple server is working!' });
});

// Gemini settings endpoint
app.get('/api/gemini/settings', async (req, res) => {
  try {
    console.log('🤖 Fetching Gemini settings...');

    const { data, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Gemini settings:', error);
      return res.status(500).json({ error: 'Failed to fetch Gemini settings' });
    }

    if (!data) {
      console.log('⚠️ No Gemini settings found');
      return res.json({
        api_key: '',
        model: 'gemini-1.5-flash',
        prompt_template: '',
        is_enabled: false,
        max_tokens: 1000,
        temperature: 0.7
      });
    }

    console.log('✅ Gemini settings found');
    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/gemini/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple Gemini test endpoint
app.post('/api/gemini/simple-test', async (req, res) => {
  try {
    console.log('🧪 Simple Gemini test called!');
    console.log('📝 Body:', req.body);

    const { messageText } = req.body;

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: 'Missing messageText'
      });
    }

    // جلب إعدادات Gemini
    const { data: settings } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!settings || !settings.is_enabled) {
      return res.json({
        success: false,
        message: 'Gemini is not enabled'
      });
    }

    console.log('🚀 Calling Gemini API...');

    // بناء البرومبت
    const prompt = settings.prompt_template + '\n\nرسالة العميل الحالية: ' + messageText + '\n\nردك:';

    // استدعاء Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.api_key}`, {
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
          temperature: settings.temperature,
          maxOutputTokens: settings.max_tokens,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', errorData);
      return res.status(400).json({
        success: false,
        error: errorData.error?.message || 'Gemini API failed'
      });
    }

    const data = await response.json();
    console.log('✅ Gemini API Response received');

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const candidate = data.candidates[0];
      
      if (candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0] && candidate.content.parts[0].text) {
        const generatedText = candidate.content.parts[0].text;
        
        console.log('📤 Gemini response:', generatedText.substring(0, 100) + '...');

        return res.json({
          success: true,
          response: generatedText,
          message: 'Gemini AI processed successfully'
        });
      }
    }

    return res.json({
      success: false,
      message: 'Invalid response from Gemini'
    });

  } catch (error) {
    console.error('❌ Error in simple Gemini test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Gemini server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🤖 Gemini test: http://localhost:${PORT}/api/gemini/simple-test`);
}).on('error', (error) => {
  console.error('❌ Server error:', error);
});
