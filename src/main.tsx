import React from 'react';

console.log('🚀 بدء تحميل التطبيق...');

// اختبار بسيط أولاً
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ لم يتم العثور على عنصر root');
  document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">❌ خطأ: لم يتم العثور على عنصر root</h1>';
} else {
  console.log('✅ تم العثور على عنصر root');

  // تنظيف محتوى root
  rootElement.innerHTML = '';

  // اختبار بسيط بدون React أولاً
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'Cairo', sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <div>
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">
          ✅ JavaScript يعمل!
        </h1>
        <p style="font-size: 1.5rem; margin-bottom: 2rem;">
          الآن سنحاول تحميل React...
        </p>
        <div id="react-status">🔄 جاري تحميل React...</div>
      </div>
    </div>
  `;

  // الآن نحاول تحميل React
  setTimeout(async () => {
    try {
      console.log('🔄 محاولة تحميل React...');

      const { createRoot } = await import('react-dom/client');
      console.log('✅ تم تحميل react-dom/client');

      const App = await import('./App.tsx');
      console.log('✅ تم تحميل App.tsx');

      await import('./output.css');
      console.log('✅ تم تحميل CSS');

      const root = createRoot(rootElement);
      root.render(React.createElement(App.default));
      console.log('✅ تم تحميل التطبيق بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تحميل React:', error);
      document.getElementById('react-status').innerHTML = `❌ خطأ: ${error.message}`;

      // إضافة رابط للنسخة البسيطة
      setTimeout(() => {
        rootElement.innerHTML += `
          <div style="margin-top: 2rem;">
            <a href="/simple-chat.html" style="
              background: #4ade80;
              color: white;
              padding: 15px 30px;
              border-radius: 10px;
              text-decoration: none;
              font-size: 1.2rem;
            ">
              🔗 الذهاب للنسخة البسيطة
            </a>
          </div>
        `;
      }, 2000);
    }
  }, 1000);
}
