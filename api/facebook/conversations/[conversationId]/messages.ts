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
    const { conversationId } = req.query;
    const { company_id } = req.query;

    if (!conversationId || !company_id) {
      return res.status(400).json({ error: 'conversationId and company_id are required' });
    }

    console.log(`🔍 API: Getting messages for conversation: ${conversationId}`);

    // التحقق من أن المحادثة تنتمي للشركة
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, company_id')
      .eq('id', conversationId)
      .eq('company_id', company_id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // جلب الرسائل
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    console.log(`✅ Found ${messages?.length || 0} messages for conversation ${conversationId}`);
    res.json(messages || []);

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
