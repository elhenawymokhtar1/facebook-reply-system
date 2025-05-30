import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import https from 'https';

const app = express();
const PORT = 8081;

// تفعيل CORS
app.use(cors());

// خدمة الصور الثابتة
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

// تحميل صورة من رابط خارجي وإعادة تقديمها
app.get('/proxy-image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const imageUrl = `https://files.easy-orders.net/${filename}`;
    
    console.log('🖼️ Proxying image:', imageUrl);
    
    // تحميل الصورة من الرابط الخارجي
    https.get(imageUrl, (response) => {
      if (response.statusCode === 200) {
        // تعيين headers مناسبة
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // تمرير الصورة مباشرة
        response.pipe(res);
      } else {
        console.error('❌ Failed to fetch image:', response.statusCode);
        res.status(404).send('Image not found');
      }
    }).on('error', (error) => {
      console.error('❌ Error fetching image:', error);
      res.status(500).send('Error fetching image');
    });
    
  } catch (error) {
    console.error('❌ Error in proxy-image:', error);
    res.status(500).send('Internal server error');
  }
});

// صورة اختبار
app.get('/test-image', (req, res) => {
  // إنشاء صورة بسيطة كـ SVG
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f0f0"/>
      <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">
        كوتشي أبيض
      </text>
      <circle cx="200" cy="200" r="50" fill="white" stroke="#ccc" stroke-width="2"/>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🖼️ Image server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Test image: http://localhost:${PORT}/test-image`);
  console.log(`🔗 Proxy images: http://localhost:${PORT}/proxy-image/FILENAME`);
});

export default app;
