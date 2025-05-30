// إنشاء Storage bucket للصور
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createStorageBucket() {
  console.log('🪣 إنشاء Storage bucket للصور...\n');

  try {
    // فحص إذا كان البucket موجود
    console.log('🔍 فحص البuckets الموجودة...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ خطأ في جلب قائمة البuckets:', listError);
      return;
    }

    console.log('📋 البuckets الموجودة:', buckets.map(b => b.name));

    const chatImagesBucket = buckets.find(b => b.name === 'chat-images');
    
    if (chatImagesBucket) {
      console.log('✅ البucket موجود بالفعل:', chatImagesBucket.name);
      
      // فحص إعدادات البucket
      console.log('🔍 فحص إعدادات البucket...');
      console.log('📋 تفاصيل البucket:', {
        name: chatImagesBucket.name,
        id: chatImagesBucket.id,
        public: chatImagesBucket.public,
        created_at: chatImagesBucket.created_at
      });
      
    } else {
      console.log('⚠️ البucket غير موجود، سيتم إنشاؤه...');
      
      // إنشاء البucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('chat-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('❌ خطأ في إنشاء البucket:', createError);
        
        // محاولة إنشاء البucket بدون خيارات متقدمة
        console.log('🔄 محاولة إنشاء البucket بطريقة بسيطة...');
        const { data: simpleBucket, error: simpleError } = await supabase.storage.createBucket('chat-images');
        
        if (simpleError) {
          console.error('❌ فشل في إنشاء البucket:', simpleError);
          return;
        } else {
          console.log('✅ تم إنشاء البucket بنجاح:', simpleBucket);
        }
      } else {
        console.log('✅ تم إنشاء البucket بنجاح:', newBucket);
      }
    }

    // اختبار رفع صورة تجريبية
    console.log('\n📤 اختبار رفع صورة تجريبية...');
    
    // إنشاء صورة تجريبية بسيطة (1x1 pixel PNG)
    const testImageData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testFileName = `test-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(testFileName, testImageData, {
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('❌ خطأ في رفع الصورة التجريبية:', uploadError);
    } else {
      console.log('✅ تم رفع الصورة التجريبية بنجاح:', uploadData.path);

      // الحصول على الرابط العام
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(testFileName);

      console.log('🔗 رابط الصورة التجريبية:', urlData.publicUrl);

      // حذف الصورة التجريبية
      console.log('🗑️ حذف الصورة التجريبية...');
      const { error: deleteError } = await supabase.storage
        .from('chat-images')
        .remove([testFileName]);

      if (deleteError) {
        console.error('⚠️ خطأ في حذف الصورة التجريبية:', deleteError);
      } else {
        console.log('✅ تم حذف الصورة التجريبية بنجاح');
      }
    }

    console.log('\n🎉 تم إعداد Storage bucket للصور بنجاح!');
    console.log('📋 يمكن الآن رفع الصور في المحادثات');

  } catch (error) {
    console.error('❌ خطأ عام في إعداد Storage bucket:', error);
  }
}

// تشغيل الإعداد
createStorageBucket().then(() => {
  console.log('\n🏁 انتهى إعداد Storage bucket');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الإعداد:', error);
  process.exit(1);
});
