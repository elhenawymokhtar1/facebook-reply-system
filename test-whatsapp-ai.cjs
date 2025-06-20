async function testWhatsAppAI() {
  try {
    console.log('🧪 اختبار WhatsApp AI API...');

    const testMessage = 'مرحبا';

    // إعدادات الاختبار
    const testSettings = {
      is_enabled: true,
      use_existing_prompt: false,
      custom_prompt: 'أنت مساعد ودود لمتجر. رد بطريقة مهذبة ومفيدة.',
      api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU',
      model: 'gemini-1.5-flash',
      temperature: 0.5,
      max_tokens: 300,
      can_access_orders: true,
      can_access_products: true,
      auto_reply_enabled: true
    };

    const response = await fetch('http://localhost:3002/api/whatsapp-baileys/test-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage,
        settings: testSettings
      })
    });
    
    console.log('📡 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API خطأ:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ WhatsApp AI يعمل بشكل صحيح!');
      if (data.response) {
        console.log('🤖 الرد:', data.response);
      }
    } else {
      console.log('❌ WhatsApp AI لا يعمل:', data.error);
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار WhatsApp AI:', error);
  }
}

async function testDirectMessage() {
  try {
    console.log('\n🧪 اختبار معالجة رسالة مباشرة...');

    const testMessage = 'كام سعر الحذاء؟';
    const phoneNumber = '201234567890';

    // اختبار إرسال رسالة مباشرة
    const response = await fetch('http://localhost:3002/api/whatsapp-baileys/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        message: testMessage
      })
    });
    
    console.log('📡 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API خطأ:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ معالجة الرسالة نجحت!');
      if (data.response) {
        console.log('🤖 الرد:', data.response);
      }
    } else {
      console.log('❌ فشل في معالجة الرسالة:', data.error);
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار معالجة الرسالة:', error);
  }
}

async function testWhatsAppAIService() {
  try {
    console.log('\n🧪 اختبار WhatsApp AI Service مباشرة...');

    const { createClient } = require('@supabase/supabase-js');

    // إعداد Supabase
    const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // محاكاة WhatsApp AI Service
    const testMessage = 'مرحبا، كام سعر الحذاء؟';
    const phoneNumber = '201234567890';

    // جلب إعدادات Gemini
    const { data: geminiSettings } = await supabase
      .from('gemini_settings')
      .select('*')
      .eq('is_enabled', true)
      .single();

    if (!geminiSettings) {
      console.log('❌ لا توجد إعدادات Gemini');
      return;
    }

    // بناء البرومت
    let prompt = geminiSettings.personality_prompt || '';

    if (geminiSettings.products_prompt) {
      prompt += '\n\n' + geminiSettings.products_prompt;
    }

    prompt += `\n\nمعلومات العميل:`;
    prompt += `\n- رقم الهاتف: ${phoneNumber}`;
    prompt += `\n\nرسالة العميل: ${testMessage}`;
    prompt += `\n\nردك:`;

    console.log('🤖 إرسال طلب إلى Gemini...');

    // استدعاء Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiSettings.model}:generateContent?key=${geminiSettings.api_key}`, {
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
          temperature: parseFloat(geminiSettings.temperature) || 0.5,
          maxOutputTokens: geminiSettings.max_tokens || 300,
        }
      })
    });

    if (!response.ok) {
      console.error('❌ Gemini API خطأ:', response.status);
      return;
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponse) {
      console.log('✅ WhatsApp AI Service يعمل بشكل صحيح!');
      console.log('🤖 الرد:', aiResponse);
    } else {
      console.log('❌ لا يوجد رد من Gemini');
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار WhatsApp AI Service:', error);
  }
}

// تشغيل الاختبارات
if (require.main === module) {
  testWhatsAppAI().then(() => {
    return testDirectMessage();
  }).then(() => {
    return testWhatsAppAIService();
  });
}

module.exports = {
  testWhatsAppAI,
  testDirectMessage,
  testWhatsAppAIService
};
