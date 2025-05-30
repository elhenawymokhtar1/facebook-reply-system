// سكريپت لفحص صلاحيات Facebook API وتجربة طرق مختلفة للحصول على أسماء المستخدمين
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

// فحص صلاحيات الـ access token
async function checkTokenPermissions(accessToken) {
  try {
    console.log('🔍 فحص صلاحيات الـ access token...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ صلاحيات الـ token:');
      data.data.forEach(permission => {
        console.log(`  - ${permission.permission}: ${permission.status}`);
      });
      return data.data;
    } else {
      const errorText = await response.text();
      console.error('❌ خطأ في فحص الصلاحيات:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في فحص الصلاحيات:', error);
    return null;
  }
}

// فحص معلومات الـ token
async function checkTokenInfo(accessToken) {
  try {
    console.log('\n🔍 فحص معلومات الـ token...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ معلومات الـ token:');
      console.log(`  - ID: ${data.id}`);
      console.log(`  - Name: ${data.name || 'غير متوفر'}`);
      console.log(`  - Category: ${data.category || 'غير متوفر'}`);
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ خطأ في فحص معلومات الـ token:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في فحص معلومات الـ token:', error);
    return null;
  }
}

// تجربة طرق مختلفة للحصول على معلومات المستخدم
async function tryDifferentMethods(userId, accessToken) {
  console.log(`\n🧪 تجربة طرق مختلفة للمستخدم: ${userId}`);
  
  const methods = [
    {
      name: 'الطريقة الأساسية',
      url: `https://graph.facebook.com/v18.0/${userId}?fields=id,name&access_token=${accessToken}`
    },
    {
      name: 'بدون fields',
      url: `https://graph.facebook.com/v18.0/${userId}?access_token=${accessToken}`
    },
    {
      name: 'مع first_name و last_name',
      url: `https://graph.facebook.com/v18.0/${userId}?fields=id,first_name,last_name&access_token=${accessToken}`
    },
    {
      name: 'من خلال المحادثات',
      url: `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${accessToken}`
    },
    {
      name: 'معلومات عامة فقط',
      url: `https://graph.facebook.com/v18.0/${userId}?fields=id&access_token=${accessToken}`
    }
  ];

  for (const method of methods) {
    try {
      console.log(`\n📋 ${method.name}:`);
      console.log(`   URL: ${method.url.split('?')[0]}`);
      
      const response = await fetch(method.url);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log('✅ نجح!');
        console.log('   البيانات:', JSON.stringify(data, null, 2));
        
        if (data.name || data.first_name) {
          return data;
        }
      } else {
        console.log('❌ فشل:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.error?.message || 'غير معروف'}`);
        console.log(`   Code: ${data.error?.code || 'غير معروف'}`);
        console.log(`   Subcode: ${data.error?.error_subcode || 'غير معروف'}`);
      }
      
      // انتظار قصير بين المحاولات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('❌ خطأ في الشبكة:', error.message);
    }
  }
  
  return null;
}

async function main() {
  console.log('🚀 بدء فحص Facebook API...\n');

  try {
    // الحصول على إعدادات الصفحات
    const { data: pages, error } = await supabase
      .from('facebook_settings')
      .select('*');

    if (error) {
      console.error('❌ خطأ في جلب إعدادات الصفحات:', error);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log('❌ لا توجد صفحات مربوطة');
      return;
    }

    for (const page of pages) {
      console.log(`\n📄 فحص الصفحة: ${page.page_name} (${page.page_id})`);
      console.log(`🔑 Access Token: ${page.access_token.substring(0, 20)}...`);
      
      // فحص صلاحيات الـ token
      await checkTokenPermissions(page.access_token);
      
      // فحص معلومات الـ token
      await checkTokenInfo(page.access_token);
      
      // تجربة مع مستخدم حقيقي
      const testUserId = '7360527560739644'; // مستخدم من قاعدة البيانات
      await tryDifferentMethods(testUserId, page.access_token);
      
      console.log('\n' + '='.repeat(80));
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل السكريپت
main().then(() => {
  console.log('\n🏁 انتهى فحص Facebook API');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل السكريپت:', error);
  process.exit(1);
});
