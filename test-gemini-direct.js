// اختبار Gemini AI مباشرة
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGeminiDirect() {
  console.log('🧪 اختبار Gemini AI مباشرة...\n');

  try {
    // 1. جلب إعدادات Gemini
    console.log('1️⃣ جلب إعدادات Gemini...');
    const { data: settings, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ خطأ في جلب الإعدادات:', error);
      return;
    }

    if (!settings) {
      console.log('❌ لا توجد إعدادات Gemini');
      return;
    }

    console.log('✅ إعدادات Gemini:', {
      enabled: settings.is_enabled,
      model: settings.model,
      hasApiKey: !!settings.api_key,
      promptLength: settings.prompt_template?.length || 0
    });

    if (!settings.is_enabled) {
      console.log('⚠️ Gemini AI معطل');
      return;
    }

    // 2. اختبار API مباشرة
    console.log('\n2️⃣ اختبار Gemini API مباشرة...');
    
    const testMessage = 'مرحبا، عايز أعرف الأسعار';
    const prompt = settings.prompt_template + '\n\nرسالة العميل الحالية: ' + testMessage + '\n\nردك:';

    console.log('📝 البرومبت المرسل:', prompt.substring(0, 200) + '...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.max_tokens,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', response.status, errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ Gemini API Response received');

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const candidate = data.candidates[0];
      
      if (candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0] && candidate.content.parts[0].text) {
        const generatedText = candidate.content.parts[0].text;
        console.log('\n📤 رد Gemini:');
        console.log('─'.repeat(50));
        console.log(generatedText);
        console.log('─'.repeat(50));

        // فحص إذا كان الرد يحتوي على "سوان شوب" أم "سولا 127"
        if (generatedText.includes('سوان شوب')) {
          console.log('\n✅ الرد يستخدم "سوان شوب" - البرومبت محدث بنجاح!');
        } else if (generatedText.includes('سولا 127')) {
          console.log('\n⚠️ الرد يستخدم "سولا 127" - البرومبت لا يزال قديم!');
        } else {
          console.log('\n❓ الرد لا يحتوي على اسم المتجر');
        }

        return true;
      } else {
        console.error('❌ Invalid response structure - parts not found');
        return false;
      }
    } else {
      console.error('❌ Invalid response structure - candidates not found');
      return false;
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
    return false;
  }
}

// تشغيل الاختبار
testGeminiDirect().then((success) => {
  console.log(`\n${success ? '✅' : '❌'} انتهى اختبار Gemini AI`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
