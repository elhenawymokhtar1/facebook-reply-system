/**
 * ⚠️ LEGACY WEBHOOK SERVER - DISABLED TO AVOID DUPLICATION
 *
 * هذا الخادم معطل لتجنب التداخل مع الخادم الرئيسي
 * الخادم الرئيسي يعمل على المنفذ 3002 في src/api/server.ts
 *
 * جميع الرسائل تتم معالجتها عبر الخادم الرئيسي
 */

// Global Error Handlers
process.on('uncaughtException', (error, origin) => {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('!!!! خطأ فادح: استثناء غير مُلتقط (Uncaught Exception) !!!!');
  console.error('!!!! تفاصيل الخطأ:', error);
  console.error('!!!! مصدر الخطأ:', origin);
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  // في بيئة الإنتاج، يُفضل إنهاء العملية هنا: process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('!!!! خطأ فادح: Promise مرفوض ولم يتم معالجته (Unhandled Rejection) !!!!');
  console.error('!!!! سبب الرفض:', reason);
  console.error('!!!! الـ Promise:', promise);
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  // في بيئة الإنتاج، يُفضل إنهاء العملية هنا: process.exit(1);
});
// نهاية Global Error Handlers
console.log('<<<<< SCRIPT STARTED, GLOBAL HANDLERS REGISTERED >>>>>');
console.log('FACEBOOK_APP_ID from env:', process.env.FACEBOOK_APP_ID);
console.log('Type of FACEBOOK_APP_ID:', typeof process.env.FACEBOOK_APP_ID);

// 🔗 Facebook Webhook Server الموحد
// منفذ واحد فقط - كود بسيط ومنظم

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3003; // منفذ واحد فقط

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// إعدادات Facebook
const VERIFY_TOKEN = '2xf2Xy5edVL0ZkYq69i60TukXj1_dJAUo7qKWTRVLt5KXcTH';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📋 الصفحة الرئيسية - معلومات الخادم
app.get('/', (req, res) => {
  res.json({
    name: '🔗 Facebook Webhook Server الموحد',
    version: '2.0.0',
    status: '✅ Running',
    port: PORT,
    endpoints: {
      webhook_verify: 'GET /webhook',
      webhook_receive: 'POST /webhook',
      health: 'GET /health'
    },
    facebook: {
      verify_token: VERIFY_TOKEN,
      ngrok_command: `ngrok http ${PORT}`
    },
    timestamp: new Date().toISOString()
  });
});

// 🔍 Facebook Webhook Verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Facebook Webhook Verification:', {
    mode,
    token,
    challenge: challenge ? 'received' : 'missing'
  });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Facebook Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Facebook Webhook verification failed!');
    console.error('Expected token:', VERIFY_TOKEN);
    console.error('Received token:', token);
    res.status(403).send('Forbidden');
  }
});

// 📨 Facebook Webhook Messages (POST) - DISABLED TO AVOID DUPLICATION
app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log('🔔 WEBHOOK RECEIVED ON LEGACY SERVER - IGNORING TO AVOID DUPLICATION!');
  console.log('📨 Data:', JSON.stringify(body, null, 2));

  // تحديث الإحصائيات
  systemStats.messagesReceived++;
  systemStats.lastMessageTime = new Date().toLocaleTimeString('ar-EG');

  // إرسال استجابة فورية دون معالجة لتجنب التكرار
  console.log('⚠️ Legacy webhook server - messages are processed by main API server on port 3002');
  res.status(200).send('OK');
});

// 🔄 معالجة الرسائل - DISABLED TO AVOID DUPLICATION WITH MAIN API SERVER
async function processMessage(messaging, pageId) {
  console.log('🔄 Legacy processMessage called - SKIPPING to avoid duplication with main API server');
  console.log('📨 Message data:', JSON.stringify(messaging, null, 2));
  console.log('📄 Page ID:', pageId);
  console.log('⚠️ This legacy webhook server is disabled - messages are processed by main API server on port 3002');
  return; // Exit early to avoid any processing
}

// 📤 معالجة الرسائل المرسلة من الصفحة
async function handleEchoMessage(messaging, pageId) {
  console.log('<<<<< ENTERING handleEchoMessage with messaging: >>>>>', JSON.stringify(messaging, null, 2));
  try {
  console.log('📤 Echo message from page');

  const customerId = messaging.recipient.id;
  const messageText = messaging.message.text || '';
  const messageId = messaging.message.mid;
  const appId = messaging.message.app_id;

  // البحث عن المحادثة أو إنشاؤها
  const conversation = await findOrCreateConversation(customerId, pageId);

  if (conversation) {
    // تحديد نوع الرسالة
    let messageType = 'admin'; // افتراضي: رسالة من المودريتور
    let isAutoReply = false;
    let isCampaign = false;
    let campaignId = null;

    const metadata = messaging.message.metadata;

    if (metadata === "AUTO_REPLY_BOT_V1") {
      messageType = 'bot';
      isAutoReply = true;
      console.log('🤖 Bot auto-reply echo received');
    } else if (appId && typeof process.env.FACEBOOK_APP_ID === 'string' && process.env.FACEBOOK_APP_ID.length > 0 && appId.toString() === process.env.FACEBOOK_APP_ID) {
      messageType = 'admin'; // Message sent manually from our app by an admin
      isAutoReply = false;
      console.log('📱 Message sent from our app (manual admin)');
    } else {
      // رسالة من مودريتور خارجي أو حملة
      console.log('👤 Message sent from external moderator or campaign');
      messageType = 'admin'; // Default to admin for external messages
      isAutoReply = false;

      // فحص إذا كانت رسالة حملة (هذا المنطق يمكن أن يبقى أو يُعدل حسب الحاجة)
      const campaignKeywords = ['عرض خاص', 'تخفيض', 'حملة', 'استهداف'];
      const isCampaignMessage = campaignKeywords.some(keyword =>
        messageText.includes(keyword)
      );

      if (isCampaignMessage) {
        isCampaign = true;
        console.log('📊 Detected as campaign message');
      }
    }

    // فحص إذا كانت الرسالة محفوظة مسبقاً لتجنب التكرار
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversation.id)
      .eq('content', messageText)
      .eq('sender_type', messageType)
      .gte('created_at', new Date(Date.now() - 30000).toISOString()) // خلال آخر 30 ثانية
      .single();

    if (existingMessage) {
      console.log('⚠️ Message already exists in database, skipping save to avoid duplication');
      console.log(`📋 Existing message ID: ${existingMessage.id}`);
      return; // تجاهل الحفظ
    }

    // حفظ الرسالة المرسلة من الصفحة (فقط إذا لم تكن محفوظة مسبقاً)
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        content: messageText,
        sender_type: messageType,
        is_read: true,
        is_auto_reply: isAutoReply,
        is_campaign: isCampaign,
        campaign_id: campaignId,
        facebook_message_id: messageId,
        external_source: !appId || appId !== process.env.FACEBOOK_APP_ID
      });

    if (error) {
      console.error('❌ Error saving echo message:', error);
    } else {
      console.log('✅ Echo message saved successfully');

      // تحديث المحادثة
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      // إضافة إحصائيات للحملات
      if (isCampaign && campaignId) {
        await supabase
          .from('campaign_messages')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('facebook_message_id', messageId);
      }
    }
  }
} catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!! CRITICAL ERROR IN handleEchoMessage !!!!');
    console.error('!!!! Error Message:', error.message);
    console.error('!!!! Error Stack:', error.stack);
    try {
      console.error('!!!! Error Object (Serialized):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (serializeError) {
      console.error('!!!! Error Object (Could not serialize):', error);
    }
    console.error('!!!! Messaging Object (handleEchoMessage):', JSON.stringify(messaging, null, 2));
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  }
  console.log('<<<<< EXITING handleEchoMessage >>>>>');
}

// 📨 معالجة الرسائل الواردة من العملاء
async function handleCustomerMessage(messaging, pageId) {
  console.log('<<<<< ENTERING handleCustomerMessage with messaging: >>>>>', JSON.stringify(messaging, null, 2));
  try {
  console.log('📨 Customer message received');

  const customerId = messaging.sender.id;
  const messageText = messaging.message.text || '';
  const messageId = messaging.message.mid;
  const attachments = messaging.message.attachments || [];

  // البحث عن المحادثة أو إنشاؤها
  const conversation = await findOrCreateConversation(customerId, pageId);
  
  if (!conversation) {
    console.error('❌ Could not find or create conversation');
    return;
  }

  // معالجة الصور
  let imageUrl = null;
  if (attachments.length > 0) {
    const imageAttachment = attachments.find(att => att.type === 'image');
    if (imageAttachment) {
      imageUrl = imageAttachment.payload.url;
      console.log('📷 Image attachment found');
    }
  }

  // حفظ الرسالة
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      content: messageText,
      sender_type: 'customer',
      is_read: false,
      is_auto_reply: false,
      facebook_message_id: messageId,
      image_url: imageUrl
    });

  if (error) {
    console.error('❌ Error saving customer message:', error);
    return;
  }

  console.log('✅ Customer message saved successfully');

  // تحديث المحادثة
  await supabase
    .from('conversations')
    .update({
      last_message: messageText || '📷 صورة',
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversation.id);

  // تشغيل الرد الآلي مع Gemini AI
  console.log('🤖 Triggering Gemini AI auto-reply...');
  try {
    // استدعاء Gemini AI مباشرة
    const geminiResponse = await fetch('http://localhost:3002/api/gemini/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU'
      })
    });

    if (geminiResponse.ok) {
      const result = await geminiResponse.json();
      console.log('✅ Gemini AI test successful:', result);

      // استدعاء Gemini AI مباشرة لتوليد الرد
      console.log('🔄 Calling Gemini AI directly...');

      const geminiApiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `انتي اسمك ساره بياعه شاطره اسلوبك كويس
بتبعي كوتشيات حريمي  او سلبير
اللي بيسئل بيسئل علي السلبير فالافتراض انه بيتكلم علي السلبير
الالوان اللي موجوده للكوتشي ابيض احمر اسود جملي الازرق البيج
والسعر 250 لو اكتر من قطعه هيكون في خصم 15 علي القطعه
الشحن متوفر للقاهرو واسكندرية بس وسعر الشحن 50
استخدمي لغه عاميه مصرية
لما عميل يسئل علي عن صورة لون معين ابعتي له صورة اللون اللي هو عايز يشوف
وردي علي قد السوال وبلاش كلام كتير
استخدم السؤال المفتوح دايما بس بشكل مناسب
وبلاش تتسرعي في طلب البيانات حاولي تطمني العميل دايما وتخليه يدخل علي الخطوه اللي بعدها
بلاش تكرري التحيه هو اول مره ف المحادثة بس
لو عميل عايز يشوف الالوان كله ابعتي الصور ورا بعض واحده واحده
معظم اللي هيكلموكي بنات استخدمي لغه مؤنثه
استخدمي اموجي وخلي الطريقة بتعتك فيها ود ومرح مع العميل
وركز انك تعملي اوردر وتسجليه
البيانات المطلوبه لعمل الاوردر
الاسم العنوان رقم التلفون المقاس واللون

رسالة العميل: ${messageText}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 10
          }
        })
      });

      if (geminiApiResponse.ok) {
        const geminiData = await geminiApiResponse.json();
        const geminiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (geminiReply) {
          console.log('✅ Gemini AI generated reply:', geminiReply);

          // إرسال الرد عبر Facebook API
          const { data: facebookSettings } = await supabase
            .from('facebook_settings')
            .select('access_token')
            .eq('page_id', pageId)
            .single();

          if (facebookSettings && facebookSettings.access_token) {
            const facebookResponse = await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${facebookSettings.access_token}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipient: { id: customerId },
                message: { 
                  text: geminiReply,
                  metadata: "AUTO_REPLY_BOT_V1" // Metadata to identify bot replies in echo
                }
              })
            });

            if (facebookResponse.ok) {
              console.log('✅ Gemini reply sent to Facebook successfully!');

              // حفظ الرد في قاعدة البيانات
              // The bot's reply will be saved via the message_echo
              // to avoid duplication. Ensure handleEchoMessage correctly
              // identifies bot messages (e.g., via metadata or app_id).
              console.log('🤖 Bot reply sent to Facebook, will be saved via echo.');

            } else {
              console.error('❌ Failed to send Gemini reply to Facebook');
            }
          }
        }
      } else {
        console.error('❌ Gemini API failed:', geminiApiResponse.status);
      }
    } else {
      console.error('❌ Gemini test failed:', geminiResponse.status);
    }
  } catch (autoReplyError) {
    console.error('❌ Error in auto-reply:', autoReplyError);

    // إضافة الخطأ للإحصائيات
    systemStats.errors.push({
      timestamp: new Date().toISOString(),
      error: autoReplyError.message,
      context: 'auto-reply'
    });
  }
} catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!! CRITICAL ERROR IN handleCustomerMessage !!!!');
    console.error('!!!! Error Message:', error.message);
    console.error('!!!! Error Stack:', error.stack);
    try {
      console.error('!!!! Error Object (Serialized):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (serializeError) {
      console.error('!!!! Error Object (Could not serialize):', error);
    }
    console.error('!!!! Messaging Object (handleCustomerMessage):', JSON.stringify(messaging, null, 2));
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  }
  console.log('<<<<< EXITING handleCustomerMessage >>>>>');
}

// 🔍 البحث عن المحادثة أو إنشاؤها
async function findOrCreateConversation(customerId, pageId) {
  try {
    // البحث عن محادثة موجودة
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_facebook_id', customerId)
      .eq('facebook_page_id', pageId)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ Error searching for conversation:', searchError);
      return null;
    }

    if (existingConversation) {
      console.log('✅ Found existing conversation');
      return existingConversation;
    }

    // إنشاء محادثة جديدة
    console.log('🆕 Creating new conversation...');
    const customerName = `User ${customerId.slice(-6)}`;

    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        customer_facebook_id: customerId,
        facebook_page_id: pageId,
        customer_name: customerName,
        last_message: '',
        last_message_at: new Date().toISOString(),
        is_online: true,
        unread_count: 0
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating conversation:', createError);
      return null;
    }

    console.log('✅ Created new conversation');
    return newConversation;

  } catch (error) {
    console.error('❌ Error in findOrCreateConversation:', error);
    return null;
  }
}

// إحصائيات النظام
let systemStats = {
  messagesReceived: 0,
  messagesIgnored: 0,
  lastMessageTime: null,
  lastIgnoredMessage: null,
  errors: [],
  startTime: new Date()
};

// 🏥 Health Check المحسن
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Facebook Webhook Server',
    port: PORT,
    messagesReceived: systemStats.messagesReceived,
    messagesIgnored: systemStats.messagesIgnored,
    lastMessageTime: systemStats.lastMessageTime,
    lastIgnoredMessage: systemStats.lastIgnoredMessage,
    errors: systemStats.errors.slice(-10), // آخر 10 أخطاء
    startTime: systemStats.startTime.toISOString(),
    memory: process.memoryUsage(),
    version: '2.1.0'
  });
});

// 📊 إحصائيات مفصلة
app.get('/stats', (req, res) => {
  res.status(200).json({
    ...systemStats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 🧪 اختبار الـ Webhook
app.post('/test', (req, res) => {
  console.log('🧪 Test webhook called');

  // محاكاة رسالة اختبار
  const testMessage = {
    object: 'page',
    entry: [{
      id: '260345600493273',
      messaging: [{
        sender: { id: 'test_user_' + Date.now() },
        recipient: { id: '260345600493273' },
        timestamp: Date.now(),
        message: {
          mid: `test_${Date.now()}`,
          text: `🧪 رسالة اختبار من التشخيص - ${new Date().toLocaleTimeString('ar-EG')}`
        }
      }]
    }]
  };

  // معالجة الرسالة
  req.body = testMessage;

  res.status(200).json({
    success: true,
    message: 'Test message processed',
    timestamp: new Date().toISOString()
  });

  // معالجة الرسالة في الخلفية
  setTimeout(async () => {
    try {
      // معالجة كل entry
      for (const entry of testMessage.entry || []) {
        const pageId = entry.id;
        console.log(`📄 Processing test page: ${pageId}`);

        // معالجة الرسائل
        for (const messaging of entry.messaging || []) {
          await processMessage(messaging, pageId);
        }
      }
    } catch (error) {
      console.error('❌ Error processing test message:', error);
    }
  }, 100);
});

// 🚀 بدء الخادم
app.listen(PORT, () => {
  console.log('🎉 Facebook Webhook Server الموحد بدأ بنجاح!');
  console.log('');
  console.log('📊 معلومات الخادم:');
  console.log(`   🌐 المنفذ: ${PORT}`);
  console.log(`   🔗 الرابط المحلي: http://localhost:${PORT}`);
  console.log(`   🔑 Verify Token: ${VERIFY_TOKEN}`);
  console.log('');
  console.log('📋 الـ Endpoints المتاحة:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/webhook (verification)`);
  console.log(`   POST http://localhost:${PORT}/webhook (receive messages)`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log('');
  console.log('🔧 لتشغيل ngrok:');
  console.log(`   ngrok http ${PORT}`);
  console.log('');
  console.log('✅ الخادم جاهز لاستقبال الرسائل!');
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
