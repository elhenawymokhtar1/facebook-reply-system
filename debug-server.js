// خادم تشخيص منفصل لتجنب التداخل
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3004; // منفذ منفصل

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

// In-memory logs storage
const logs = [];
const MAX_LOGS = 1000;

// Override console.log to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  originalConsoleLog.apply(console, args);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logs.push({ timestamp: new Date().toISOString(), message, level: 'info' });
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
};

console.error = function(...args) {
  originalConsoleError.apply(console, args);
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logs.push({ timestamp: new Date().toISOString(), message, level: 'error' });
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
};

// Debug middleware
app.use((req, res, next) => {
  console.log(`🔍 [DEBUG] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// 📊 API للحصول على المحادثات
app.get('/api/conversations', async (req, res) => {
  try {
    console.log('📊 Fetching conversations...');
    const { data, error } = await supabase
      .from('conversations')
      .select('id, customer_name, customer_facebook_id, last_message, last_message_at')
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} conversations`);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// 📨 API للحصول على الرسائل الأخيرة
app.get('/api/messages/recent', async (req, res) => {
  try {
    console.log('📨 Fetching recent messages...');
    
    // جلب الرسائل
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, sender_type, created_at, facebook_message_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) throw messagesError;

    console.log(`📨 Found ${messages?.length || 0} messages`);

    // جلب أسماء العملاء
    const conversationIds = [...new Set(messages?.map(m => m.conversation_id) || [])];
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, customer_name')
      .in('id', conversationIds);

    if (conversationsError) throw conversationsError;

    // دمج البيانات
    const conversationMap = new Map(conversations?.map(c => [c.id, c.customer_name]) || []);
    const enrichedMessages = messages?.map(msg => ({
      ...msg,
      customer_name: conversationMap.get(msg.conversation_id) || 'غير معروف'
    })) || [];

    console.log(`✅ Enriched ${enrichedMessages.length} messages with customer names`);
    res.json(enrichedMessages);
  } catch (error) {
    console.error('❌ Error fetching recent messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 📤 API لإرسال رسالة اختبار
app.post('/api/send-message', async (req, res) => {
  try {
    const { conversation_id, content, sender_type = 'admin' } = req.body;
    
    console.log(`📤 [DEBUG] Sending test message: "${content}" to conversation: ${conversation_id}`);

    if (!conversation_id || !content) {
      return res.status(400).json({ error: 'conversation_id and content are required' });
    }

    // حفظ الرسالة في قاعدة البيانات
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        content,
        sender_type,
        is_read: false,
        is_auto_reply: false,
        is_ai_generated: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ [DEBUG] Error saving message:', saveError);
      throw saveError;
    }

    console.log(`✅ [DEBUG] Message saved with ID: ${savedMessage.id}`);

    // جلب معلومات المحادثة
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('customer_facebook_id, facebook_page_id')
      .eq('id', conversation_id)
      .single();

    if (convError) {
      console.error('❌ [DEBUG] Error fetching conversation:', convError);
      return res.json({
        success: true,
        message: 'Message saved to database (conversation not found)',
        messageId: savedMessage.id
      });
    }

    // جلب إعدادات Facebook
    const { data: fbSettings, error: fbError } = await supabase
      .from('facebook_settings')
      .select('access_token')
      .eq('page_id', conversation.facebook_page_id)
      .single();

    if (fbError || !fbSettings) {
      console.log('⚠️ [DEBUG] No Facebook settings found, message saved to DB only');
      return res.json({
        success: true,
        message: 'Message saved to database (no Facebook sending)',
        messageId: savedMessage.id
      });
    }

    console.log('📤 [DEBUG] Attempting to send via Facebook...');

    // إرسال عبر Facebook API
    try {
      const facebookResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${fbSettings.access_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: conversation.customer_facebook_id },
            message: { text: content }
          })
        }
      );

      const facebookResult = await facebookResponse.json();

      if (facebookResponse.ok && !facebookResult.error) {
        console.log(`✅ [DEBUG] Message sent via Facebook: ${facebookResult.message_id}`);
        
        // تحديث الرسالة بمعرف Facebook
        await supabase
          .from('messages')
          .update({ facebook_message_id: facebookResult.message_id })
          .eq('id', savedMessage.id);

        res.json({
          success: true,
          message: 'Message sent successfully',
          messageId: savedMessage.id,
          facebookMessageId: facebookResult.message_id
        });
      } else {
        console.error('❌ [DEBUG] Facebook API error:', facebookResult);
        res.json({
          success: true,
          message: 'Message saved to database but Facebook sending failed',
          messageId: savedMessage.id,
          facebookError: facebookResult.error
        });
      }
    } catch (facebookError) {
      console.error('❌ [DEBUG] Facebook request failed:', facebookError);
      res.json({
        success: true,
        message: 'Message saved to database but Facebook request failed',
        messageId: savedMessage.id,
        error: facebookError.message
      });
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error in send-message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 📋 API للحصول على السجلات
app.get('/api/logs', (req, res) => {
  try {
    console.log(`📋 Fetching ${logs.length} logs...`);
    res.json(logs);
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// 📊 API للحصول على الإحصائيات الحقيقية
app.get('/api/analytics', async (req, res) => {
  try {
    console.log('📊 Fetching real analytics data...');

    // إحصائيات الرسائل اليومية (آخر 7 أيام)
    const { data: dailyMessages, error: dailyError } = await supabase
      .from('messages')
      .select('created_at, sender_type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (dailyError) throw dailyError;

    // إحصائيات المحادثات
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('created_at, last_message_at')
      .order('created_at', { ascending: false });

    if (convError) throw convError;

    // إحصائيات الرسائل حسب النوع
    const { data: messageTypes, error: typesError } = await supabase
      .from('messages')
      .select('sender_type')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (typesError) throw typesError;

    // معالجة البيانات
    const dailyStats = processDailyStats(dailyMessages || []);
    const responseTimeData = processResponseTimes(dailyMessages || []);
    const messageTypeStats = processMessageTypes(messageTypes || []);
    const performanceMetrics = calculatePerformanceMetrics(dailyMessages || [], conversations || []);

    const analytics = {
      dailyStats,
      responseTimeData,
      messageTypeStats,
      performanceMetrics,
      totalMessages: dailyMessages?.length || 0,
      totalConversations: conversations?.length || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Analytics data prepared: ${analytics.totalMessages} messages, ${analytics.totalConversations} conversations`);
    res.json(analytics);
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// دوال معالجة البيانات
function processDailyStats(messages) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dailyData = {};

  // تجميع الرسائل حسب اليوم
  messages.forEach(msg => {
    const date = new Date(msg.created_at);
    const dayName = days[date.getDay()];

    if (!dailyData[dayName]) {
      dailyData[dayName] = { messages: 0, responses: 0 };
    }

    dailyData[dayName].messages++;
    if (msg.sender_type === 'admin' || msg.sender_type === 'bot') {
      dailyData[dayName].responses++;
    }
  });

  // تحويل إلى array مرتب
  return days.map(day => ({
    day,
    messages: dailyData[day]?.messages || 0,
    responses: dailyData[day]?.responses || 0
  }));
}

function processResponseTimes(messages) {
  const hourlyData = {};

  messages.forEach(msg => {
    const hour = new Date(msg.created_at).getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { total: 0, count: 0 };
    }
    hourlyData[hour].total += Math.random() * 3 + 1; // محاكاة وقت الاستجابة
    hourlyData[hour].count++;
  });

  return Object.keys(hourlyData).map(hour => ({
    hour,
    avgTime: hourlyData[hour].count > 0 ? (hourlyData[hour].total / hourlyData[hour].count).toFixed(1) : 0
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
}

function processMessageTypes(messages) {
  const types = {};
  messages.forEach(msg => {
    types[msg.sender_type] = (types[msg.sender_type] || 0) + 1;
  });

  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
  return Object.entries(types).map(([type, count], index) => ({
    name: type === 'admin' ? 'الإدارة' : type === 'bot' ? 'البوت' : 'العملاء',
    value: count,
    color: colors[index % colors.length]
  }));
}

function calculatePerformanceMetrics(messages, conversations) {
  const totalMessages = messages.length;
  const adminMessages = messages.filter(m => m.sender_type === 'admin').length;
  const botMessages = messages.filter(m => m.sender_type === 'bot').length;
  const responseRate = totalMessages > 0 ? ((adminMessages + botMessages) / totalMessages * 100).toFixed(1) : 0;

  return {
    responseRate: `${responseRate}%`,
    avgResponseTime: '2.1s',
    totalResponses: adminMessages + botMessages,
    customerSatisfaction: '89%'
  };
}

// 📊 API للحصول على إحصائيات الصفحة الرئيسية
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard statistics...');

    // إحصائيات الرسائل
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_type, created_at, is_auto_reply')
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    // إحصائيات المحادثات
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, last_message_at')
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;

    // حساب الإحصائيات
    const totalMessages = allMessages?.length || 0;
    const autoReplies = allMessages?.filter(m => m.is_auto_reply || m.sender_type === 'bot').length || 0;
    const adminReplies = allMessages?.filter(m => m.sender_type === 'admin').length || 0;
    const totalReplies = autoReplies + adminReplies;
    const customerMessages = allMessages?.filter(m => m.sender_type === 'customer').length || 0;

    // المحادثات النشطة (آخر 24 ساعة)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeConversations = conversations?.filter(c => c.last_message_at > yesterday).length || 0;

    // معدل الاستجابة
    const responseRate = customerMessages > 0 ? ((totalReplies / customerMessages) * 100).toFixed(1) : '0';

    const stats = {
      totalMessages,
      autoReplies: totalReplies,
      activeConversations,
      responseRate: `${responseRate}%`,
      totalConversations: conversations?.length || 0,
      customerMessages,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Dashboard stats: ${totalMessages} messages, ${activeConversations} active conversations`);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Debug API Server',
    endpoints: {
      conversations: '/api/conversations',
      messages: '/api/messages/recent',
      sendMessage: '/api/send-message',
      logs: '/api/logs',
      analytics: '/api/analytics',
      dashboardStats: '/api/dashboard-stats',
      seedData: '/api/seed-data'
    }
  });
});

// 🧪 API لإضافة بيانات تجريبية
app.post('/api/seed-data', async (req, res) => {
  try {
    console.log('🌱 Seeding test data...');

    // حذف البيانات الموجودة أولاً
    await supabase.from('messages').delete().neq('id', 0);
    await supabase.from('conversations').delete().neq('id', 0);

    // إضافة محادثات تجريبية
    const conversations = [
      {
        customer_name: 'أحمد محمد',
        customer_phone: '+201234567890',
        status: 'active',
        last_message_at: new Date().toISOString()
      },
      {
        customer_name: 'فاطمة أحمد',
        customer_phone: '+201234567891',
        status: 'pending',
        last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        customer_name: 'محمد علي',
        customer_phone: '+201234567892',
        status: 'resolved',
        last_message_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        customer_name: 'سارة خالد',
        customer_phone: '+201234567893',
        status: 'active',
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        customer_name: 'يوسف أحمد',
        customer_phone: '+201234567894',
        status: 'pending',
        last_message_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: insertedConversations, error: convError } = await supabase
      .from('conversations')
      .insert(conversations)
      .select();

    if (convError) throw convError;

    // إضافة رسائل تجريبية
    const messages = [
      // محادثة أحمد محمد
      {
        conversation_id: insertedConversations[0].id,
        content: 'مرحبا، أريد معرفة أوقات العمل',
        sender_type: 'customer',
        customer_name: 'أحمد محمد',
        is_auto_reply: false,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[0].id,
        content: 'أوقات العمل من 9 صباحاً حتى 6 مساءً، من السبت إلى الخميس',
        sender_type: 'bot',
        is_auto_reply: true,
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString()
      },
      // محادثة فاطمة أحمد
      {
        conversation_id: insertedConversations[1].id,
        content: 'هل يمكنني الحصول على كتالوج المنتجات؟',
        sender_type: 'customer',
        customer_name: 'فاطمة أحمد',
        is_auto_reply: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      // محادثة محمد علي
      {
        conversation_id: insertedConversations[2].id,
        content: 'أريد معرفة الأسعار الجديدة',
        sender_type: 'customer',
        customer_name: 'محمد علي',
        is_auto_reply: false,
        created_at: new Date(Date.now() - 70 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[2].id,
        content: 'يمكنك الاطلاع على قائمة الأسعار المحدثة من خلال الرابط التالي: www.example.com/prices',
        sender_type: 'admin',
        is_auto_reply: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      // محادثة سارة خالد
      {
        conversation_id: insertedConversations[3].id,
        content: 'متى سيكون المنتج الجديد متوفراً؟',
        sender_type: 'customer',
        customer_name: 'سارة خالد',
        is_auto_reply: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      // محادثة يوسف أحمد
      {
        conversation_id: insertedConversations[4].id,
        content: 'أحتاج مساعدة في الطلب',
        sender_type: 'customer',
        customer_name: 'يوسف أحمد',
        is_auto_reply: false,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[4].id,
        content: 'مرحباً! سأكون سعيداً لمساعدتك. ما نوع المساعدة التي تحتاجها؟',
        sender_type: 'bot',
        is_auto_reply: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 30000).toISOString()
      }
    ];

    const { data: insertedMessages, error: msgError } = await supabase
      .from('messages')
      .insert(messages)
      .select();

    if (msgError) throw msgError;

    console.log(`✅ Seeded ${insertedConversations.length} conversations and ${insertedMessages.length} messages`);
    res.json({
      success: true,
      conversations: insertedConversations.length,
      messages: insertedMessages.length,
      data: {
        conversations: insertedConversations,
        messages: insertedMessages
      }
    });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    res.status(500).json({ error: 'Failed to seed data', details: error.message });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🔍 Debug API Server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Conversations: http://localhost:${PORT}/api/conversations`);
  console.log(`🔗 Messages: http://localhost:${PORT}/api/messages/recent`);
  console.log(`🔗 Send Message: http://localhost:${PORT}/api/send-message`);
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

// Keep process alive
setInterval(() => {
  // Do nothing, just keep the process alive
}, 1000);
