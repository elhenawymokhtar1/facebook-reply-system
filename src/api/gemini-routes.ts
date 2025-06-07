import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { GeminiAiServiceSimplified } from '../services/geminiAiSimplified';
import { GeminiMessageProcessor } from '../services/geminiMessageProcessor';

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
  console.log('🤖 [GEMINI] PROCESS ENDPOINT HIT!');
  console.log('📝 [GEMINI] Body:', JSON.stringify(req.body, null, 2));

  try {
    const { senderId, messageText, pageId } = req.body;

    if (!senderId || !messageText || !pageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: senderId, messageText, pageId'
      });
    }

    // إنشاء conversation ID مؤقت
    const conversationId = `temp_${senderId}_${Date.now()}`;

    console.log('🚀 Processing message with enhanced processor...');
    const success = await GeminiMessageProcessor.processIncomingMessage(
      messageText,
      conversationId,
      senderId
    );

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

    const settings = await GeminiAiServiceSimplified.getGeminiSettings();

    if (!settings) {
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

    // استخدام الخدمة المبسطة لحفظ الإعدادات
    await GeminiAiServiceSimplified.saveGeminiSettings(settings);

    // جلب الإعدادات المحدثة
    const updatedSettings = await GeminiAiServiceSimplified.getGeminiSettings();

    console.log('✅ Gemini settings saved successfully');
    res.json(updatedSettings);
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

    // استخدام الخدمة المبسطة للاختبار
    const result = await GeminiAiServiceSimplified.testConnection(api_key);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
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
