// خادم مبسط لـ WhatsApp AI Settings فقط
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3002;

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

console.log('🚀 Starting WhatsApp AI Settings server...');

// إضافة middleware للـ logging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('✅ Test endpoint hit!');
  res.json({ success: true, message: 'WhatsApp AI Settings Server is working!' });
});

// WhatsApp AI Settings - GET
app.get('/api/whatsapp-baileys/ai-settings', async (req, res) => {
  try {
    console.log('🤖 [API] جلب إعدادات WhatsApp AI...');

    const { data: settings, error } = await supabase
      .from('whatsapp_ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [API] خطأ في قاعدة البيانات:', error);
      throw error;
    }

    if (!settings) {
      console.log('📝 [API] لا توجد إعدادات، إرجاع الإعدادات الافتراضية...');
      const defaultSettings = {
        is_enabled: false,
        use_existing_prompt: true,
        custom_prompt: 'أنت مساعد ذكي لمتجر WhatsApp. اسمك سارة وأنت بائعة لطيفة ومتفهمة.\n\n🎯 مهامك:\n- مساعدة العملاء في اختيار المنتجات\n- الرد على الاستفسارات بطريقة ودودة\n- إنشاء الطلبات عند اكتمال البيانات\n- تقديم معلومات المنتجات والأسعار\n\n💬 أسلوب التحدث:\n- استخدمي اللهجة المصرية البسيطة\n- كوني ودودة ومساعدة\n- اشرحي بوضوح ووضوح\n\n🛒 للطلبات:\n- اجمعي: الاسم، الهاتف، العنوان، المنتج، المقاس، اللون\n- عند اكتمال البيانات: [CREATE_ORDER: البيانات]\n\n📱 للتواصل:\n- واتساب: 01032792040\n- المتجر: /shop\n- السلة: /cart',
        api_key: '',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        max_tokens: 1000,
        can_access_orders: true,
        can_access_products: true,
        auto_reply_enabled: true
      };
      
      return res.json({
        success: true,
        settings: defaultSettings
      });
    }

    console.log('✅ [API] تم جلب إعدادات WhatsApp AI بنجاح');
    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب إعدادات WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإعدادات: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

// WhatsApp AI Settings - POST
app.post('/api/whatsapp-baileys/ai-settings', async (req, res) => {
  try {
    console.log('💾 [API] حفظ إعدادات WhatsApp AI...');
    console.log('📝 [API] البيانات المرسلة:', JSON.stringify(req.body, null, 2));

    const settings = req.body;

    // التحقق من وجود سجل موجود
    const { data: existingSettings, error: selectError } = await supabase
      .from('whatsapp_ai_settings')
      .select('id')
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ [API] خطأ في البحث عن السجل الموجود:', selectError);
      throw selectError;
    }

    let result;
    if (existingSettings) {
      // تحديث السجل الموجود
      console.log('🔄 [API] تحديث السجل الموجود بـ ID:', existingSettings.id);
      result = await supabase
        .from('whatsapp_ai_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);
    } else {
      // إنشاء سجل جديد
      console.log('➕ [API] إنشاء سجل جديد...');
      result = await supabase
        .from('whatsapp_ai_settings')
        .insert(settings);
    }

    if (result.error) {
      console.error('❌ [API] خطأ في عملية الحفظ:', result.error);
      throw result.error;
    }

    console.log('✅ [API] تم حفظ إعدادات WhatsApp AI بنجاح');

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حفظ إعدادات WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حفظ الإعدادات: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

// Test AI endpoint (محاكاة)
app.post('/api/whatsapp-baileys/test-ai', async (req, res) => {
  try {
    console.log('🧪 [API] اختبار WhatsApp AI...');
    console.log('📝 [API] بيانات الاختبار:', req.body);

    const { message, settings } = req.body;

    if (!message || !settings) {
      return res.status(400).json({
        success: false,
        error: 'الرسالة والإعدادات مطلوبة'
      });
    }

    // محاكاة اختبار ناجح
    console.log('✅ [API] اختبار WhatsApp AI نجح (محاكاة)');

    res.json({
      success: true,
      message: 'نجح الاختبار (محاكاة)'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في اختبار WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في اختبار الذكاء الاصطناعي'
    });
  }
});

// WhatsApp Baileys Status endpoint
app.get('/api/whatsapp-baileys/status', (req, res) => {
  console.log('📱 [API] جلب حالة WhatsApp...');
  res.json({
    success: true,
    isConnected: false,
    state: 'disconnected',
    qrCode: null,
    message: 'خدمة WhatsApp غير مُشغلة - يرجى تشغيل الخادم الحقيقي'
  });
});

// WhatsApp Baileys Start endpoint
app.post('/api/whatsapp-baileys/start', async (req, res) => {
  console.log('🚀 [API] محاولة بدء خدمة WhatsApp...');

  res.json({
    success: false,
    message: 'يرجى تشغيل الخادم الحقيقي لـ WhatsApp Baileys. استخدم: npm run api'
  });
});

// WhatsApp Stats endpoint
app.get('/api/whatsapp-baileys/stats', (req, res) => {
  console.log('📊 [API] جلب إحصائيات WhatsApp...');
  res.json({
    success: true,
    stats: {
      totalMessages: 0,
      todayMessages: 0,
      activeChats: 0,
      responseTime: 'غير متاح'
    }
  });
});

// WhatsApp Settings - GET
app.get('/api/whatsapp-baileys/settings', async (req, res) => {
  try {
    console.log('⚙️ [API] جلب إعدادات WhatsApp...');

    // جلب الإعدادات من whatsapp_ai_settings
    const { data: aiSettings, error } = await supabase
      .from('whatsapp_ai_settings')
      .select('auto_reply_enabled')
      .limit(1)
      .single();

    const settings = {
      auto_reply_enabled: aiSettings?.auto_reply_enabled || false,
      welcome_message: 'مرحباً بك! كيف يمكنني مساعدتك؟',
      business_hours: '9:00 - 18:00'
    };

    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب إعدادات WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإعدادات'
    });
  }
});

// WhatsApp Settings - PUT
app.put('/api/whatsapp-baileys/settings', async (req, res) => {
  try {
    console.log('💾 [API] حفظ إعدادات WhatsApp...');
    console.log('📝 [API] البيانات:', req.body);

    const { auto_reply_enabled, welcome_message, business_hours } = req.body;

    // تحديث الرد التلقائي في whatsapp_ai_settings
    if (typeof auto_reply_enabled === 'boolean') {
      const { error } = await supabase
        .from('whatsapp_ai_settings')
        .update({
          auto_reply_enabled: auto_reply_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', '8cac1c9e-2dd0-4db2-9115-5ecca86c0da0');

      if (error) {
        console.error('❌ خطأ في تحديث الرد التلقائي:', error);
      } else {
        console.log('✅ تم تحديث الرد التلقائي:', auto_reply_enabled);
      }
    }

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حفظ إعدادات WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حفظ الإعدادات'
    });
  }
});

// WhatsApp Disconnect endpoint
app.post('/api/whatsapp-baileys/disconnect', (req, res) => {
  console.log('🔌 [API] قطع اتصال WhatsApp...');
  res.json({
    success: true,
    message: 'تم قطع الاتصال (محاكاة)'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 WhatsApp AI Settings server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔗 AI Settings GET: http://localhost:${PORT}/api/whatsapp-baileys/ai-settings`);
  console.log(`🔗 AI Settings POST: http://localhost:${PORT}/api/whatsapp-baileys/ai-settings`);
  console.log(`🔗 Test AI: http://localhost:${PORT}/api/whatsapp-baileys/test-ai`);
  console.log('✅ Server is ready to accept requests!');
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
