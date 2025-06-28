// Vercel API Route - Facebook Webhook
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

const VERIFY_TOKEN = 'facebook_verify_token_123';

export default async function handler(req, res) {
  console.log('🔥 [VERCEL] Process message endpoint called!');
  console.log('📝 Method:', req.method);
  console.log('📝 Query:', req.query);
  console.log('📝 Body:', req.body);

  // Handle GET request for webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook verification attempt:');
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        res.status(200).send(challenge);
      } else {
        console.log('❌ Webhook verification failed!');
        res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      console.log('❌ Missing verification parameters');
      res.status(400).json({ error: 'Bad Request: Missing verification parameters' });
    }
    return;
  }

  // Handle POST request for incoming messages
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
          const webhookEvent = entry.messaging[0];
          console.log('📨 Received webhook event:', webhookEvent);
          
          // Store message in database
          if (webhookEvent.message) {
            const { data, error } = await supabase
              .from('conversations')
              .insert({
                sender_id: webhookEvent.sender.id,
                message: webhookEvent.message.text || 'Media message',
                timestamp: new Date().toISOString(),
                platform: 'facebook'
              });
              
            if (error) {
              console.error('❌ Database error:', error);
            } else {
              console.log('✅ Message stored in database');
            }
          }
        });
        
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
    return;
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
}
