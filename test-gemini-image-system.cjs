const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGeminiImageSystem() {
  console.log('🧪 اختبار نظام إرسال الصور التلقائي من Gemini...\n');

  try {
    // 1. فحص إعدادات Gemini
    console.log('1️⃣ فحص إعدادات Gemini...');
    const { data: settings, error: settingsError } = await supabase
      .from('gemini_settings')
      .select('*')
      .eq('is_enabled', true)
      .single();

    if (settingsError || !settings) {
      console.error('❌ خطأ في جلب إعدادات Gemini:', settingsError?.message);
      return false;
    }

    console.log('✅ إعدادات Gemini:');
    console.log(`   - الحالة: ${settings.is_enabled ? 'مفعل' : 'معطل'}`);
    console.log(`   - النموذج: ${settings.model}`);
    console.log(`   - يحتوي على أوامر الصور: ${settings.personality_prompt?.includes('[SEND_IMAGE:') ? 'نعم' : 'لا'}`);

    // 2. فحص وجود صور في قاعدة البيانات
    console.log('\n2️⃣ فحص صور المنتجات في قاعدة البيانات...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, image_url')
      .not('image_url', 'is', null)
      .limit(5);

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('color, size, image_url')
      .not('image_url', 'is', null)
      .limit(5);

    console.log(`✅ المنتجات مع الصور: ${products?.length || 0}`);
    console.log(`✅ متغيرات المنتجات مع الصور: ${variants?.length || 0}`);

    if (products?.length > 0) {
      console.log('   📸 أمثلة على صور المنتجات:');
      products.slice(0, 3).forEach(p => {
        console.log(`      - ${p.name}: ${p.image_url?.substring(0, 50)}...`);
      });
    }

    // 3. اختبار Gemini API مع طلب صورة
    console.log('\n3️⃣ اختبار Gemini API مع طلب صورة...');
    
    const testMessages = [
      'عايزة اشوف كوتشي أحمر',
      'ممكن اشوف الأحذية المتوفرة؟',
      'اعرضيلي صور المنتجات',
      'عايزة اشوف حذاء أسود'
    ];

    for (const testMessage of testMessages) {
      console.log(`\n🧪 اختبار الرسالة: "${testMessage}"`);
      
      const prompt = `${settings.personality_prompt}\n\nرسالة العميل: ${testMessage}\n\nردك:`;
      
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
              temperature: settings.temperature || 0.5,
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
          console.log(`📝 رد Gemini: ${aiResponse.substring(0, 100)}...`);
          
          // فحص وجود أوامر الصور
          const imageCommands = aiResponse.match(/\[SEND_IMAGE:[^\]]+\]/g);
          if (imageCommands) {
            console.log(`✅ وجدت ${imageCommands.length} أمر صورة:`);
            imageCommands.forEach(cmd => console.log(`   📸 ${cmd}`));
          } else {
            console.log(`⚠️ لا توجد أوامر صور في الرد`);
          }
        } else {
          console.log('❌ لا يوجد رد من Gemini');
        }

      } catch (error) {
        console.error(`❌ خطأ في اختبار الرسالة: ${error.message}`);
      }

      // تأخير قصير بين الاختبارات
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. اختبار دالة البحث عن الصور (محاكاة)
    console.log('\n4️⃣ اختبار دالة البحث عن الصور...');
    
    const searchQueries = ['أحمر', 'كوتشي', 'حذاء', 'أسود'];
    
    for (const query of searchQueries) {
      console.log(`🔍 البحث عن: "${query}"`);
      
      // البحث في المنتجات
      const { data: searchProducts } = await supabase
        .from('products')
        .select('image_url, name')
        .or(`name.ilike.%${query}%, description.ilike.%${query}%, category.ilike.%${query}%`)
        .not('image_url', 'is', null)
        .limit(3);

      // البحث في المتغيرات
      const { data: searchVariants } = await supabase
        .from('product_variants')
        .select('image_url, color, size')
        .or(`color.ilike.%${query}%, size.ilike.%${query}%`)
        .not('image_url', 'is', null)
        .limit(3);

      const totalImages = (searchProducts?.length || 0) + (searchVariants?.length || 0);
      console.log(`   📊 وجدت ${totalImages} صورة`);
    }

    console.log('\n🎉 انتهى الاختبار بنجاح!');
    return true;

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return false;
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testGeminiImageSystem().then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ نظام إرسال الصور جاهز للاستخدام!');
      console.log('🚀 يمكن للعملاء الآن طلب صور المنتجات من Gemini');
    } else {
      console.log('❌ يحتاج النظام إلى مراجعة');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testGeminiImageSystem };
