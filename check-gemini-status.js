// فحص حالة Gemini AI الحالية
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGeminiStatus() {
  console.log('🔍 فحص حالة Gemini AI...\n');

  try {
    // جلب الإعدادات الحالية
    const { data, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ خطأ في جلب الإعدادات:', error);
      return;
    }

    if (!data) {
      console.log('❌ لا توجد إعدادات Gemini');
      return;
    }

    console.log('📋 إعدادات Gemini الحالية:');
    console.log(`   🤖 مفعل: ${data.is_enabled ? '✅ نعم' : '❌ لا'}`);
    console.log(`   🔑 API Key: ${data.api_key ? data.api_key.substring(0, 15) + '...' : '❌ غير موجود'}`);
    console.log(`   🧠 النموذج: ${data.model}`);
    console.log(`   🎯 Max Tokens: ${data.max_tokens}`);
    console.log(`   🌡️ Temperature: ${data.temperature}`);
    console.log(`   📅 آخر تحديث: ${new Date(data.updated_at).toLocaleString('ar-EG')}`);
    
    console.log('\n📝 البرومبت:');
    console.log('─'.repeat(50));
    console.log(data.prompt_template);
    console.log('─'.repeat(50));

    // فحص إذا كان البرومبت يحتوي على "سوان شوب" أم "سولا 127"
    if (data.prompt_template.includes('سوان شوب')) {
      console.log('\n✅ البرومبت محدث بنجاح - يستخدم "سوان شوب"');
    } else if (data.prompt_template.includes('سولا 127')) {
      console.log('\n⚠️ البرومبت لا يزال قديم - يستخدم "سولا 127"');
    } else {
      console.log('\n❓ البرومبت غير واضح');
    }

    // اختبار الاتصال مع Gemini API
    console.log('\n🧪 اختبار الاتصال مع Gemini API...');
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${data.model}:generateContent?key=${data.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'مرحبا، اختبار بسيط'
            }]
          }],
          generationConfig: {
            temperature: data.temperature,
            maxOutputTokens: 100
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          console.log('✅ الاتصال مع Gemini API يعمل بنجاح');
          console.log('📤 رد تجريبي:', result.candidates[0].content.parts[0].text.substring(0, 100) + '...');
        } else {
          console.log('⚠️ الاتصال يعمل لكن الرد غير متوقع');
        }
      } else {
        console.log('❌ فشل الاتصال مع Gemini API:', response.status);
      }
    } catch (apiError) {
      console.log('❌ خطأ في اختبار API:', apiError.message);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الفحص
checkGeminiStatus().then(() => {
  console.log('\n✅ انتهى فحص حالة Gemini AI');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
