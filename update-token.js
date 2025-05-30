// تحديث Access Token للصفحة
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAccessToken() {
  console.log('🔧 تحديث Access Token...\n');

  // ضع الـ Token الجديد هنا
  const newToken = 'YOUR_NEW_PAGE_ACCESS_TOKEN_HERE';
  const pageId = '240244019177739'; // الصفحة الأولى

  if (newToken === 'YOUR_NEW_PAGE_ACCESS_TOKEN_HERE') {
    console.log('❌ يرجى وضع الـ Token الجديد في المتغير newToken');
    return;
  }

  try {
    // تحديث Token للصفحة الأولى
    const { error } = await supabase
      .from('facebook_settings')
      .update({
        access_token: newToken,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId);

    if (error) {
      console.error('❌ خطأ في تحديث Token:', error);
    } else {
      console.log('✅ تم تحديث Access Token بنجاح');
      
      // اختبار Token الجديد
      console.log('\n🧪 اختبار Token الجديد...');
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${newToken}`);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log(`✅ Token يعمل بنجاح - الصفحة: ${data.name}`);
        console.log(`📄 Page ID: ${data.id}`);
      } else {
        console.log(`❌ Token لا يعمل:`, data.error?.message || 'خطأ غير معروف');
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل التحديث
updateAccessToken().then(() => {
  console.log('\n🎯 انتهى التحديث');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
