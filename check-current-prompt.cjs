const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentPrompt() {
  try {
    console.log('🔍 فحص البرومت الحالي...\n');
    
    // جلب البرومت من gemini_settings
    const { data: geminiSettings, error: geminiError } = await supabase
      .from('gemini_settings')
      .select('personality_prompt, is_enabled')
      .single();

    if (geminiError) {
      console.error('❌ خطأ في جلب gemini_settings:', geminiError.message);
      return;
    }

    console.log('📄 البرومت من gemini_settings:');
    console.log('- الحالة:', geminiSettings.is_enabled ? 'مفعل ✅' : 'معطل ❌');
    console.log('- طول البرومت:', geminiSettings.personality_prompt?.length || 0, 'حرف');
    console.log('- يحتوي على SEND_IMAGE:', geminiSettings.personality_prompt?.includes('[SEND_IMAGE:') ? 'نعم ✅' : 'لا ❌');
    
    if (geminiSettings.personality_prompt) {
      console.log('\n📝 أول 200 حرف من البرومت:');
      console.log(geminiSettings.personality_prompt.substring(0, 200) + '...');
      
      // البحث عن أوامر الصور
      const imageCommands = geminiSettings.personality_prompt.match(/\[SEND_IMAGE[^\]]*\]/g);
      if (imageCommands) {
        console.log('\n📸 أوامر الصور الموجودة:');
        imageCommands.forEach(cmd => console.log(`   - ${cmd}`));
      } else {
        console.log('\n❌ لا توجد أوامر صور في البرومت!');
      }
    }

    // فحص whatsapp_ai_settings أيضاً
    console.log('\n🔍 فحص whatsapp_ai_settings...');
    
    const { data: whatsappSettings, error: whatsappError } = await supabase
      .from('whatsapp_ai_settings')
      .select('use_existing_prompt, custom_prompt')
      .single();

    if (whatsappError) {
      console.error('❌ خطأ في جلب whatsapp_ai_settings:', whatsappError.message);
      return;
    }

    console.log('📱 إعدادات WhatsApp AI:');
    console.log('- استخدام البرومت الموجود:', whatsappSettings.use_existing_prompt ? 'نعم ✅' : 'لا ❌');
    
    if (!whatsappSettings.use_existing_prompt && whatsappSettings.custom_prompt) {
      console.log('- طول البرومت المخصص:', whatsappSettings.custom_prompt.length, 'حرف');
      console.log('- يحتوي على SEND_IMAGE:', whatsappSettings.custom_prompt.includes('[SEND_IMAGE:') ? 'نعم ✅' : 'لا ❌');
      
      console.log('\n📝 أول 200 حرف من البرومت المخصص:');
      console.log(whatsappSettings.custom_prompt.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ خطأ في فحص البرومت:', error.message);
  }
}

// تشغيل الفحص
if (require.main === module) {
  checkCurrentPrompt().then(() => {
    console.log('\n✅ انتهى فحص البرومت');
    process.exit(0);
  });
}

module.exports = { checkCurrentPrompt };
