// اختبار الأداء والسرعة للإصلاحات الجديدة
async function testPerformance() {
  console.log('⚡ اختبار الأداء والسرعة...\n');

  const tests = [
    {
      name: 'جلب الإعدادات',
      url: 'http://localhost:3002/api/gemini/settings',
      method: 'GET'
    },
    {
      name: 'اختبار الاتصال',
      url: 'http://localhost:3002/api/gemini/test',
      method: 'POST',
      body: { api_key: 'AIzaSyCeL3A69LBZvsuHmtIXd_s0AoGRCzwvBVU' }
    },
    {
      name: 'اختبار بسيط',
      url: 'http://localhost:3002/api/gemini/test',
      method: 'GET'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🧪 اختبار: ${test.name}`);
    const startTime = Date.now();

    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const success = response.ok;
      results.push({
        name: test.name,
        duration,
        success,
        status: response.status
      });

      console.log(`   ${success ? '✅' : '❌'} ${duration}ms - Status: ${response.status}`);

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        name: test.name,
        duration,
        success: false,
        error: error.message
      });

      console.log(`   ❌ ${duration}ms - Error: ${error.message}`);
    }

    // انتظار قصير بين الاختبارات
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // تحليل النتائج
  console.log('\n📊 تحليل النتائج:');
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;

  console.log(`✅ اختبارات ناجحة: ${successfulTests.length}/${results.length}`);
  console.log(`❌ اختبارات فاشلة: ${failedTests.length}/${results.length}`);
  console.log(`⏱️ متوسط وقت الاستجابة: ${Math.round(avgDuration)}ms`);

  // تقييم الأداء
  if (avgDuration < 1000) {
    console.log('🚀 الأداء ممتاز (أقل من ثانية واحدة)');
  } else if (avgDuration < 3000) {
    console.log('✅ الأداء جيد (1-3 ثوانٍ)');
  } else {
    console.log('⚠️ الأداء يحتاج تحسين (أكثر من 3 ثوانٍ)');
  }

  return {
    totalTests: results.length,
    successfulTests: successfulTests.length,
    failedTests: failedTests.length,
    averageDuration: Math.round(avgDuration),
    results
  };
}

// تشغيل اختبار الأداء
testPerformance().then((summary) => {
  console.log('\n🎯 ملخص اختبار الأداء:');
  console.log(`   📊 إجمالي الاختبارات: ${summary.totalTests}`);
  console.log(`   ✅ ناجحة: ${summary.successfulTests}`);
  console.log(`   ❌ فاشلة: ${summary.failedTests}`);
  console.log(`   ⏱️ متوسط الوقت: ${summary.averageDuration}ms`);
  
  const successRate = (summary.successfulTests / summary.totalTests) * 100;
  console.log(`   📈 معدل النجاح: ${successRate.toFixed(1)}%`);

  if (successRate >= 80 && summary.averageDuration < 2000) {
    console.log('\n🎉 الأداء ممتاز! الإصلاحات تعمل بكفاءة عالية');
  } else if (successRate >= 60) {
    console.log('\n✅ الأداء جيد، مع إمكانية للتحسين');
  } else {
    console.log('\n⚠️ الأداء يحتاج مراجعة وتحسين');
  }

  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في اختبار الأداء:', error);
  process.exit(1);
});
