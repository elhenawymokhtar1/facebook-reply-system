const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGeminiAPI() {
  try {
    console.log('🧪 اختبار Gemini API...');
    
    // جلب إعدادات Gemini
    const { data: settings, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .eq('is_enabled', true)
      .single();
    
    if (error || !settings) {
      console.error('❌ خطأ في جلب إعدادات Gemini:', error);
      return;
    }
    
    console.log('📄 إعدادات Gemini:');
    console.log('- API Key:', settings.api_key.substring(0, 20) + '...');
    console.log('- Model:', settings.model);
    console.log('- Enabled:', settings.is_enabled);
    console.log('- Temperature:', settings.temperature);
    console.log('- Max Tokens:', settings.max_tokens);
    
    // اختبار API
    console.log('\n🤖 اختبار استدعاء Gemini API...');
    
    const testMessage = 'مرحبا، كيف حالك؟';
    const prompt = `${settings.personality_prompt}\n\nرسالة العميل: ${testMessage}\n\nردك:`;
    
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
          temperature: parseFloat(settings.temperature) || 0.5,
          maxOutputTokens: settings.max_tokens || 300,
        }
      })
    });
    
    console.log('📡 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API خطأ:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiResponse) {
      console.log('\n✅ Gemini API يعمل بشكل صحيح!');
      console.log('🤖 الرد:', aiResponse);
    } else {
      console.log('❌ لا يوجد رد من Gemini');
      console.log('📦 البيانات المستلمة:', data);
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Gemini:', error);
  }
}

async function testWhatsAppAISettings() {
  try {
    console.log('\n📱 فحص إعدادات WhatsApp AI...');
    
    const { data: settings, error } = await supabase
      .from('whatsapp_ai_settings')
      .select('*')
      .single();
    
    if (error || !settings) {
      console.error('❌ خطأ في جلب إعدادات WhatsApp AI:', error);
      return;
    }
    
    console.log('📄 إعدادات WhatsApp AI:');
    console.log('- Enabled:', settings.is_enabled);
    console.log('- Auto Reply:', settings.auto_reply_enabled);
    console.log('- Use Existing Prompt:', settings.use_existing_prompt);
    console.log('- API Key:', settings.api_key.substring(0, 20) + '...');
    console.log('- Model:', settings.model);
    console.log('- Temperature:', settings.temperature);
    console.log('- Max Tokens:', settings.max_tokens);
    
    if (settings.use_existing_prompt) {
      console.log('✅ النظام مضبوط لاستخدام البرومت الموجود');
    } else {
      console.log('⚠️ النظام مضبوط لاستخدام برومت مخصص');
      console.log('- Custom Prompt:', settings.custom_prompt.substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص إعدادات WhatsApp AI:', error);
  }
}

// تشغيل الاختبارات
if (require.main === module) {
  testGeminiAPI().then(() => {
    return testWhatsAppAISettings();
  });
}

module.exports = {
  testGeminiAPI,
  testWhatsAppAISettings
};
