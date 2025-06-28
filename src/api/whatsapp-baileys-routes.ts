import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { BaileysWhatsAppService } from '../services/baileysWhatsAppService';

const router = express.Router();

// إعداد Multer لرفع الملفات
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // السماح بأنواع الملفات المختلفة
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * بدء خدمة WhatsApp
 */
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 [API] بدء خدمة WhatsApp Baileys...');

    await BaileysWhatsAppService.initialize();

    res.json({
      success: true,
      message: 'تم بدء خدمة WhatsApp بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في بدء WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في بدء خدمة WhatsApp'
    });
  }
});

/**
 * الحصول على حالة الاتصال
 */
router.get('/status', async (req, res) => {
  try {
    const connectionState = BaileysWhatsAppService.getConnectionState();
    const qrCode = BaileysWhatsAppService.getQRCode();

    res.json({
      success: true,
      isConnected: connectionState.isConnected,
      state: connectionState.state,
      qrCode: qrCode
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب حالة الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب حالة الاتصال'
    });
  }
});

/**
 * إرسال رسالة
 */
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف والرسالة مطلوبان'
      });
    }

    const success = await BaileysWhatsAppService.sendMessage(phoneNumber, message);

    if (success) {
      res.json({
        success: true,
        message: 'تم إرسال الرسالة بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الرسالة'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إرسال الرسالة'
    });
  }
});

/**
 * إرسال ملف
 */
router.post('/send-file', upload.single('file'), async (req, res) => {
  try {
    const { phoneNumber, caption } = req.body;
    const file = req.file;

    if (!phoneNumber || !file) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف والملف مطلوبان'
      });
    }

    console.log(`📎 [API] إرسال ملف إلى ${phoneNumber}:`, {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      caption: caption
    });

    // تم إزالة حفظ الملف المحلي - لا يمكن استخدام fs في البراوزر
    // الملف متاح في memory فقط عبر file.buffer
    console.log('📎 [API] ملف جاهز للإرسال:', {
      name: file.originalname,
      size: file.size,
      type: file.mimetype
    });

    // إرسال الملف عبر WhatsApp
    const success = await BaileysWhatsAppService.sendFile(
      phoneNumber,
      file.buffer,
      file.originalname,
      file.mimetype,
      caption
    );

    if (success) {
      res.json({
        success: true,
        message: 'تم إرسال الملف بنجاح',
        fileUrl: null // لا يمكن حفظ الملفات محلياً في البراوزر
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الملف'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في إرسال الملف:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إرسال الملف'
    });
  }
});

/**
 * خدمة الملفات المرفوعة - معطلة (لا يمكن استخدام fs في البراوزر)
 */
router.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // لا يمكن خدمة الملفات المحلية في البراوزر
    res.status(404).json({
      success: false,
      error: 'خدمة الملفات غير متاحة في البراوزر'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في خدمة الملف:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

/**
 * قطع الاتصال
 */
router.post('/disconnect', async (req, res) => {
  try {
    await BaileysWhatsAppService.disconnect();

    res.json({
      success: true,
      message: 'تم قطع الاتصال بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في قطع الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في قطع الاتصال'
    });
  }
});

/**
 * إعادة تشغيل WhatsApp
 */
router.post('/restart', async (req, res) => {
  try {
    console.log('🔄 [API] طلب إعادة تشغيل WhatsApp...');
    await BaileysWhatsAppService.restart();

    res.json({
      success: true,
      message: 'تم إعادة تشغيل WhatsApp بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إعادة تشغيل WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تشغيل WhatsApp: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

/**
 * إصلاح مشاكل الاتصال
 */
router.post('/fix-connection', async (req, res) => {
  try {
    console.log('🔧 [API] طلب إصلاح مشاكل الاتصال...');
    await BaileysWhatsAppService.fixConnectionIssues();

    res.json({
      success: true,
      message: 'تم إصلاح مشاكل الاتصال - يمكن الآن إعادة التشغيل'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إصلاح مشاكل الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إصلاح مشاكل الاتصال: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

/**
 * الحصول على الرسائل الأخيرة
 */
router.get('/messages', async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      messages: messages || []
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الرسائل:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الرسائل'
    });
  }
});

/**
 * الحصول على الإحصائيات
 */
router.get('/stats', async (req, res) => {
  try {
    // إجمالي الرسائل
    const { count: totalMessages } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true });
    
    // رسائل اليوم
    const today = new Date().toISOString().split('T')[0];
    const { count: todayMessages } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);
    
    // المحادثات النشطة (أرقام فريدة)
    const { data: uniqueNumbers } = await supabase
      .from('whatsapp_messages')
      .select('phone_number')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const activeChats = new Set(uniqueNumbers?.map(m => m.phone_number) || []).size;
    
    res.json({
      success: true,
      stats: {
        totalMessages: totalMessages || 0,
        todayMessages: todayMessages || 0,
        activeChats: activeChats || 0
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإحصائيات'
    });
  }
});

/**
 * الحصول على جهات الاتصال
 */
router.get('/contacts', async (req, res) => {
  try {
    console.log('📞 [API] جلب جهات الاتصال...');

    // جلب أرقام فريدة من الرسائل مع آخر رسالة
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('phone_number, contact_name, message_text, created_at, message_type')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // تجميع جهات الاتصال الفريدة
    const contactsMap = new Map();

    messages?.forEach(msg => {
      if (!contactsMap.has(msg.phone_number)) {
        contactsMap.set(msg.phone_number, {
          phone: msg.phone_number,
          name: msg.contact_name || msg.phone_number,
          lastMessage: msg.message_text || 'لا توجد رسائل',
          lastMessageTime: msg.created_at,
          unreadCount: 0, // يمكن تحسينه لاحقاً
          isOnline: false // يمكن تحسينه لاحقاً
        });
      }
    });

    const contacts = Array.from(contactsMap.values());

    console.log(`✅ [API] تم جلب ${contacts.length} جهة اتصال`);

    res.json({
      success: true,
      contacts: contacts
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب جهات الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب جهات الاتصال'
    });
  }
});

/**
 * الحصول على معلومات جهة اتصال معينة
 */
router.get('/contact/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    console.log(`📞 [API] جلب معلومات جهة الاتصال: ${phoneNumber}`);

    // جلب آخر رسالة لهذا الرقم للحصول على الاسم
    const { data: lastMessage, error } = await supabase
      .from('whatsapp_messages')
      .select('contact_name, created_at')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const contact = {
      phone: phoneNumber,
      name: lastMessage?.contact_name || phoneNumber,
      isOnline: false, // يمكن تحسينه لاحقاً
      lastSeen: lastMessage?.created_at || null
    };

    res.json({
      success: true,
      contact: contact
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب معلومات جهة الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب معلومات جهة الاتصال'
    });
  }
});

/**
 * الحصول على محادثة معينة
 */
router.get('/conversation/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      messages: messages || []
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب المحادثة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب المحادثة'
    });
  }
});

/**
 * حذف رسالة
 */
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const { error } = await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('message_id', messageId);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حذف الرسالة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حذف الرسالة'
    });
  }
});

/**
 * تحديث إعدادات WhatsApp
 */
router.put('/settings', async (req, res) => {
  try {
    const { auto_reply_enabled, welcome_message } = req.body;
    
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert({
        id: 1,
        auto_reply_enabled: auto_reply_enabled,
        welcome_message: welcome_message,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تحديث الإعدادات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث الإعدادات'
    });
  }
});

/**
 * الحصول على إعدادات WhatsApp
 */
router.get('/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.json({
      success: true,
      settings: settings || {
        auto_reply_enabled: true,
        welcome_message: 'مرحباً بك! كيف يمكنني مساعدتك؟'
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الإعدادات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإعدادات'
    });
  }
});

/**
 * الحصول على إعدادات الذكاء الاصطناعي لـ WhatsApp
 */
router.get('/ai-settings', async (req, res) => {
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
      // إرجاع إعدادات افتراضية
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

/**
 * حفظ إعدادات الذكاء الاصطناعي لـ WhatsApp
 */
router.post('/ai-settings', async (req, res) => {
  try {
    console.log('💾 [API] حفظ إعدادات WhatsApp AI...');
    console.log('📝 [API] البيانات المرسلة:', req.body);

    const settings = req.body;

    // التحقق من وجود سجل موجود
    const { data: existingSettings, error: selectError } = await supabase
      .from('whatsapp_ai_settings')
      .select('id')
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let result;
    if (existingSettings) {
      // تحديث السجل الموجود
      console.log('🔄 [API] تحديث السجل الموجود...');
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

/**
 * اختبار الذكاء الاصطناعي لـ WhatsApp
 */
router.post('/test-ai', async (req, res) => {
  try {
    console.log('🧪 [API] اختبار WhatsApp AI...');

    const { message, settings } = req.body;

    if (!message || !settings) {
      return res.status(400).json({
        success: false,
        error: 'الرسالة والإعدادات مطلوبة'
      });
    }

    // استيراد خدمة WhatsApp AI
    const { WhatsAppAIService } = await import('../services/whatsappAIService');

    const success = await WhatsAppAIService.testAI(message, settings);

    res.json({
      success: success,
      message: success ? 'نجح الاختبار' : 'فشل الاختبار'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في اختبار WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في اختبار الذكاء الاصطناعي'
    });
  }
});

/**
 * إعادة تحميل إعدادات WhatsApp AI
 */
router.post('/reload-settings', async (req, res) => {
  try {
    console.log('🔄 [API] إعادة تحميل إعدادات WhatsApp AI...');

    // استيراد خدمة WhatsApp AI
    const { WhatsAppAIService } = await import('../services/whatsappAIService');

    await WhatsAppAIService.reloadSettings();

    res.json({
      success: true,
      message: 'تم إعادة تحميل الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إعادة تحميل الإعدادات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تحميل الإعدادات'
    });
  }
});

/**
 * فحص صحة الاتصال
 */
router.get('/health', async (req, res) => {
  try {
    const health = BaileysWhatsAppService.getConnectionHealth();

    res.json({
      success: true,
      health: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [API] خطأ في فحص صحة الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في فحص صحة الاتصال'
    });
  }
});

export default router;
