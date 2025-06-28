import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      return res.status(500).json({ error: 'Failed to fetch conversations' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
}