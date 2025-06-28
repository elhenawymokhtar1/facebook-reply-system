const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  // إضافة CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    console.log(`🔍 API: Getting Facebook conversations for company: ${company_id}`);

    // جلب المحادثات مع فلترة الشركة
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', company_id)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
    }

    console.log(`✅ Found ${conversations?.length || 0} conversations for company ${company_id}`);
    
    // إضافة معلومات الصفحة لكل محادثة
    const conversationsWithPageInfo = (conversations || []).map(conversation => ({
      ...conversation,
      page_name: conversation.facebook_page_id === '240244019177739' ? 'سولا 127' : 
                 conversation.facebook_page_id === '351400718067673' ? 'Simple A42' : 'صفحة غير معروفة',
      page_picture_url: null
    }));

    res.json(conversationsWithPageInfo);

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
