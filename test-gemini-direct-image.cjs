const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGeminiDirectImage() {
  try {
    console.log('🧪 اختبار Gemini مباشرة مع طلب صورة...\n');
    
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
    console.log('- يحتوي على أوامر الصور:', settings.personality_prompt.includes('[SEND_IMAGE:') ? 'نعم ✅' : 'لا ❌');
    
    // اختبار رسائل مختلفة
    const testMessages = [
      'عايزة اشوف كوتشي أحمر',
      'ممكن اشوف الحذاء الأسود؟',
      'اعرضيلي صور الأحذية المتوفرة',
      'عايزة اشوف منتجات باللون البني'
    ];
    
    for (const testMessage of testMessages) {
      console.log(`\n🧪 اختبار الرسالة: "${testMessage}"`);
      
      const prompt = `${settings.personality_prompt}\n\nرسالة العميل: ${testMessage}\n\nردك (تذكري استخدام [SEND_IMAGE: وصف] عند طلب الصور):`;
      
      try {
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
        
        if (!response.ok) {
          console.error(`❌ خطأ في Gemini API: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (aiResponse) {
          console.log(`📝 رد Gemini:`);
          console.log(aiResponse);
          
          // فحص وجود أوامر الصور
          const imageCommands = aiResponse.match(/\[SEND_IMAGE:[^\]]+\]/g);
          if (imageCommands) {
            console.log(`\n✅ وجدت ${imageCommands.length} أمر صورة:`);
            imageCommands.forEach(cmd => console.log(`   📸 ${cmd}`));
          } else {
            console.log(`\n❌ لا توجد أوامر صور في الرد`);
            
            // فحص إذا كان يحتوي على كلمات مفتاحية للصور
            const imageKeywords = ['صورة', 'اشوف', 'اعرض', 'ممكن اشوف'];
            const hasImageRequest = imageKeywords.some(keyword => testMessage.includes(keyword));
            if (hasImageRequest) {
              console.log(`⚠️ الرسالة تطلب صورة لكن Gemini لم ينتج أمر SEND_IMAGE`);
            }
          }
        } else {
          console.log('❌ لا يوجد رد من Gemini');
        }
        
      } catch (error) {
        console.error(`❌ خطأ في اختبار الرسالة: ${error.message}`);
      }
      
      // تأخير قصير بين الاختبارات
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // اختبار مع تأكيد إضافي في البرومت
    console.log(`\n🔄 اختبار مع تأكيد إضافي...`);
    
    const explicitPrompt = `${settings.personality_prompt}

تذكري: عندما يطلب العميل رؤية صور، يجب أن تستخدمي أمر [SEND_IMAGE: وصف المنتج] في بداية ردك.

رسالة العميل: عايزة اشوف كوتشي أحمر

ردك (ابدئي بـ [SEND_IMAGE: كوتشي أحمر]):`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: explicitPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3, // أقل للحصول على نتائج أكثر اتساقاً
            maxOutputTokens: 300,
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (aiResponse) {
          console.log(`📝 رد Gemini مع التأكيد الإضافي:`);
          console.log(aiResponse);
          
          const imageCommands = aiResponse.match(/\[SEND_IMAGE:[^\]]+\]/g);
          if (imageCommands) {
            console.log(`\n🎉 نجح! وجدت ${imageCommands.length} أمر صورة:`);
            imageCommands.forEach(cmd => console.log(`   📸 ${cmd}`));
          } else {
            console.log(`\n❌ لا يزال لا ينتج أوامر صور`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ خطأ في الاختبار الإضافي: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Gemini:', error);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testGeminiDirectImage().then(() => {
    console.log('\n✅ انتهى اختبار Gemini المباشر');
    process.exit(0);
  });
}

module.exports = { testGeminiDirectImage };
