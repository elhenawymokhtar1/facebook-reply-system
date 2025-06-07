// اختبار مباشر للمعالج الجديد
import { GeminiMessageProcessor } from './src/services/geminiMessageProcessor.js';

async function testProcessorDirect() {
  console.log('🧪 اختبار مباشر للمعالج الجديد...\n');

  try {
    console.log('🚀 استدعاء المعالج مباشرة...');
    
    const result = await GeminiMessageProcessor.processIncomingMessage(
      'مرحبا، عايز أعرف الأسعار',
      'temp_test_123_' + Date.now(),
      'test_user_direct_123'
    );

    console.log('📥 نتيجة المعالج:', result);

    if (result) {
      console.log('✅ المعالج يعمل بنجاح!');
    } else {
      console.log('❌ المعالج فشل في المعالجة');
    }

    return result;

  } catch (error) {
    console.error('❌ خطأ في اختبار المعالج:', error);
    return false;
  }
}

// تشغيل الاختبار
testProcessorDirect().then((success) => {
  console.log(`\n${success ? '🎉' : '❌'} انتهى اختبار المعالج المباشر`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ خطأ:', error);
  process.exit(1);
});
