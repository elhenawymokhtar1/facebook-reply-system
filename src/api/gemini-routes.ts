import express from 'express';
import { createClient } from '@supabase/supabase-js';
// import { GeminiAiServiceSimplified } from '../services/geminiAiSimplified'; // تم حذفه
// import { GeminiMessageProcessor } from '../services/geminiMessageProcessor'; // تم حذفه
import { SimpleGeminiService } from '../services/simpleGeminiService';

const router = express.Router();

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test route
router.get('/test', (req, res) => {
  console.log('🧪 [GEMINI] Test route called!');
  res.json({ message: 'Gemini API is working!' });
});

// Gemini message processing endpoint (enhanced)
router.post('/process', async (req, res) => {
  console.log('🤖🤖🤖 [GEMINI] PROCESS ENDPOINT HIT! 🤖🤖🤖');
  console.log('📝 [GEMINI] Body:', JSON.stringify(req.body, null, 2));
  console.log('🕒 [GEMINI] Timestamp:', new Date().toISOString());

  try {
    const { senderId, messageText, pageId, conversationId: customConversationId } = req.body;

    if (!senderId || !messageText || !pageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: senderId, messageText, pageId'
      });
    }

    // استخدام conversation ID مخصص إذا تم توفيره، وإلا إنشاء مؤقت
    const conversationId = customConversationId || `temp_${senderId}_${pageId}`;
    console.log('🆔 [GEMINI] Using conversation ID:', conversationId);

    console.log('🚀🚀🚀 Processing message with simple processor...');
    console.log(`📨 Message: "${messageText}"`);
    console.log(`👤 Sender: ${senderId}`);
    console.log(`💬 Conversation: ${conversationId}`);

    const success = await SimpleGeminiService.processMessage(
      messageText,
      conversationId,
      senderId
    );

    console.log(`✅ SimpleGeminiService result: ${success}`);

    res.json({
      success: success,
      message: success ? 'Gemini AI processed successfully' : 'Gemini AI failed to process message'
    });

  } catch (error) {
    console.error('❌ Error in Gemini process:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Get Gemini settings
router.get('/settings', async (req, res) => {
  try {
    console.log('🤖 Fetching Gemini settings...');

    // جلب الإعدادات مباشرة من قاعدة البيانات
    const { data: settings, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!settings) {
      console.log('⚠️ No Gemini settings found, returning defaults');
      return res.json({
        api_key: '',
        model: 'gemini-1.5-flash',
        prompt_template: '',
        personality_prompt: '',
        products_prompt: '',
        is_enabled: false,
        max_tokens: 1000,
        temperature: 0.7
      });
    }

    console.log('✅ Gemini settings found:', {
      model: settings.model,
      is_enabled: settings.is_enabled,
      hasApiKey: !!settings.api_key
    });

    res.json(settings);
  } catch (error) {
    console.error('❌ Error in GET /api/gemini/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Gemini settings
router.post('/settings', async (req, res) => {
  try {
    console.log('🤖 Saving Gemini settings...');
    const settings = req.body;

    // حفظ الإعدادات مباشرة في قاعدة البيانات
    const { data: savedSettings, error } = await supabase
      .from('gemini_settings')
      .upsert({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('✅ Gemini settings saved successfully');
    res.json(savedSettings);
  } catch (error) {
    console.error('❌ Error in POST /api/gemini/settings:', error);
    res.status(500).json({ error: 'Failed to save Gemini settings' });
  }
});

// Test Gemini connection
router.post('/test', async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // اختبار الاتصال مباشرة مع Gemini API
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'مرحبا، هذا اختبار للاتصال' }] }]
        })
      }
    );

    if (testResponse.ok) {
      res.json({
        success: true,
        message: 'تم الاتصال بـ Gemini AI بنجاح'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'فشل في الاتصال بـ Gemini API'
      });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/gemini/test:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during test'
    });
  }
});

export default router;
