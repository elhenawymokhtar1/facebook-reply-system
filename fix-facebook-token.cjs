const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFacebookToken() {
  try {
    console.log('🔍 فحص Facebook Token...');
    
    // جلب الإعدادات الحالية
    const { data: settings, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('page_id', '240244019177739')
      .single();
    
    if (error) {
      console.error('❌ خطأ في جلب الإعدادات:', error);
      return;
    }
    
    if (!settings) {
      console.log('❌ لم يتم العثور على إعدادات Facebook');
      return;
    }
    
    console.log('📄 إعدادات Facebook الحالية:');
    console.log('- Page ID:', settings.page_id);
    console.log('- Page Name:', settings.page_name);
    console.log('- Is Active:', settings.is_active);
    console.log('- Token Prefix:', settings.access_token.substring(0, 20) + '...');
    console.log('- Created:', settings.created_at);
    console.log('- Updated:', settings.updated_at);
    
    // اختبار الـ token
    console.log('\n🧪 اختبار Facebook Token...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${settings.access_token}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Facebook Token خطأ:', data.error);
      console.log('\n🔧 حلول مقترحة:');
      console.log('1. تحديث Facebook Access Token');
      console.log('2. التحقق من صلاحيات التطبيق');
      console.log('3. إعادة إنشاء Page Access Token');
      
      if (data.error.code === 190) {
        console.log('\n⚠️  الـ Token منتهي الصلاحية - يحتاج تجديد');
      }
      
      if (data.error.code === 100) {
        console.log('\n⚠️  مشكلة في الصلاحيات - تحقق من إعدادات التطبيق');
      }
    } else {
      console.log('✅ Facebook Token يعمل بشكل صحيح');
      console.log('- User/Page:', data.name || data.id);
      console.log('- Type:', data.category ? 'Page' : 'User');
    }
    
    // اختبار صفحة محددة
    console.log('\n🧪 اختبار الوصول للصفحة...');
    
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${settings.page_id}?access_token=${settings.access_token}`
    );
    
    const pageData = await pageResponse.json();
    
    if (pageData.error) {
      console.error('❌ خطأ في الوصول للصفحة:', pageData.error);
    } else {
      console.log('✅ يمكن الوصول للصفحة بنجاح');
      console.log('- Page Name:', pageData.name);
      console.log('- Page ID:', pageData.id);
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

async function generateNewToken() {
  console.log('\n📝 لإنشاء Facebook Token جديد:');
  console.log('1. اذهب إلى: https://developers.facebook.com/tools/explorer/');
  console.log('2. اختر تطبيقك');
  console.log('3. اختر الصفحة المطلوبة');
  console.log('4. أضف الصلاحيات: pages_messaging, pages_read_engagement');
  console.log('5. انسخ الـ Token الجديد');
  console.log('6. استخدم الدالة updateToken() لتحديثه');
}

async function updateToken(newToken) {
  try {
    console.log('🔄 تحديث Facebook Token...');
    
    // اختبار الـ token الجديد أولاً
    const testResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${newToken}`
    );
    
    const testData = await testResponse.json();
    
    if (testData.error) {
      console.error('❌ الـ Token الجديد غير صحيح:', testData.error);
      return;
    }
    
    console.log('✅ الـ Token الجديد صحيح');
    
    // تحديث قاعدة البيانات
    const { error } = await supabase
      .from('facebook_settings')
      .update({
        access_token: newToken,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', '240244019177739');
    
    if (error) {
      console.error('❌ خطأ في تحديث قاعدة البيانات:', error);
      return;
    }
    
    console.log('✅ تم تحديث Facebook Token بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث Token:', error);
  }
}

// تشغيل الفحص
if (require.main === module) {
  testFacebookToken().then(() => {
    generateNewToken();
  });
}

module.exports = {
  testFacebookToken,
  updateToken,
  generateNewToken
};
