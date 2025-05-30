const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// Facebook App Secret (يجب إضافته في متغيرات البيئة)
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret_here';

// Webhook Verify Token
const VERIFY_TOKEN = 'facebook_webhook_verify_token_2024';

// Middleware
app.use(cors());
app.use(express.json({ verify: verifyRequestSignature }));
app.use(express.urlencoded({ extended: true }));

// التحقق من صحة طلبات Facebook
function verifyRequestSignature(req, res, buf) {
  const signature = req.get('X-Hub-Signature-256');

  // تعطيل التحقق مؤقتاً للاختبار
  if (!APP_SECRET || APP_SECRET === 'your_facebook_app_secret_here') {
    console.warn('⚠️ App Secret not configured - skipping signature verification');
    return;
  }

  if (!signature) {
    console.warn('No signature found in request');
    return;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(buf)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid signature');
    throw new Error('Invalid signature');
  }
}

// Webhook endpoint للتحقق من Facebook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request:', { mode, token });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed!');
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint لاستقبال الرسائل
app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log('📨 Received webhook:', JSON.stringify(body, null, 2));

  try {
    // التأكد من أن الطلب من Facebook Page
    if (body.object === 'page') {

      // معالجة كل entry
      for (const entry of body.entry || []) {
        const pageId = entry.id;

        // معالجة رسائل Messenger
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleMessagingEvent(messagingEvent, pageId);
          }
        }

        // معالجة تعليقات المنشورات
        if (entry.changes) {
          for (const change of entry.changes) {
            await handlePageChange(change, pageId);
          }
        }
      }

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// معالجة أحداث الرسائل
async function handleMessagingEvent(messagingEvent, pageId) {
  const senderId = messagingEvent.sender?.id;
  const timestamp = messagingEvent.timestamp;

  console.log(`📱 Processing messaging event from ${senderId}`);

  // رسالة واردة من المستخدم
  if (messagingEvent.message && !messagingEvent.message.is_echo) {
    await handleUserMessage(messagingEvent, pageId);
  }

  // تأكيد التسليم
  if (messagingEvent.delivery) {
    console.log('✅ Message delivered:', messagingEvent.delivery.mids);
  }

  // تأكيد القراءة
  if (messagingEvent.read) {
    console.log('👁️ Message read:', messagingEvent.read.watermark);
  }

  // Postback (أزرار)
  if (messagingEvent.postback) {
    await handlePostback(messagingEvent, pageId);
  }
}

// معالجة رسالة المستخدم
async function handleUserMessage(messagingEvent, pageId) {
  const senderId = messagingEvent.sender.id;
  const message = messagingEvent.message;
  const messageText = message.text;
  const messageId = message.mid;

  console.log(`💬 Message from ${senderId}: "${messageText}"`);

  try {
    // إرسال طلب إلى التطبيق الرئيسي لمعالجة الرسالة
    const response = await fetch('http://localhost:3002/api/process-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId,
        messageText,
        messageId,
        pageId,
        timestamp: messagingEvent.timestamp
      })
    });

    if (response.ok) {
      console.log('✅ Message processed successfully');
    } else {
      console.error('❌ Failed to process message:', response.status);
    }

  } catch (error) {
    console.error('❌ Error processing user message:', error);
  }
}

// معالجة Postback
async function handlePostback(messagingEvent, pageId) {
  const senderId = messagingEvent.sender.id;
  const postback = messagingEvent.postback;
  const payload = postback.payload;

  console.log(`🔘 Postback from ${senderId}: ${payload}`);

  // يمكن إضافة منطق معالجة الأزرار هنا
}

// معالجة تغييرات الصفحة
async function handlePageChange(change, pageId) {
  const field = change.field;
  const value = change.value;

  console.log(`📄 Page change: ${field}`, value);

  // معالجة التعليقات
  if (field === 'feed' && value.item === 'comment') {
    console.log(`💭 New comment: ${value.message}`);
    // يمكن إضافة رد آلي على التعليقات
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Facebook Webhook Server'
  });
});

// معلومات الخادم
app.get('/', (req, res) => {
  res.json({
    name: 'Facebook Webhook Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      webhook_verify: 'GET /webhook',
      webhook_receive: 'POST /webhook',
      health: 'GET /health'
    },
    facebook: {
      verify_token: VERIFY_TOKEN,
      app_secret_configured: !!APP_SECRET && APP_SECRET !== 'your_facebook_app_secret_here'
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log('🚀 Facebook Webhook Server started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
  console.log(`🛡️ App Secret configured: ${!!APP_SECRET && APP_SECRET !== 'your_facebook_app_secret_here'}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/webhook (verification)`);
  console.log(`   POST http://localhost:${PORT}/webhook (receive messages)`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log('');
  console.log('⚙️ To configure Facebook Webhook:');
  console.log(`   1. Use this URL: http://your-domain.com:${PORT}/webhook`);
  console.log(`   2. Verify Token: ${VERIFY_TOKEN}`);
  console.log('   3. Subscribe to: messages, messaging_postbacks, feed');
});

module.exports = app;
