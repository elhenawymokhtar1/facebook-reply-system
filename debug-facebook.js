// أداة تشخيص سريعة لفحص إعدادات Facebook
import { createClient } from '@supabase/supabase-js';

// إعدادات Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFacebookSettings() {
  console.log('🔍 فحص إعدادات Facebook...\n');

  try {
    // 1. فحص جميع الصفحات المربوطة
    console.log('📋 الصفحات المربوطة:');
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('*');

    if (pagesError) {
      console.error('❌ خطأ في جلب الصفحات:', pagesError);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log('❌ لا توجد صفحات مربوطة');
      return;
    }

    pages.forEach((page, index) => {
      console.log(`\n${index + 1}. ${page.page_name || 'بدون اسم'}`);
      console.log(`   📄 Page ID: ${page.page_id}`);
      console.log(`   🔑 Token: ${page.access_token ? page.access_token.substring(0, 10) + '...' : 'غير موجود'}`);
      console.log(`   📅 تاريخ الإنشاء: ${new Date(page.created_at).toLocaleString('ar-EG')}`);
      console.log(`   ✅ نشط: نعم`);
    });

    // 2. فحص المحادثات الحديثة
    console.log('\n\n💬 المحادثات الحديثة:');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(5);

    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError);
    } else if (conversations && conversations.length > 0) {
      conversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. ${conv.customer_name}`);
        console.log(`   👤 Customer ID: ${conv.customer_facebook_id}`);
        console.log(`   📄 Page ID: ${conv.page_id}`);
        console.log(`   💬 آخر رسالة: ${conv.last_message || 'لا توجد'}`);
        console.log(`   📅 وقت آخر رسالة: ${new Date(conv.last_message_at).toLocaleString('ar-EG')}`);
      });
    } else {
      console.log('❌ لا توجد محادثات');
    }

    // 3. اختبار Access Token للصفحة الثانية
    console.log('\n\n🧪 اختبار Access Tokens:');
    for (const page of pages) {
      console.log(`\n🔍 اختبار صفحة: ${page.page_name} (${page.page_id})`);

      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${page.access_token}`);
        const data = await response.json();

        if (response.ok && !data.error) {
          console.log(`   ✅ Token صحيح - الاسم: ${data.name}`);
          console.log(`   📄 ID: ${data.id}`);
          console.log(`   🏷️ النوع: ${data.category || 'غير محدد'}`);
        } else {
          console.log(`   ❌ Token غير صحيح:`, data.error?.message || 'خطأ غير معروف');
        }
      } catch (error) {
        console.log(`   ❌ خطأ في الاتصال:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// إضافة الصفحة الثانية
async function addSecondPage() {
  console.log('\n🔧 إضافة الصفحة الثانية...');

  const { data, error } = await supabase
    .from('facebook_settings')
    .upsert({
      page_id: '260345600493273',
      access_token: 'EAAUpPO0SIEABO9ihG4UZBS1qLGUzMDGxcZAJP0SZAm9jYfLv6O6SmTQNmEYaXRW6rH8zMT6Iiu57wJRUZC9ipGlCF5y0bBFeJvU45DqfZAiqCuplQC00G92hcOAZChINt6TJQxuAehClhABkR9wvkgENRnmecUMqw5wrYCQZCB48zD32U7reTZC3cl5imCaSkHsKXq0aZBj5auHkZCZAJcoY0gNnqd7',
      page_name: 'الصفحة الثانية',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'page_id'
    });

  if (error) {
    console.error('❌ خطأ في إضافة الصفحة:', error);
  } else {
    console.log('✅ تم إضافة الصفحة الثانية بنجاح');
  }
}

// تحديث page_id للمحادثات
async function updateConversationsPageId() {
  console.log('\n🔧 تحديث page_id للمحادثات...');

  // تحديث المحادثات للصفحة الثانية (بناءً على customer IDs من اللوج)
  const secondPageCustomers = [
    '28174130505519768',
    '7508737372516485'
  ];

  for (const customerId of secondPageCustomers) {
    const { error } = await supabase
      .from('conversations')
      .update({ page_id: '260345600493273' })
      .eq('customer_facebook_id', customerId);

    if (error) {
      console.error(`❌ خطأ في تحديث المحادثة ${customerId}:`, error);
    } else {
      console.log(`✅ تم تحديث المحادثة ${customerId}`);
    }
  }

  // تحديث باقي المحادثات للصفحة الأولى
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ page_id: '240244019177739' })
    .is('page_id', null);

  if (updateError) {
    console.error('❌ خطأ في تحديث المحادثات:', updateError);
  } else {
    console.log('✅ تم تحديث باقي المحادثات للصفحة الأولى');
  }
}

// تشغيل التشخيص والإصلاح
async function runDiagnosisAndFix() {
  await debugFacebookSettings();
  await addSecondPage();
  await updateConversationsPageId();
  console.log('\n🎯 إعادة تشغيل التشخيص...');
  await debugFacebookSettings();
}

runDiagnosisAndFix().then(() => {
  console.log('\n✅ انتهى التشخيص والإصلاح');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في التشخيص:', error);
  process.exit(1);
});
