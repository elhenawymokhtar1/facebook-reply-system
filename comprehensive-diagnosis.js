// تشخيص شامل لصفحة المحادثات
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveDiagnosis() {
  console.log('🔍 بدء التشخيص الشامل لصفحة المحادثات...\n');

  const issues = [];
  const warnings = [];
  const successes = [];

  try {
    // 1. فحص الاتصال بـ Supabase
    console.log('1️⃣ فحص الاتصال بـ Supabase...');
    try {
      const { data, error } = await supabase.from('conversations').select('count').limit(1);
      if (error) throw error;
      successes.push('✅ الاتصال بـ Supabase يعمل بنجاح');
    } catch (error) {
      issues.push(`❌ فشل الاتصال بـ Supabase: ${error.message}`);
    }

    // 2. فحص جدول المحادثات
    console.log('2️⃣ فحص جدول المحادثات...');
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(10);

      if (error) throw error;

      if (!conversations || conversations.length === 0) {
        warnings.push('⚠️ لا توجد محادثات في قاعدة البيانات');
      } else {
        successes.push(`✅ تم العثور على ${conversations.length} محادثة`);

        // فحص بنية البيانات
        const firstConv = conversations[0];
        const requiredFields = ['id', 'customer_name', 'customer_facebook_id', 'facebook_page_id'];
        const missingFields = requiredFields.filter(field => !firstConv[field]);
        
        if (missingFields.length > 0) {
          issues.push(`❌ حقول مفقودة في المحادثات: ${missingFields.join(', ')}`);
        } else {
          successes.push('✅ بنية بيانات المحادثات صحيحة');
        }

        // فحص المحادثات بدون facebook_page_id
        const conversationsWithoutPageId = conversations.filter(c => !c.facebook_page_id);
        if (conversationsWithoutPageId.length > 0) {
          warnings.push(`⚠️ ${conversationsWithoutPageId.length} محادثة بدون facebook_page_id`);
        }
      }
    } catch (error) {
      issues.push(`❌ خطأ في فحص جدول المحادثات: ${error.message}`);
    }

    // 3. فحص جدول الرسائل
    console.log('3️⃣ فحص جدول الرسائل...');
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .limit(10);

      if (error) throw error;

      if (!messages || messages.length === 0) {
        warnings.push('⚠️ لا توجد رسائل في قاعدة البيانات');
      } else {
        successes.push(`✅ تم العثور على ${messages.length} رسالة`);

        // فحص بنية الرسائل
        const firstMessage = messages[0];
        const requiredMessageFields = ['id', 'conversation_id', 'content', 'sender_type'];
        const missingMessageFields = requiredMessageFields.filter(field => !firstMessage[field]);
        
        if (missingMessageFields.length > 0) {
          issues.push(`❌ حقول مفقودة في الرسائل: ${missingMessageFields.join(', ')}`);
        } else {
          successes.push('✅ بنية بيانات الرسائل صحيحة');
        }
      }
    } catch (error) {
      issues.push(`❌ خطأ في فحص جدول الرسائل: ${error.message}`);
    }

    // 4. فحص إعدادات Facebook
    console.log('4️⃣ فحص إعدادات Facebook...');
    try {
      const { data: facebookSettings, error } = await supabase
        .from('facebook_settings')
        .select('*');

      if (error) throw error;

      if (!facebookSettings || facebookSettings.length === 0) {
        issues.push('❌ لا توجد إعدادات Facebook');
      } else {
        successes.push(`✅ تم العثور على ${facebookSettings.length} صفحة Facebook`);

        // فحص صحة Access Tokens
        for (const page of facebookSettings) {
          try {
            const response = await fetch(
              `https://graph.facebook.com/v18.0/me?access_token=${page.access_token}`
            );
            const data = await response.json();

            if (response.ok && !data.error) {
              successes.push(`✅ Access Token صالح للصفحة: ${page.page_name}`);
            } else {
              issues.push(`❌ Access Token غير صالح للصفحة: ${page.page_name} - ${data.error?.message}`);
            }
          } catch (error) {
            issues.push(`❌ خطأ في فحص Access Token للصفحة: ${page.page_name}`);
          }
        }
      }
    } catch (error) {
      issues.push(`❌ خطأ في فحص إعدادات Facebook: ${error.message}`);
    }

    // 5. فحص إعدادات Gemini
    console.log('5️⃣ فحص إعدادات Gemini...');
    try {
      const { data: geminiSettings, error } = await supabase
        .from('gemini_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!geminiSettings) {
        warnings.push('⚠️ لا توجد إعدادات Gemini AI');
      } else {
        successes.push(`✅ إعدادات Gemini AI موجودة - الحالة: ${geminiSettings.is_enabled ? 'مفعل' : 'معطل'}`);
        
        if (geminiSettings.is_enabled && !geminiSettings.api_key) {
          issues.push('❌ Gemini AI مفعل لكن لا يوجد API key');
        }
      }
    } catch (error) {
      issues.push(`❌ خطأ في فحص إعدادات Gemini: ${error.message}`);
    }

    // 6. فحص ربط المحادثات بالصفحات
    console.log('6️⃣ فحص ربط المحادثات بالصفحات...');
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('facebook_page_id')
        .limit(10);

      if (error) throw error;

      if (conversations && conversations.length > 0) {
        const conversationsWithPageId = conversations.filter(c => c.facebook_page_id);
        const conversationsWithoutPageId = conversations.filter(c => !c.facebook_page_id);

        successes.push(`✅ ${conversationsWithPageId.length} محادثة مربوطة بصفحات Facebook`);

        if (conversationsWithoutPageId.length > 0) {
          warnings.push(`⚠️ ${conversationsWithoutPageId.length} محادثة بدون facebook_page_id`);
        }
      }
    } catch (error) {
      issues.push(`❌ خطأ في فحص ربط المحادثات بالصفحات: ${error.message}`);
    }

    // 7. فحص Real-time subscriptions
    console.log('7️⃣ فحص Real-time subscriptions...');
    try {
      const channel = supabase
        .channel('test-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            successes.push('✅ Real-time subscriptions تعمل بنجاح');
          } else if (status === 'CHANNEL_ERROR') {
            issues.push('❌ خطأ في Real-time subscriptions');
          }
        });

      // إزالة الاشتراك بعد ثانية
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 1000);
    } catch (error) {
      issues.push(`❌ خطأ في فحص Real-time subscriptions: ${error.message}`);
    }

    // 8. فحص Storage bucket للصور
    console.log('8️⃣ فحص Storage bucket للصور...');
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;

      const chatImagesBucket = buckets.find(b => b.name === 'chat-images');
      if (!chatImagesBucket) {
        warnings.push('⚠️ لا يوجد bucket للصور (chat-images)');
      } else {
        successes.push('✅ Storage bucket للصور موجود');

        // اختبار رفع صورة تجريبية
        try {
          const testData = new Uint8Array([1, 2, 3, 4, 5]);
          const testFileName = `test-${Date.now()}.txt`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(testFileName, testData);

          if (uploadError) {
            warnings.push(`⚠️ لا يمكن رفع الملفات في bucket الصور: ${uploadError.message}`);
          } else {
            successes.push('✅ رفع الملفات في bucket الصور يعمل بنجاح');

            // حذف الملف التجريبي
            await supabase.storage.from('chat-images').remove([testFileName]);
          }
        } catch (uploadTestError) {
          warnings.push(`⚠️ خطأ في اختبار رفع الملفات: ${uploadTestError.message}`);
        }
      }
    } catch (error) {
      issues.push(`❌ خطأ في فحص Storage bucket: ${error.message}`);
    }

  } catch (error) {
    issues.push(`❌ خطأ عام في التشخيص: ${error.message}`);
  }

  // عرض النتائج
  console.log('\n📊 نتائج التشخيص الشامل:');
  console.log('='.repeat(50));

  if (successes.length > 0) {
    console.log('\n🎉 الأمور التي تعمل بنجاح:');
    successes.forEach(success => console.log(`  ${success}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ التحذيرات:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }

  if (issues.length > 0) {
    console.log('\n❌ المشاكل التي تحتاج إصلاح:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  console.log('\n📈 ملخص النتائج:');
  console.log(`  ✅ نجح: ${successes.length}`);
  console.log(`  ⚠️ تحذيرات: ${warnings.length}`);
  console.log(`  ❌ مشاكل: ${issues.length}`);

  if (issues.length === 0) {
    console.log('\n🎉 لا توجد مشاكل حرجة! صفحة المحادثات جاهزة للاستخدام.');
  } else {
    console.log('\n🔧 يرجى إصلاح المشاكل المذكورة أعلاه.');
  }
}

// تشغيل التشخيص
comprehensiveDiagnosis().then(() => {
  console.log('\n🏁 انتهى التشخيص الشامل');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل التشخيص:', error);
  process.exit(1);
});
