// Simple API server for handling webhook messages
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { processIncomingMessage, validateMessageRequest } from './process-message';

// تحميل متغيرات البيئة
dotenv.config();
import colorsRouter from './colors';

const app = express();
const PORT = 3002; // منفذ منفصل للـ API

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// إعداد ترميز UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Colors management routes
app.use('/api/colors', colorsRouter);



// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Facebook Reply Automator API',
    webhook: '/api/process-message',
    health: '/health'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Message Processing API' });
});

// Webhook verification endpoint (for Facebook)
app.get('/api/process-message', (req, res) => {
  const VERIFY_TOKEN = 'facebook_verify_token_123';

  console.log('🔍 Webhook verification request:', {
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge']
  });

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // إضافة headers مطلوبة
  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache'
  });

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully!');
      console.log('📤 Sending challenge:', challenge);
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed!');
      console.log('Expected token:', VERIFY_TOKEN);
      console.log('Received token:', token);
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Missing verification parameters');
    res.status(400).send('Bad Request: Missing verification parameters');
  }
});

// Process message endpoint
app.post('/api/process-message', async (req, res) => {
  try {
    console.log('📨 Received message processing request:', req.body);

    // إضافة headers للاستجابة
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });

    // التحقق من نوع الطلب
    if (req.body.object === 'page') {
      // معالجة webhook من Facebook
      const results = [];

      for (const entry of req.body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message) {
              // استخراج النص والمرفقات
              const messageText = messagingEvent.message.text || '';
              const attachments = messagingEvent.message.attachments || [];

              // التحقق من وجود صور
              let imageUrl = null;
              for (const attachment of attachments) {
                if (attachment.type === 'image') {
                  imageUrl = attachment.payload?.url;
                  console.log('📸 Image received from user:', imageUrl);
                  break;
                }
              }

              // إذا كان هناك نص أو صورة، معالج الرسالة
              if (messageText || imageUrl) {
                // تحويل إلى format المطلوب
                const messageRequest = {
                  senderId: messagingEvent.sender.id,
                  messageText: messageText || '[صورة]',
                  messageId: messagingEvent.message.mid,
                  pageId: entry.id,
                  timestamp: messagingEvent.timestamp,
                  imageUrl: imageUrl
                };

                console.log('🔄 Processing Facebook message:', messageRequest);

                // معالجة الرسالة
                const result = await processIncomingMessage(messageRequest);
                results.push(result);

                console.log('✅ Message processing result:', result);
              }
            }
          }
        }
      }

      res.status(200).json({ success: true, results });
    } else {
      // معالجة direct API call
      if (!validateMessageRequest(req.body)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request format'
        });
      }

      // معالجة الرسالة
      const result = await processIncomingMessage(req.body);

      console.log('✅ Message processing result:', result);

      res.json(result);
    }
  } catch (error) {
    console.error('❌ Error in message processing API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Message Processing API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Process message endpoint: http://localhost:${PORT}/api/process-message`);
});

export default app;
