import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './output.css'

console.log('🚀 بدء تحميل التطبيق...');

// إزالة محتوى التحميل الافتراضي
const loadingContent = document.querySelector('.loading');
if (loadingContent) {
  console.log('🔄 إزالة محتوى التحميل...');
  loadingContent.remove();
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ لم يتم العثور على عنصر root');
  document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">❌ خطأ: لم يتم العثور على عنصر root</h1>';
} else {
  console.log('✅ تم العثور على عنصر root');

  // تنظيف محتوى root
  rootElement.innerHTML = '';

  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('✅ تم تحميل التطبيق بنجاح');
  } catch (error) {
    console.error('❌ خطأ في تحميل التطبيق:', error);
    rootElement.innerHTML = `<h1 style="color: red; text-align: center; margin-top: 50px;">❌ خطأ في تحميل التطبيق: ${error}</h1>`;
  }
}
