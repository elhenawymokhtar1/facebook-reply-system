// مراقب استقرار WhatsApp
const fs = require('fs');

console.log('🔍 بدء مراقبة استقرار WhatsApp...\n');

let connectionHistory = [];
let disconnectionCount = 0;
let lastStatus = null;

async function checkHealth() {
  try {
    const response = await fetch('http://localhost:3002/api/whatsapp-baileys/health');
    const data = await response.json();
    
    if (data.success) {
      const health = data.health;
      const timestamp = new Date().toLocaleString('ar-EG');
      
      // تسجيل التغييرات في الحالة
      if (lastStatus !== health.isConnected) {
        if (health.isConnected) {
          console.log(`✅ [${timestamp}] WhatsApp متصل`);
        } else {
          disconnectionCount++;
          console.log(`❌ [${timestamp}] WhatsApp منقطع (المرة ${disconnectionCount})`);
        }
        lastStatus = health.isConnected;
      }
      
      // إضافة للتاريخ
      connectionHistory.push({
        timestamp: new Date(),
        isConnected: health.isConnected,
        connectionState: health.connectionState,
        reconnectAttempts: health.reconnectAttempts,
        hasSocket: health.hasSocket,
        hasKeepAlive: health.hasKeepAlive
      });
      
      // الاحتفاظ بآخر 100 سجل فقط
      if (connectionHistory.length > 100) {
        connectionHistory = connectionHistory.slice(-100);
      }
      
      // عرض معلومات مفصلة كل 10 فحوصات
      if (connectionHistory.length % 10 === 0) {
        console.log(`\n📊 [${timestamp}] تقرير الحالة:`);
        console.log(`   - متصل: ${health.isConnected ? 'نعم' : 'لا'}`);
        console.log(`   - حالة الاتصال: ${health.connectionState}`);
        console.log(`   - محاولات إعادة الاتصال: ${health.reconnectAttempts}/${health.maxReconnectAttempts}`);
        console.log(`   - Socket موجود: ${health.hasSocket ? 'نعم' : 'لا'}`);
        console.log(`   - Keep-alive نشط: ${health.hasKeepAlive ? 'نعم' : 'لا'}`);
        console.log(`   - عدد الانقطاعات: ${disconnectionCount}`);
        
        // حساب نسبة الاستقرار
        const connectedCount = connectionHistory.filter(h => h.isConnected).length;
        const stabilityRate = ((connectedCount / connectionHistory.length) * 100).toFixed(1);
        console.log(`   - معدل الاستقرار: ${stabilityRate}%\n`);
      }
      
      // تحذير إذا كانت محاولات إعادة الاتصال عالية
      if (health.reconnectAttempts > 5) {
        console.log(`⚠️ [${timestamp}] تحذير: محاولات إعادة اتصال عالية (${health.reconnectAttempts})`);
      }
      
      // إعادة تشغيل تلقائي إذا فشل الاتصال عدة مرات
      if (health.reconnectAttempts >= health.maxReconnectAttempts) {
        console.log(`🔄 [${timestamp}] محاولة إصلاح الاتصال...`);
        await fixConnection();
      }
      
    } else {
      console.log(`❌ [${new Date().toLocaleString('ar-EG')}] فشل في فحص الصحة`);
    }
    
  } catch (error) {
    console.log(`❌ [${new Date().toLocaleString('ar-EG')}] خطأ في الاتصال: ${error.message}`);
  }
}

async function fixConnection() {
  try {
    console.log('🔧 بدء إصلاح الاتصال...');
    
    const response = await fetch('http://localhost:3002/api/whatsapp-baileys/fix-connection', {
      method: 'POST'
    });
    
    if (response.ok) {
      console.log('✅ تم إصلاح الاتصال');
      
      // انتظار ثم إعادة التشغيل
      setTimeout(async () => {
        const startResponse = await fetch('http://localhost:3002/api/whatsapp-baileys/start', {
          method: 'POST'
        });
        
        if (startResponse.ok) {
          console.log('🚀 تم إعادة تشغيل WhatsApp');
        }
      }, 3000);
    }
    
  } catch (error) {
    console.log(`❌ فشل في إصلاح الاتصال: ${error.message}`);
  }
}

function generateReport() {
  const timestamp = new Date().toLocaleString('ar-EG');
  const totalChecks = connectionHistory.length;
  const connectedCount = connectionHistory.filter(h => h.isConnected).length;
  const stabilityRate = totalChecks > 0 ? ((connectedCount / totalChecks) * 100).toFixed(1) : 0;
  
  const report = `
📊 تقرير استقرار WhatsApp - ${timestamp}
================================================
📈 إجمالي الفحوصات: ${totalChecks}
✅ مرات الاتصال: ${connectedCount}
❌ مرات الانقطاع: ${disconnectionCount}
📊 معدل الاستقرار: ${stabilityRate}%

📋 آخر 10 حالات:
${connectionHistory.slice(-10).map(h => 
  `${h.timestamp.toLocaleTimeString('ar-EG')} - ${h.isConnected ? '✅' : '❌'} ${h.connectionState}`
).join('\n')}
================================================
`;

  console.log(report);
  
  // حفظ التقرير في ملف
  fs.writeFileSync('whatsapp-stability-report.txt', report, 'utf8');
}

// بدء المراقبة
const monitorInterval = setInterval(checkHealth, 5000); // كل 5 ثوانٍ

// تقرير دوري كل دقيقة
const reportInterval = setInterval(generateReport, 60000); // كل دقيقة

// فحص أولي
checkHealth();

// التعامل مع إيقاف البرنامج
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف المراقبة...');
  clearInterval(monitorInterval);
  clearInterval(reportInterval);
  generateReport();
  console.log('📄 تم حفظ التقرير النهائي في whatsapp-stability-report.txt');
  process.exit(0);
});

console.log('✅ المراقبة نشطة - اضغط Ctrl+C للإيقاف');
console.log('📊 سيتم عرض تقرير كل دقيقة\n');
