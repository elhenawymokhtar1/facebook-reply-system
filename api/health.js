// Vercel API Route - Health Check
export default function handler(req, res) {
  console.log('🔍 Health check endpoint called');
  
  if (req.method === 'GET') {
    const uptime = process.uptime();
    res.status(200).json({
      status: 'OK',
      service: 'Facebook Reply Automator API',
      uptime: uptime,
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      version: '2.0.0'
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
