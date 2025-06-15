const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleTest() {
  console.log('🧪 اختبار بسيط للنظام الهجين...');

  try {
    // 1. فحص إعدادات Gemini
    console.log('1️⃣ فحص إعدادات Gemini...');
    
    const { data: settings, error: settingsError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('❌ خطأ في جلب الإعدادات:', settingsError.message);
      return;
    }

    console.log('✅ إعدادات Gemini:');
    console.log('- Enabled:', settings.is_enabled);
    console.log('- Model:', settings.model);
    console.log('- Max Tokens:', settings.max_tokens);
    console.log('- Temperature:', settings.temperature);
    console.log('- Prompt Length:', settings.prompt_template.length);

    // 2. اختبار API مباشر
    console.log('\n2️⃣ اختبار API مباشر...');

    const testMessages = [
      { type: 'عادي', message: 'إزيك؟' },
      { type: 'منتجات', message: 'عايزة اشوف المنتجات' }
    ];

    for (const test of testMessages) {
      console.log(`\n🧪 اختبار ${test.type}: "${test.message}"`);

      try {
        const response = await fetch('http://localhost:3002/api/gemini/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            senderId: 'test-user',
            messageText: test.message,
            pageId: 'test-page'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ تم معالجة الرسالة بنجاح');
        } else {
          console.log('❌ فشل في معالجة الرسالة:', result.message);
        }
      } catch (error) {
        console.error('❌ خطأ في API:', error.message);
      }

      // انتظار قصير
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎉 اكتمل الاختبار البسيط!');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

simpleTest().catch(console.error);
