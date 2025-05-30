// Simple API server for handling webhook messages
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { NameUpdateService } from '@/services/nameUpdateService';
import { processIncomingMessage, validateMessageRequest } from './process-message';
import colorsRouter from './colors';

// تحميل متغيرات البيئة
dotenv.config();

const app = express();
const PORT = 3002; // منفذ منفصل للـ API

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'file://', // دعم للملفات المحلية
    null // دعم للطلبات بدون origin
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// إعداد ترميز UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Colors management routes
app.use('/api/colors', colorsRouter);

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Conversations endpoint
app.get('/api/conversations', async (req, res) => {
  try {
    console.log('📋 [API] Conversations endpoint called...');

    // دعم للـ limit parameter
    const limit = parseInt(req.query.limit as string) || 100;
    const validLimit = Math.min(Math.max(limit, 1), 200); // بين 1 و 200

    console.log(`📊 Fetching ${validLimit} conversations`);

    // جلب المحادثات أولاً
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(validLimit);

    if (error) {
      throw error;
    }

    // جلب معلومات الصفحات
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('page_id, page_name, page_picture_url');

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    }

    // دمج البيانات
    const conversationsWithPageInfo = conversations?.map(conversation => {
      const pageInfo = pages?.find(page => page.page_id === conversation.facebook_page_id);
      console.log(`🔍 Conversation ${conversation.id}: facebook_page_id=${conversation.facebook_page_id}, found page: ${pageInfo?.page_name || 'NOT FOUND'}`);
      return {
        ...conversation,
        page_name: pageInfo?.page_name,
        page_picture_url: pageInfo?.page_picture_url
      };
    }) || [];

    console.log(`✅ Successfully fetched ${conversationsWithPageInfo?.length || 0} conversations with page info`);
    console.log(`📄 Available pages: ${pages?.map(p => `${p.page_id}:${p.page_name}`).join(', ')}`);
    res.json(conversationsWithPageInfo);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Messages endpoint
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message endpoint
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, sender_type, image_url } = req.body;

    // Save message to database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        content: content,
        sender_type: sender_type || 'admin',
        is_read: false,
        is_auto_reply: false,
        image_url: image_url
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});



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
  console.log('🚀 POST /api/process-message endpoint hit!');
  console.log('📝 Headers:', JSON.stringify(req.headers));
  console.log('📝 Full Body:', JSON.stringify(req.body));
  try {
    console.log('📨 Received message processing request:', req.body);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);

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
              // التحقق من نوع الرسالة
              const isEcho = messagingEvent.message.is_echo || false;
              const isFromPage = isEcho; // الرسائل من الصفحة تكون echo
              const isFromCustomer = !isEcho; // الرسائل من العملاء مش echo

              // استخراج النص والمرفقات
              const messageText = messagingEvent.message.text || '';
              const attachments = messagingEvent.message.attachments || [];

              // التحقق من وجود صور
              let imageUrl = null;
              for (const attachment of attachments) {
                if (attachment.type === 'image') {
                  imageUrl = attachment.payload?.url;
                  console.log('📸 Image received:', imageUrl);
                  break;
                }
              }

              // إذا كان هناك نص أو صورة، معالج الرسالة
              if (messageText || imageUrl) {
                // تحديد نوع المرسل
                let senderId, senderType;
                if (isFromPage) {
                  // رسالة من الصفحة - استخدم recipient كـ customer
                  senderId = messagingEvent.recipient.id;
                  senderType = 'page';
                  console.log('📤 Message from page to customer:', senderId);
                } else {
                  // رسالة من العميل
                  senderId = messagingEvent.sender.id;
                  senderType = 'customer';
                  console.log('📥 Message from customer:', senderId);
                }

                // تحويل إلى format المطلوب
                const messageRequest = {
                  senderId: senderId,
                  messageText: messageText || '[صورة]',
                  messageId: messagingEvent.message.mid,
                  pageId: entry.id,
                  timestamp: messagingEvent.timestamp,
                  imageUrl: imageUrl,
                  senderType: senderType,
                  isEcho: isEcho
                };

                console.log('🔄 Processing Facebook message:', messageRequest);

                // معالجة الرسالة (بدون auto-reply للرسائل من الصفحة)
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

// Facebook Webhook endpoints (compatible with Facebook's requirements)
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'facebook_webhook_verify_token_2024';

  console.log('🔍 Facebook Webhook verification request:', {
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge']
  });

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Facebook Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Facebook Webhook verification failed!');
    res.status(403).send('Forbidden');
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log('🔥🔥🔥 FACEBOOK WEBHOOK RECEIVED! 🔥🔥🔥');
  console.log('📨 Received Facebook webhook:', JSON.stringify(body, null, 2));
  console.log('🔥🔥🔥 END WEBHOOK DATA 🔥🔥🔥');

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
    console.error('❌ Error processing Facebook webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// معالجة أحداث الرسائل من Facebook
async function handleMessagingEvent(messagingEvent: any, pageId: string) {
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

// معالجة رسالة المستخدم من Facebook
async function handleUserMessage(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const message = messagingEvent.message;
  const messageText = message.text;
  const messageId = message.mid;

  console.log(`💬 Facebook message from ${senderId}: "${messageText}"`);

  try {
    // معالجة الرسالة مباشرة (نفس المنطق الموجود في process-message)
    const messageRequest = {
      senderId,
      messageText,
      messageId,
      pageId,
      timestamp: messagingEvent.timestamp
    };

    console.log('🔄 Processing Facebook message:', messageRequest);

    // معالجة الرسالة (بدون auto-reply للرسائل من الصفحة)
    const result = await processIncomingMessage(messageRequest);

    console.log('✅ Facebook message processing result:', result);

  } catch (error) {
    console.error('❌ Error processing Facebook user message:', error);
  }
}

// معالجة Postback من Facebook
async function handlePostback(messagingEvent: any, pageId: string) {
  const senderId = messagingEvent.sender.id;
  const postback = messagingEvent.postback;
  const payload = postback.payload;

  console.log(`🔘 Facebook Postback from ${senderId}: ${payload}`);

  // يمكن إضافة منطق معالجة الأزرار هنا
}

// معالجة تغييرات الصفحة من Facebook
async function handlePageChange(change: any, pageId: string) {
  const field = change.field;
  const value = change.value;

  console.log(`📄 Facebook Page change: ${field}`, value);

  // معالجة التعليقات
  if (field === 'feed' && value.item === 'comment') {
    console.log(`💭 New Facebook comment: ${value.message}`);
    // يمكن إضافة رد آلي على التعليقات
  }
}

// Test page endpoint
app.get('/test', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 اختبار API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .conversation { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; background: #f9f9f9; }
        .loading { text-align: center; color: #666; font-size: 18px; }
        .error { color: red; background: #ffe6e6; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .success { color: green; background: #e6ffe6; padding: 10px; border-radius: 5px; margin: 10px 0; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 اختبار API - من السيرفر مباشرة</h1>
        <div>
            <button onclick="testAPI()">🔄 اختبار API</button>
            <button onclick="testWithLimit()">📊 اختبار مع Limit</button>
            <button onclick="clearResults()">🗑️ مسح النتائج</button>
        </div>
        <div id="status" class="loading">جاهز للاختبار...</div>
        <div id="results"></div>
    </div>

    <script>
        const statusDiv = document.getElementById('status');
        const resultsDiv = document.getElementById('results');

        function updateStatus(message, type = 'loading') {
            statusDiv.className = type;
            statusDiv.innerHTML = message;
        }

        function addResult(content) {
            const div = document.createElement('div');
            div.innerHTML = content;
            resultsDiv.appendChild(div);
        }

        function clearResults() {
            resultsDiv.innerHTML = '';
            updateStatus('تم مسح النتائج', 'success');
        }

        async function testAPI() {
            updateStatus('🔄 جاري اختبار API...', 'loading');
            clearResults();

            try {
                const startTime = Date.now();
                const response = await fetch('/api/conversations');
                const endTime = Date.now();
                const duration = endTime - startTime;

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }

                const data = await response.json();
                updateStatus(\`✅ نجح الاختبار! (\${duration}ms)\`, 'success');

                addResult(\`
                    <div class="success">
                        <h3>✅ نتائج الاختبار:</h3>
                        <p><strong>📊 عدد المحادثات:</strong> \${data.length}</p>
                        <p><strong>⏱️ وقت الاستجابة:</strong> \${duration}ms</p>
                        <p><strong>📡 حالة HTTP:</strong> \${response.status} \${response.statusText}</p>
                    </div>
                \`);

                if (data.length > 0) {
                    addResult(\`
                        <div class="conversation">
                            <h4>📝 أول محادثة:</h4>
                            <p><strong>👤 العميل:</strong> \${data[0].customer_name}</p>
                            <p><strong>💬 آخر رسالة:</strong> \${data[0].last_message || 'لا توجد'}</p>
                            <p><strong>📅 التاريخ:</strong> \${new Date(data[0].last_message_at).toLocaleString('ar-EG')}</p>
                        </div>
                    \`);
                }
            } catch (error) {
                updateStatus(\`❌ فشل الاختبار: \${error.message}\`, 'error');
            }
        }

        async function testWithLimit() {
            updateStatus('🔄 جاري اختبار API مع Limit...', 'loading');
            clearResults();

            try {
                const startTime = Date.now();
                const response = await fetch('/api/conversations?limit=5');
                const endTime = Date.now();
                const duration = endTime - startTime;

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }

                const data = await response.json();
                updateStatus(\`✅ نجح الاختبار مع Limit! (\${duration}ms)\`, 'success');

                addResult(\`
                    <div class="success">
                        <h3>✅ نتائج الاختبار مع Limit:</h3>
                        <p><strong>📊 عدد المحادثات:</strong> \${data.length} (المطلوب: 5)</p>
                        <p><strong>⏱️ وقت الاستجابة:</strong> \${duration}ms</p>
                        <p><strong>✅ Limit يعمل:</strong> \${data.length <= 5 ? 'نعم' : 'لا'}</p>
                    </div>
                \`);
            } catch (error) {
                updateStatus(\`❌ فشل الاختبار: \${error.message}\`, 'error');
            }
        }

        window.addEventListener('load', () => {
            updateStatus('🎯 الصفحة جاهزة للاختبار', 'success');
        });
    </script>
</body>
</html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Message Processing API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Process message endpoint: http://localhost:${PORT}/api/process-message`);
  
  // بدء خدمة تحديث أسماء المستخدمين من فيسبوك
  try {
    console.log('🚀 بدء خدمة تحديث أسماء المستخدمين من فيسبوك...');
    NameUpdateService.startAutoUpdate();
  } catch (error) {
    console.error('❌ خطأ في بدء خدمة تحديث الأسماء:', error);
  }
});

// Keep the process alive
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

export default app;
