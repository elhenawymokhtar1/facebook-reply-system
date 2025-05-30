// Simple webhook handler for Facebook Messenger
export default async function handler(req, res) {
  // إضافة CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Webhook verification for Facebook
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
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        console.log('📤 Sending challenge:', challenge);
        res.status(200).send(challenge);
      } else {
        console.log('❌ Webhook verification failed!');
        console.log('Expected token:', VERIFY_TOKEN);
        console.log('Received token:', token);
        res.status(403).send('Forbidden');
      }
    } else {
      console.log('❌ Missing verification parameters');
      res.status(400).send('Bad Request: Missing verification parameters');
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      console.log('📨 Received message processing request:', req.body);
      
      // إضافة headers للاستجابة
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');

      // للآن، سنرد بـ success بسيط للتأكد من أن الـ webhook يعمل
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in message processing API:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
    return;
  }

  // Method not allowed
  res.status(405).json({ error: 'Method not allowed' });
}
