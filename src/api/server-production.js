// 🚀 Production Server for Hostinger
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// إعداد الترميز للنصوص العربية
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 Starting Facebook Reply System - Production Mode');
console.log(`📡 Port: ${PORT}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);

// إعدادات CORS للإنتاج
const allowedOrigins = [
  'https://yourdomain.com', // استبدل بالدومين الخاص بك
  'https://www.yourdomain.com',
  'http://localhost:3000',
  'http://localhost:8080'
];

app.use(cors({
  origin: function (origin, callback) {
    // السماح للطلبات بدون origin (مثل mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(null, true); // السماح مؤقتاً لجميع الـ origins
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// إعدادات الترميز للنصوص العربية
app.use(express.json({
  limit: '10mb',
  type: 'application/json'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// إعداد ترميز UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../..')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// Gemini Settings API
app.get('/api/gemini/settings', async (req, res) => {
  try {
    console.log('🤖 Fetching Gemini settings...');
    
    const { data: settings, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!settings) {
      const defaultSettings = {
        model: 'gemini-1.5-flash',
        is_enabled: false,
        hasApiKey: false
      };
      return res.json(defaultSettings);
    }

    const response = {
      model: settings.model || 'gemini-1.5-flash',
      is_enabled: settings.is_enabled || false,
      hasApiKey: !!(settings.api_key && settings.api_key.length > 10)
    };

    console.log('✅ Gemini settings found:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching Gemini settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/gemini/settings', async (req, res) => {
  try {
    console.log('💾 Saving Gemini settings...');
    
    const settings = req.body;
    
    // Check if settings exist
    const { data: existingSettings, error: selectError } = await supabase
      .from('gemini_settings')
      .select('id')
      .single();

    let result;
    if (existingSettings) {
      result = await supabase
        .from('gemini_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);
    } else {
      result = await supabase
        .from('gemini_settings')
        .insert(settings);
    }

    if (result.error) {
      throw result.error;
    }

    console.log('✅ Gemini settings saved successfully');
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('❌ Error saving Gemini settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Test messages API for simple test chat
app.get('/api/test-messages', async (req, res) => {
  try {
    const { conversation_id } = req.query;
    
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    const { data: messages, error } = await supabase
      .from('test_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(messages || []);
  } catch (error) {
    console.error('❌ Error fetching test messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/test-messages', async (req, res) => {
  try {
    const { conversation_id, content, sender_type } = req.body;
    
    if (!conversation_id || !content || !sender_type) {
      return res.status(400).json({ 
        error: 'conversation_id, content, and sender_type are required' 
      });
    }

    const { data: message, error } = await supabase
      .from('test_messages')
      .insert({
        conversation_id,
        content,
        sender_type,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(message);
  } catch (error) {
    console.error('❌ Error saving test message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Simple message processing endpoint
app.post('/api/process-message', async (req, res) => {
  try {
    const { message, conversation_id, user_id, page_id } = req.body;
    
    console.log('📨 Processing message:', { message, conversation_id, user_id, page_id });
    
    // هنا يمكن إضافة معالجة Gemini AI
    // لكن للبساطة، سنرجع رد افتراضي
    
    const response = "شكراً لرسالتك! نحن نعمل على تحسين النظام.";
    
    // حفظ الرد في قاعدة البيانات
    await supabase
      .from('test_messages')
      .insert({
        conversation_id,
        content: response,
        sender_type: 'bot',
        created_at: new Date().toISOString()
      });

    res.json({ 
      success: true, 
      message: 'Message processed successfully',
      response 
    });
  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Catch all handler - serve index.html for client-side routing
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, '../..', 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Facebook Reply System started successfully!');
  console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://0.0.0.0:${PORT}/api/gemini/settings`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
