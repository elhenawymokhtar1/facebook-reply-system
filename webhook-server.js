// 🔗 Facebook Webhook Server الموحد
// منفذ واحد فقط - كود بسيط ومنظم

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3001; // منفذ واحد فقط

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// إعدادات Facebook
const VERIFY_TOKEN = 'facebook_webhook_verify_token_2024';

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

// 📨 Facebook Webhook Messages (POST)
app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log('🔔 WEBHOOK RECEIVED!');
  console.log('📨 Data:', JSON.stringify(body, null, 2));

  try {
    // التحقق من أن الطلب من Facebook
    if (body.object !== 'page') {
      console.log('⚠️ Not a page event, ignoring');
      return res.status(200).send('OK');
    }

    // معالجة كل entry
    for (const entry of body.entry || []) {
      const pageId = entry.id;
      console.log(`📄 Processing page: ${pageId}`);

      // معالجة الرسائل
      for (const messaging of entry.messaging || []) {
        await processMessage(messaging, pageId);
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 🔄 معالجة الرسائل
async function processMessage(messaging, pageId) {
  console.log('🔄 Processing message:', messaging);

  try {
    // معالجة الرسائل المرسلة من الصفحة (Echo)
    if (messaging.message?.is_echo) {
      await handleEchoMessage(messaging, pageId);
      return;
    }

    // معالجة الرسائل الواردة من العملاء
    if (messaging.message) {
      await handleCustomerMessage(messaging, pageId);
      return;
    }

    console.log('⚠️ Unknown message type, ignoring');

  } catch (error) {
    console.error('❌ Error in processMessage:', error);
  }
}

// 📤 معالجة الرسائل المرسلة من الصفحة
async function handleEchoMessage(messaging, pageId) {
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

    // فحص إذا كانت الرسالة من التطبيق نفسه
    if (appId && appId === process.env.FACEBOOK_APP_ID) {
      messageType = 'admin';
      isAutoReply = false;
      console.log('📱 Message sent from our app');
    } else {
      // رسالة من مودريتور خارجي أو حملة
      console.log('👤 Message sent from external moderator or campaign');

      // فحص إذا كانت رسالة حملة
      const campaignKeywords = ['عرض خاص', 'تخفيض', 'حملة', 'استهداف'];
      const isCampaignMessage = campaignKeywords.some(keyword =>
        messageText.includes(keyword)
      );

      if (isCampaignMessage) {
        isCampaign = true;
        console.log('📊 Detected as campaign message');
      }
    }

    // حفظ الرسالة المرسلة من الصفحة
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
}

// 📨 معالجة الرسائل الواردة من العملاء
async function handleCustomerMessage(messaging, pageId) {
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

  // تشغيل الرد الآلي
  console.log('🤖 Triggering auto-reply...');
  try {
    // يمكن إضافة الرد الآلي هنا لاحقاً
    console.log('ℹ️ Auto-reply will be implemented later');
  } catch (autoReplyError) {
    console.error('❌ Error in auto-reply:', autoReplyError);
  }
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

// 🏥 Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Facebook Webhook Server'
  });
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
