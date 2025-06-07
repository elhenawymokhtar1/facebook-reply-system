const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2ZramFoZXN5bW0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDM1NzE5NywiZXhwIjoyMDQ5OTMzMTk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// 📨 API للحصول على الرسائل الحديثة
app.get('/api/messages/recent', async (req, res) => {
  try {
    console.log('📨 Fetching recent messages...');
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_type,
        customer_name,
        is_auto_reply,
        created_at,
        conversation_id
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    console.log(`✅ Found ${messages?.length || 0} recent messages`);
    res.json(messages || []);
  } catch (error) {
    console.error('❌ Error fetching recent messages:', error);
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
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

    console.log(`✅ Seeded ${insertedConversations.length} conversations`);
    res.json({
      success: true,
      conversations: insertedConversations.length,
      data: {
        conversations: insertedConversations
      }
    });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    res.status(500).json({ error: 'Failed to seed data', details: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Test API Server',
    endpoints: {
      dashboardStats: '/api/dashboard-stats',
      messages: '/api/messages/recent',
      seedData: '/api/seed-data'
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🔍 Test API Server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Dashboard Stats: http://localhost:${PORT}/api/dashboard-stats`);
  console.log(`🔗 Messages: http://localhost:${PORT}/api/messages/recent`);
  console.log(`🔗 Seed Data: http://localhost:${PORT}/api/seed-data`);
});
