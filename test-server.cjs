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
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
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
        is_auto_reply,
        created_at,
        conversation_id,
        conversations!inner(
          customer_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // تحويل البيانات لتكون أسهل في الاستخدام
    const formattedMessages = messages?.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender_type: msg.sender_type,
      is_auto_reply: msg.is_auto_reply,
      created_at: msg.created_at,
      conversation_id: msg.conversation_id,
      customer_name: msg.conversations?.customer_name
    })) || [];

    console.log(`✅ Found ${formattedMessages.length} recent messages`);
    res.json(formattedMessages);
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
        customer_facebook_id: 'fb_123456789',
        facebook_page_id: 'page_123',
        last_message: 'مرحبا، أريد معرفة أوقات العمل',
        last_message_at: new Date().toISOString(),
        is_online: true,
        unread_count: 1
      },
      {
        customer_name: 'فاطمة أحمد',
        customer_facebook_id: 'fb_123456790',
        facebook_page_id: 'page_123',
        last_message: 'هل يمكنني الحصول على كتالوج المنتجات؟',
        last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        is_online: false,
        unread_count: 1
      },
      {
        customer_name: 'محمد علي',
        customer_facebook_id: 'fb_123456791',
        facebook_page_id: 'page_123',
        last_message: 'شكراً لكم',
        last_message_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        is_online: false,
        unread_count: 0
      },
      {
        customer_name: 'سارة خالد',
        customer_facebook_id: 'fb_123456792',
        facebook_page_id: 'page_123',
        last_message: 'متى سيكون المنتج الجديد متوفراً؟',
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        is_online: true,
        unread_count: 1
      },
      {
        customer_name: 'يوسف أحمد',
        customer_facebook_id: 'fb_123456793',
        facebook_page_id: 'page_123',
        last_message: 'شكراً للمساعدة',
        last_message_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        is_online: false,
        unread_count: 0
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
        is_auto_reply: false,
        is_read: true,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[0].id,
        content: 'أوقات العمل من 9 صباحاً حتى 6 مساءً، من السبت إلى الخميس',
        sender_type: 'bot',
        is_auto_reply: true,
        is_read: true,
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString()
      },
      // محادثة فاطمة أحمد
      {
        conversation_id: insertedConversations[1].id,
        content: 'هل يمكنني الحصول على كتالوج المنتجات؟',
        sender_type: 'customer',
        is_auto_reply: false,
        is_read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      // محادثة محمد علي
      {
        conversation_id: insertedConversations[2].id,
        content: 'أريد معرفة الأسعار الجديدة',
        sender_type: 'customer',
        is_auto_reply: false,
        is_read: true,
        created_at: new Date(Date.now() - 70 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[2].id,
        content: 'يمكنك الاطلاع على قائمة الأسعار المحدثة من خلال الرابط التالي: www.example.com/prices',
        sender_type: 'admin',
        is_auto_reply: false,
        is_read: true,
        created_at: new Date(Date.now() - 65 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[2].id,
        content: 'شكراً لكم',
        sender_type: 'customer',
        is_auto_reply: false,
        is_read: true,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      // محادثة سارة خالد
      {
        conversation_id: insertedConversations[3].id,
        content: 'متى سيكون المنتج الجديد متوفراً؟',
        sender_type: 'customer',
        is_auto_reply: false,
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      // محادثة يوسف أحمد
      {
        conversation_id: insertedConversations[4].id,
        content: 'أحتاج مساعدة في الطلب',
        sender_type: 'customer',
        is_auto_reply: false,
        is_read: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        conversation_id: insertedConversations[4].id,
        content: 'مرحباً! سأكون سعيداً لمساعدتك. ما نوع المساعدة التي تحتاجها؟',
        sender_type: 'bot',
        is_auto_reply: true,
        is_read: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 30000).toISOString()
      },
      {
        conversation_id: insertedConversations[4].id,
        content: 'شكراً للمساعدة',
        sender_type: 'customer',
        is_auto_reply: false,
        is_read: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 60000).toISOString()
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
