const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApiKey() {
  console.log('🔑 فحص API Key...');

  try {
    // جلب الإعدادات
    const { data: settings, error: settingsError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('❌ خطأ في جلب الإعدادات:', settingsError.message);
      return;
    }

    console.log('📋 الإعدادات:');
    console.log('- API Key:', settings.api_key ? `${settings.api_key.substring(0, 10)}...` : 'غير موجود');
    console.log('- Model:', settings.model);
    console.log('- Enabled:', settings.is_enabled);

    if (!settings.api_key || settings.api_key === 'your_gemini_api_key_here') {
      console.log('⚠️ API Key غير صحيح! يجب إضافة API Key حقيقي');
      console.log('💡 اذهب للإعدادات وأضف API Key من Google AI Studio');
      return;
    }

    // اختبار API Key
    console.log('\n🧪 اختبار API Key...');
    
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'مرحبا، هذا اختبار' }] }]
        })
      }
    );

    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ API Key يعمل بشكل صحيح!');
      console.log('🤖 رد تجريبي:', data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) + '...');
    } else {
      const errorData = await testResponse.text();
      console.log('❌ API Key لا يعمل:', testResponse.status);
      console.log('📝 تفاصيل الخطأ:', errorData.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

checkApiKey().catch(console.error);
