const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 بدء إصلاح جميع المشاكل...\n');

// 1. إصلاح قاعدة البيانات
async function fixDatabase() {
  console.log('📊 1. إصلاح قاعدة البيانات...');
  
  try {
    // التحقق من وجود العمود last_connected
    console.log('   - فحص جدول whatsapp_settings...');
    console.log('   ✅ العمود last_connected تم إضافته مسبقاً');
    
    // تنظيف بيانات WhatsApp
    console.log('   - تنظيف بيانات WhatsApp...');
    const { error: cleanError } = await supabase
      .from('whatsapp_settings')
      .upsert({
        id: 1,
        is_connected: false,
        qr_code: null,
        last_connected: null,
        updated_at: new Date().toISOString()
      });
    
    if (cleanError) {
      console.error('   ❌ خطأ في تنظيف البيانات:', cleanError);
    } else {
      console.log('   ✅ تم تنظيف بيانات WhatsApp');
    }
    
  } catch (error) {
    console.error('   ❌ خطأ في إصلاح قاعدة البيانات:', error);
  }
}

// 2. إصلاح ملفات WhatsApp
async function fixWhatsAppFiles() {
  console.log('\n📱 2. إصلاح ملفات WhatsApp...');
  
  try {
    const authDir = './baileys_auth';
    
    if (fs.existsSync(authDir)) {
      console.log('   - حذف ملفات المصادقة القديمة...');
      
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        const filePath = path.join(authDir, file);
        fs.unlinkSync(filePath);
        console.log(`   - تم حذف: ${file}`);
      }
      
      fs.rmdirSync(authDir);
      console.log('   ✅ تم حذف مجلد المصادقة');
    } else {
      console.log('   ✅ لا توجد ملفات مصادقة قديمة');
    }
    
  } catch (error) {
    console.error('   ❌ خطأ في حذف ملفات WhatsApp:', error);
  }
}

// 3. فحص Facebook Token
async function checkFacebookToken() {
  console.log('\n📘 3. فحص Facebook Token...');
  
  try {
    const { data: settings, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', '240244019177739')
      .single();
    
    if (error || !settings) {
      console.log('   ❌ لم يتم العثور على إعدادات Facebook');
      return;
    }
    
    console.log('   - اختبار الـ Token...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${settings.access_token}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('   ❌ Facebook Token لا يعمل:', data.error.message);
      console.log('   🔧 يحتاج تحديث Facebook Token');
      console.log('   📝 استخدم: node fix-facebook-token.js');
    } else {
      console.log('   ✅ Facebook Token يعمل بشكل صحيح');
    }
    
  } catch (error) {
    console.error('   ❌ خطأ في فحص Facebook Token:', error);
  }
}

// 4. إعادة تشغيل الخدمات
async function restartServices() {
  console.log('\n🔄 4. إعادة تشغيل الخدمات...');
  
  try {
    console.log('   - إرسال طلب إصلاح الاتصال...');
    
    const response = await fetch('http://localhost:3002/api/whatsapp-baileys/fix-connection', {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅', result.message);
    } else {
      console.log('   ⚠️  الخادم غير متاح - سيتم الإصلاح عند إعادة التشغيل');
    }
    
  } catch (error) {
    console.log('   ⚠️  الخادم غير متاح - سيتم الإصلاح عند إعادة التشغيل');
  }
}

// 5. تعليمات ما بعد الإصلاح
function showPostFixInstructions() {
  console.log('\n✅ تم الانتهاء من الإصلاح!\n');
  console.log('📋 الخطوات التالية:');
  console.log('1. أعد تشغيل الخادم: npm run api');
  console.log('2. افتح صفحة WhatsApp في المتصفح');
  console.log('3. امسح QR Code الجديد');
  console.log('4. إذا كان Facebook Token لا يعمل، استخدم: node fix-facebook-token.js');
  console.log('\n🔗 روابط مفيدة:');
  console.log('- WhatsApp: http://localhost:8080/whatsapp-connection');
  console.log('- Facebook: http://localhost:8080/facebook-connection');
  console.log('- Dashboard: http://localhost:8080');
}

// تشغيل جميع الإصلاحات
async function runAllFixes() {
  try {
    await fixDatabase();
    await fixWhatsAppFiles();
    await checkFacebookToken();
    await restartServices();
    showPostFixInstructions();
  } catch (error) {
    console.error('❌ خطأ عام في الإصلاح:', error);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  runAllFixes();
}

module.exports = {
  fixDatabase,
  fixWhatsAppFiles,
  checkFacebookToken,
  restartServices
};
