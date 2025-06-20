// ملف لتشغيل خدمة WhatsApp Baileys
const { spawn } = require('child_process');

console.log('🚀 بدء تشغيل خدمة WhatsApp Baileys...');

// تشغيل الخادم الأصلي
const server = spawn('npx', ['tsx', 'src/api/server.ts'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ خطأ في تشغيل الخادم:', error);
});

server.on('close', (code) => {
  console.log(`🔚 انتهى الخادم بكود: ${code}`);
});

// التعامل مع إشارات الإنهاء
process.on('SIGINT', () => {
  console.log('🛑 إيقاف الخادم...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 إيقاف الخادم...');
  server.kill('SIGTERM');
  process.exit(0);
});
