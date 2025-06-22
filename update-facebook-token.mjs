import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFacebookToken() {
  console.log('🔧 أداة تحديث Facebook Access Token\n');
  
  try {
    // عرض الـ Token الحالي
    const { data: currentSettings, error } = await supabase
      .from('facebook_settings')
      .select('*')
      .single();
    
    if (error || !currentSettings) {
      console.error('❌ لا توجد إعدادات Facebook');
      return;
    }
    
    console.log('📋 الإعدادات الحالية:');
    console.log(`   - Page: ${currentSettings.page_name} (${currentSettings.page_id})`);
    console.log(`   - Token: ${currentSettings.access_token.substring(0, 20)}...`);
    console.log(`   - Active: ${currentSettings.is_active}`);
    
    // اختبار الـ Token الحالي
    console.log('\n🧪 اختبار الـ Token الحالي...');
    const testResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${currentSettings.access_token}`
    );
    
    const testData = await testResponse.json();
    
    if (testData.error) {
      console.error('❌ الـ Token الحالي لا يعمل:', testData.error.message);
      console.log('\n🔧 لتحديث الـ Token:');
      console.log('1. اذهب إلى: https://developers.facebook.com/');
      console.log('2. اختر تطبيقك');
      console.log('3. اذهب إلى Tools > Access Token Tool');
      console.log('4. احصل على Page Access Token جديد');
      console.log('5. انسخ الـ Token الجديد');
      console.log('6. شغل هذا الأمر مع الـ Token الجديد:');
      console.log(`   node update-facebook-token.mjs "NEW_TOKEN_HERE"`);
    } else {
      console.log('✅ الـ Token الحالي يعمل بشكل صحيح');
      console.log(`   - Name: ${testData.name}`);
      console.log(`   - ID: ${testData.id}`);
    }
    
    // إذا تم تمرير token جديد كمعامل
    const newToken = process.argv[2];
    if (newToken && newToken.length > 50) {
      console.log('\n🔄 تحديث الـ Token...');
      
      // اختبار الـ Token الجديد أولاً
      const newTestResponse = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${newToken}`
      );
      
      const newTestData = await newTestResponse.json();
      
      if (newTestData.error) {
        console.error('❌ الـ Token الجديد غير صحيح:', newTestData.error.message);
        return;
      }
      
      console.log('✅ الـ Token الجديد صحيح');
      console.log(`   - Name: ${newTestData.name}`);
      console.log(`   - ID: ${newTestData.id}`);
      
      // تحديث قاعدة البيانات
      const { error: updateError } = await supabase
        .from('facebook_settings')
        .update({
          access_token: newToken,
          updated_at: new Date().toISOString()
        })
        .eq('page_id', currentSettings.page_id);
      
      if (updateError) {
        console.error('❌ خطأ في تحديث قاعدة البيانات:', updateError);
        return;
      }
      
      console.log('🎉 تم تحديث Facebook Token بنجاح!');
      
      // اختبار إرسال صورة تجريبية
      console.log('\n🧪 اختبار إرسال صورة تجريبية...');
      const testImageUrl = 'https://via.placeholder.com/300x200/0084FF/FFFFFF?text=Test+Image';
      
      const imageResponse = await fetch('http://localhost:3002/api/facebook/send-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: newToken,
          recipient_id: '7503588439726595', // معرف تجريبي
          image_url: testImageUrl
        })
      });
      
      if (imageResponse.ok) {
        console.log('✅ اختبار إرسال الصورة نجح - النظام جاهز!');
      } else {
        const errorText = await imageResponse.text();
        console.log('⚠️ اختبار إرسال الصورة فشل (قد يكون بسبب معرف المستلم التجريبي)');
        console.log('   لكن الـ Token يعمل بشكل صحيح');
      }
      
    } else if (newToken) {
      console.log('\n❌ الـ Token المدخل قصير جداً. تأكد من نسخ الـ Token كاملاً');
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الأداة
updateFacebookToken();
